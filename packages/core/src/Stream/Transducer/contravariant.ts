import { flow } from "@principia/prelude";

import * as C from "../../Chunk";
import * as I from "../../IO";
import * as M from "../../Managed";
import * as O from "../../Option";
import { Transducer } from "./model";

/**
 * Transforms the inputs of this transducer.
 */
export function contramap_<R, E, I, O, J>(
  fa: Transducer<R, E, I, O>,
  f: (j: J) => I
): Transducer<R, E, J, O> {
  return new Transducer(M.map_(fa.push, (push) => (input) => push(O.map_(input, C.map(f)))));
}

/**
 * Transforms the inputs of this transducer.
 */
export function contramap<I, J>(
  f: (j: J) => I
): <R, E, O>(fa: Transducer<R, E, I, O>) => Transducer<R, E, J, O> {
  return (fa) => contramap_(fa, f);
}

/**
 * Effectually transforms the inputs of this transducer
 */
export function contramapM_<R, E, I, O, R1, E1, J>(
  fa: Transducer<R, E, I, O>,
  f: (j: J) => I.IO<R1, E1, I>
): Transducer<R & R1, E | E1, J, O> {
  return new Transducer(
    M.map_(fa.push, (push) => (is) =>
      O.fold_(
        is,
        () => push(O.none()),
        flow(
          I.foreach(f),
          I.chain((in_) => push(O.some(in_)))
        )
      )
    )
  );
}

/**
 * Effectually transforms the inputs of this transducer
 */
export function contramapM<R1, E1, I, J>(
  f: (j: J) => I.IO<R1, E1, I>
): <R, E, O>(fa: Transducer<R, E, I, O>) => Transducer<R & R1, E | E1, J, O> {
  return (fa) => contramapM_(fa, f);
}
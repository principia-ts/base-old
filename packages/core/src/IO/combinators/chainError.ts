import { chain } from "../_core";
import type { IO } from "../model";
import { swapWith_ } from "./swapWith";

export function chainError_<R, R1, E, E1, A>(
  ef: IO<R, E, A>,
  f: (e: E) => IO<R1, never, E1>
): IO<R & R1, E1, A> {
  return swapWith_(ef, chain(f));
}

export function chainError<E, R1, E1>(
  f: (e: E) => IO<R1, never, E1>
): <R, A>(ef: IO<R, E, A>) => IO<R & R1, E1, A> {
  return (ef) => chainError_(ef, f);
}
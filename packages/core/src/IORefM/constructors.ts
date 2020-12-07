import { pipe } from "../Function";
import * as I from "../IO/_core";
import * as S from "../IO/Semaphore";
import * as XR from "../IORef";
import * as M from "../Managed/_core";
import * as XQ from "../Queue";
import type { URefM } from "./model";
import { Atomic } from "./model";
import { tapInput } from "./tap";

/**
 * Creates a new `XRefM` with the specified value.
 */
export function make<A>(a: A): I.UIO<URefM<A>> {
  return pipe(
    I.do,
    I.bindS("ref", () => XR.make(a)),
    I.bindS("semaphore", () => S.make(1)),
    I.map(({ ref, semaphore }) => new Atomic(ref, semaphore))
  );
}

/**
 * Creates a new `XRefM` with the specified value.
 */
export function unsafeMake<A>(a: A): URefM<A> {
  const ref = XR.unsafeMake(a);
  const semaphore = S.unsafeMake(1);
  return new Atomic(ref, semaphore);
}

/**
 * Creates a new `RefM` with the specified value in the context of a
 * `Managed.`
 */
export function makeManaged<A>(a: A): M.IO<URefM<A>> {
  return pipe(make(a), M.fromEffect);
}

/**
 * Creates a new `RefM` and a `Dequeue` that will emit every change to the
 * `RefM`.
 */
export function dequeueRef<A>(a: A): I.UIO<[URefM<A>, XQ.Dequeue<A>]> {
  return pipe(
    I.do,
    I.bindS("ref", () => make(a)),
    I.bindS("queue", () => XQ.makeUnbounded<A>()),
    I.map(({ queue, ref }) => [
      pipe(
        ref,
        tapInput((a) => queue.offer(a))
      ),
      queue
    ])
  );
}
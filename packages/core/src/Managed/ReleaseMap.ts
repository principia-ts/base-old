import * as Eq from "../Eq";
import { absurd, increment, pipe } from "../Function";
import * as I from "../IO/_core";
import type { Exit } from "../IO/Exit";
import * as XR from "../IORef/_core";
import type { URef } from "../IORef/model";
import * as M from "../Map";
import type { Option } from "../Option";
import * as O from "../Option";
import { none, some } from "../Option";

export type Finalizer = (exit: Exit<any, any>) => I.IO<unknown, never, any>;

export class ReleaseMap {
  constructor(readonly ref: URef<State>) {}
}

export class Exited {
  readonly _tag = "Exited";
  constructor(readonly nextKey: number, readonly exit: Exit<any, any>) {}
}

export class Running {
  readonly _tag = "Running";
  constructor(readonly nextKey: number, readonly _finalizers: ReadonlyMap<number, Finalizer>) {}

  finalizers(): ReadonlyMap<number, Finalizer> {
    return this._finalizers as any;
  }
}

export type State = Exited | Running;

export function finalizers(state: Running): ReadonlyMap<number, Finalizer> {
  return state.finalizers();
}

export const noopFinalizer: Finalizer = () => I.unit();

export function addIfOpen(finalizer: Finalizer) {
  return (_: ReleaseMap): I.IO<unknown, never, Option<number>> =>
    pipe(
      _.ref,
      XR.modify<I.IO<unknown, never, Option<number>>, State>((s) => {
        switch (s._tag) {
          case "Exited": {
            return [
              I.map_(finalizer(s.exit), () => none()),
              new Exited(increment(s.nextKey), s.exit)
            ];
          }
          case "Running": {
            return [
              I.pure(some(s.nextKey)),
              new Running(increment(s.nextKey), M.insert(s.nextKey, finalizer)(finalizers(s)))
            ];
          }
        }
      }),
      I.flatten
    );
}

export function release(key: number, exit: Exit<any, any>) {
  return (_: ReleaseMap) =>
    pipe(
      _.ref,
      XR.modify((s) => {
        switch (s._tag) {
          case "Exited": {
            return [I.unit(), s];
          }
          case "Running": {
            return [
              O.fold_(
                M.lookup_(Eq.number)(s.finalizers(), key),
                () => I.unit(),
                (f) => f(exit)
              ),
              new Running(s.nextKey, M.remove_(s.finalizers(), key))
            ];
          }
        }
      })
    );
}

export function add(finalizer: Finalizer) {
  return (_: ReleaseMap) =>
    I.map_(
      addIfOpen(finalizer)(_),
      O.fold(
        (): Finalizer => () => I.unit(),
        (k): Finalizer => (e) => release(k, e)(_)
      )
    );
}

export function replace(
  key: number,
  finalizer: Finalizer
): (_: ReleaseMap) => I.IO<unknown, never, Option<Finalizer>> {
  return (_) =>
    pipe(
      _.ref,
      XR.modify<I.IO<unknown, never, Option<Finalizer>>, State>((s) => {
        switch (s._tag) {
          case "Exited":
            return [I.map_(finalizer(s.exit), () => none()), new Exited(s.nextKey, s.exit)];
          case "Running":
            return [
              I.succeed(M.lookup_(Eq.number)(finalizers(s), key)),
              new Running(s.nextKey, M.insert_(finalizers(s), key, finalizer))
            ];
          default:
            return absurd(s);
        }
      }),
      I.flatten
    );
}

export const make = I.map_(XR.make<State>(new Running(0, new Map())), (s) => new ReleaseMap(s));
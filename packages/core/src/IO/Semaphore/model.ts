import type { Either } from "../../Either";
import * as E from "../../Either";
import { identity, pipe } from "../../Function";
import * as XR from "../../IORef/_core";
import type { URef } from "../../IORef/model";
import * as M from "../../Managed/_core";
import * as O from "../../Option";
import type { Promise } from "../../Promise";
import { await as promiseWait } from "../../Promise/combinators/await";
import { make as promiseMake } from "../../Promise/combinators/make";
import { succeed_ as promiseSucceed } from "../../Promise/combinators/succeed";
import { ImmutableQueue } from "../../Utils/support/ImmutableQueue";
import * as I from "../_core";
import { bracket_ } from "../combinators/bracket";

export type Entry = [Promise<never, void>, number];
export type State = Either<ImmutableQueue<Entry>, number>;

export class Acquisition {
  constructor(readonly waitAcquire: I.UIO<void>, readonly release: I.UIO<void>) {}
}

/**
 * An asynchronous semaphore, which is a generalization of a mutex. Semaphores
 * have a certain number of permits, which can be held and released
 * concurrently by different parties. Attempts to acquire more permits than
 * available result in the acquiring fiber being suspended until the specified
 * number of permits become available.
 **/
export class Semaphore {
  constructor(private readonly state: URef<State>) {
    this.loop = this.loop.bind(this);
    this.restore = this.restore.bind(this);
    this.releaseN = this.releaseN.bind(this);
    this.restore = this.restore.bind(this);
  }

  get available() {
    return I.map_(
      this.state.get,
      E.fold(() => 0, identity)
    );
  }

  private loop(n: number, state: State, acc: I.UIO<void>): [I.UIO<void>, State] {
    switch (state._tag) {
      case "Right": {
        return [acc, E.right(n + state.right)];
      }
      case "Left": {
        return O.fold_(
          state.left.dequeue(),
          (): [I.UIO<void>, E.Either<ImmutableQueue<Entry>, number>] => [acc, E.right(n)],
          ([[p, m], q]): [I.UIO<void>, E.Either<ImmutableQueue<Entry>, number>] => {
            if (n > m) {
              return this.loop(n - m, E.left(q), I.apFirst_(acc, promiseSucceed(p, undefined)));
            } else if (n === m) {
              return [I.apFirst_(acc, promiseSucceed(p, undefined)), E.left(q)];
            } else {
              return [acc, E.left(q.prepend([p, m - n]))];
            }
          }
        );
      }
    }
  }

  private releaseN(toRelease: number): I.UIO<void> {
    return I.flatten(
      I.chain_(assertNonNegative(toRelease), () =>
        pipe(
          this.state,
          XR.modify((s) => this.loop(toRelease, s, I.unit()))
        )
      )
    );
  }

  private restore(p: Promise<never, void>, n: number): I.UIO<void> {
    return I.flatten(
      pipe(
        this.state,
        XR.modify(
          E.fold(
            (q) =>
              O.fold_(
                q.find(([a]) => a === p),
                (): [I.UIO<void>, E.Either<ImmutableQueue<Entry>, number>] => [
                  this.releaseN(n),
                  E.left(q)
                ],
                (x): [I.UIO<void>, E.Either<ImmutableQueue<Entry>, number>] => [
                  this.releaseN(n - x[1]),
                  E.left(q.filter(([a]) => a != p))
                ]
              ),
            (m): [I.UIO<void>, E.Either<ImmutableQueue<Entry>, number>] => [
              I.unit(),
              E.right(n + m)
            ]
          )
        )
      )
    );
  }

  prepare(n: number) {
    if (n === 0) {
      return I.pure(new Acquisition(I.unit(), I.unit()));
    } else {
      return I.chain_(promiseMake<never, void>(), (p) =>
        pipe(
          this.state,
          XR.modify(
            E.fold(
              (q): [Acquisition, E.Either<ImmutableQueue<Entry>, number>] => [
                new Acquisition(promiseWait(p), this.restore(p, n)),
                E.left(q.push([p, n]))
              ],
              (m): [Acquisition, E.Either<ImmutableQueue<Entry>, number>] => {
                if (m >= n) {
                  return [new Acquisition(I.unit(), this.releaseN(n)), E.right(m - n)];
                }
                return [
                  new Acquisition(promiseWait(p), this.restore(p, n)),
                  E.left(new ImmutableQueue([[p, n - m]]))
                ];
              }
            )
          )
        )
      );
    }
  }
}

/**
 * Acquires `n` permits, executes the action and releases the permits right after.
 */
export function withPermits_<R, E, A>(io: I.IO<R, E, A>, n: number, s: Semaphore): I.IO<R, E, A> {
  return bracket_(
    s.prepare(n),
    (a) => I.chain_(a.waitAcquire, () => io),
    (a) => a.release
  );
}

/**
 * Acquires `n` permits, executes the action and releases the permits right after.
 */
export function withPermits(n: number, s: Semaphore) {
  return <R, E, A>(io: I.IO<R, E, A>) => withPermits_(io, n, s);
}

/**
 * Acquires a permit, executes the action and releases the permit right after.
 */
export function withPermit_<R, E, A>(io: I.IO<R, E, A>, s: Semaphore): I.IO<R, E, A> {
  return withPermits_(io, 1, s);
}

/**
 * Acquires a permit, executes the action and releases the permit right after.
 */
export function withPermit(s: Semaphore): <R, E, A>(io: I.IO<R, E, A>) => I.IO<R, E, A> {
  return (io) => withPermit_(io, s);
}

/**
 * Acquires `n` permits in a `Managed` and releases the permits in the finalizer.
 */
export function withPermitsManaged(n: number): (s: Semaphore) => M.Managed<unknown, never, void> {
  return (s) =>
    M.makeReserve(I.map_(s.prepare(n), (a) => M.makeReservation(() => a.release)(a.waitAcquire)));
}

/**
 * Acquires a permit in a `Managed` and releases the permit in the finalizer.
 */
export function withPermitManaged(s: Semaphore) {
  return withPermitsManaged(1)(s);
}

/**
 * The number of permits currently available.
 */
export function available(s: Semaphore): I.IO<unknown, never, number> {
  return s.available;
}

/**
 * Creates a new `Sempahore` with the specified number of permits.
 */
export function make(permits: number): I.IO<unknown, never, Semaphore> {
  return I.map_(XR.make<State>(E.right(permits)), (state) => new Semaphore(state));
}

/**
 * Creates a new `Sempahore` with the specified number of permits.
 */
export function unsafeMake(permits: number): Semaphore {
  const state = XR.unsafeMake<State>(E.right(permits));

  return new Semaphore(state);
}

function assertNonNegative(n: number) {
  return n < 0 ? I.die(`Unexpected negative value ${n} passed to acquireN or releaseN.`) : I.unit();
}
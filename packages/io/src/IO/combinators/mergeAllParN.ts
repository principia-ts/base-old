import type { IO } from '../core'

import { pipe } from '@principia/base/data/Function'

import * as XR from '../../IORef'
import { flatMap, flatMap_ } from '../core'
import { foreachUnitParN_ } from './foreachUnitParN'

/**
 * Merges an `Iterable<IO>` to a single IO, working in with up to `n` fibers in parallel.
 *
 * Due to the parallel nature of this combinator, `f` must be both:
 * - commutative: `f(a, b) == f(b, a)`
 * - associative: `f(a, f(b, c)) == f(f(a, b), c)`
 *
 * It's unsafe to execute side effects inside `f`, as `f` may be executed
 * more than once for some of `in` elements during effect execution.
 */
export const mergeAllParN_ = (n: number) => <R, E, A, B>(
  fas: Iterable<IO<R, E, A>>,
  b: B,
  f: (b: B, a: A) => B
): IO<R, E, B> =>
    flatMap_(XR.make(b), (acc) =>
      flatMap_(
        foreachUnitParN_(n)(
          fas,
          flatMap((a) =>
            pipe(
              acc,
              XR.update((b) => f(b, a))
            )
          )
        ),
        () => acc.get
      )
    )

/**
 * Merges an `Iterable<IO>` to a single IO, working in with up to `n` fibers in parallel.
 *
 * Due to the parallel nature of this combinator, `f` must be both:
 * - commutative: `f(a, b) == f(b, a)`
 * - associative: `f(a, f(b, c)) == f(f(a, b), c)`
 *
 * It's unsafe to execute side effects inside `f`, as `f` may be executed
 * more than once for some of `in` elements during effect execution.
 */
export const mergeAllParN = (n: number) => <A, B>(b: B, f: (b: B, a: A) => B) => <R, E>(
  fas: Iterable<IO<R, E, A>>
): IO<R, E, B> => mergeAllParN_(n)(fas, b, f)
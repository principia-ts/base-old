import { chain_ } from "../_core";
import type { HasClock } from "../Clock";
import { sleep } from "../Clock";
import type { IO } from "../model";

/**
 * ```haskell
 * _delay :: (IO r e a, Number) -> IO (r & HasClock) e a
 * ```
 *
 * Delays an `IO` by an arbitrary number of milliseconds
 *
 * @category Combinators
 * @since 1.0.0
 */
export function delay_<R, E, A>(ef: IO<R, E, A>, ms: number): IO<R & HasClock, E, A> {
  return chain_(sleep(ms), () => ef);
}

/**
 * ```haskell
 * delay :: Number -> IO r e a -> IO (r & HasClock) e a
 * ```
 *
 * Delays an `IO` by an arbitrary number of milliseconds
 *
 * @category Combinators
 * @since 1.0.0
 */
export function delay(ms: number): <R, E, A>(ef: IO<R, E, A>) => IO<R & HasClock, E, A> {
  return (ef) => delay_(ef, ms);
}
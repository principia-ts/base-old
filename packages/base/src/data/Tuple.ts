import * as HKT from '../HKT'
import * as P from '../typeclass'
import { identity } from './Function'

/*
 * -------------------------------------------
 * Model
 * -------------------------------------------
 */

export interface Tuple<A, E> extends Readonly<[A, E]> {}

export const URI = 'Tuple'
export type URI = typeof URI

export type V = HKT.V<'I', '+'>

declare module '../HKT' {
  interface URItoKind<FC, TC, N, K, Q, W, X, I, S, R, E, A> {
    readonly [URI]: Tuple<A, I>
  }
}

/*
 * -------------------------------------------
 * Constructors
 * -------------------------------------------
 */

export function tuple_<A, I>(a: A, i: I): Tuple<A, I> {
  return [a, i]
}

export function tuple<I>(i: I): <A>(a: A) => Tuple<A, I> {
  return (a) => [a, i]
}

/*
 * -------------------------------------------
 * Destructors
 * -------------------------------------------
 */

export function fst<A, I>(ai: Tuple<A, I>): A {
  return ai[0]
}

export function snd<A, I>(ai: Tuple<A, I>): I {
  return ai[1]
}

/*
 * -------------------------------------------
 * Applicative
 * -------------------------------------------
 */

export function getApplicative<M>(M: P.Monoid<M>): P.Applicative<[URI], V & HKT.Fix<'I', M>> {
  return HKT.instance({
    ...getApply(M),
    pure: (a) => tuple_(a, M.nat),
    unit: () => tuple_(undefined, M.nat)
  })
}

/*
 * -------------------------------------------
 * Apply
 * -------------------------------------------
 */

export function getApply<M>(M: P.Monoid<M>): P.Apply<[URI], V & HKT.Fix<'I', M>> {
  const map2_: P.Map2Fn_<[URI], HKT.Fix<'I', M>> = (fa, fb, f) => [f(fst(fa), fst(fb)), M.combine_(snd(fa), snd(fb))]
  const ap_: P.ApFn_<[URI], V & HKT.Fix<'I', M>> = (fab, fa) => [fst(fab)(fst(fa)), M.combine_(snd(fab), snd(fa))]

  return HKT.instance<P.Apply<[URI], V & HKT.Fix<'I', M>>>({
    imap_: (fa, f, _) => map_(fa, f),
    imap: (f, _) => (fa) => map_(fa, f),
    map_,
    map,
    map2_,
    map2: (fb, f) => (fa) => map2_(fa, fb, f),
    product_: (fa, fb) => map2_(fa, fb, tuple_),
    product: (fb) => (fa) => map2_(fa, fb, tuple_),
    ap_,
    ap: (fa) => (fab) => ap_(fab, fa)
  })
}

/*
 * -------------------------------------------
 * Bifunctor
 * -------------------------------------------
 */

export function bimap_<A, I, G, B>(pab: Tuple<A, I>, f: (i: I) => G, g: (a: A) => B): Tuple<B, G> {
  return [g(fst(pab)), f(snd(pab))]
}

export function bimap<I, G, A, B>(f: (i: I) => G, g: (a: A) => B): (pab: Tuple<A, I>) => Tuple<B, G> {
  return (pab) => bimap_(pab, f, g)
}

export function mapLeft_<A, I, G>(pab: Tuple<A, I>, f: (i: I) => G): Tuple<A, G> {
  return [fst(pab), f(snd(pab))]
}

export function mapLeft<I, G>(f: (i: I) => G): <A>(pab: Tuple<A, I>) => Tuple<A, G> {
  return (pab) => mapLeft_(pab, f)
}

export function swap<A, I>(ai: Tuple<A, I>): Tuple<I, A> {
  return [snd(ai), fst(ai)]
}

/*
 * -------------------------------------------
 * Comonad
 * -------------------------------------------
 */

export function extend_<A, I, B>(wa: Tuple<A, I>, f: (wa: Tuple<A, I>) => B): Tuple<B, I> {
  return [f(wa), snd(wa)]
}

export function extend<A, I, B>(f: (wa: Tuple<A, I>) => B): (wa: Tuple<A, I>) => Tuple<B, I> {
  return (wa) => extend_(wa, f)
}

export const extract: <A, I>(wa: Tuple<A, I>) => A = fst

export const duplicate: <A, I>(wa: Tuple<A, I>) => Tuple<Tuple<A, I>, I> = extend(identity)

/*
 * -------------------------------------------
 * Foldable
 * -------------------------------------------
 */

export function foldLeft_<A, I, B>(fa: Tuple<A, I>, b: B, f: (b: B, a: A) => B): B {
  return f(b, fst(fa))
}

export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B): <I>(fa: Tuple<A, I>) => B {
  return (fa) => foldLeft_(fa, b, f)
}

export function foldMap_<M>(_M: P.Monoid<M>): <A, I>(fa: Tuple<A, I>, f: (a: A) => M) => M {
  return (fa, f) => f(fst(fa))
}

export function foldMap<M>(_M: P.Monoid<M>): <A>(f: (a: A) => M) => <I>(fa: Tuple<A, I>) => M {
  return (f) => (fa) => foldMap_(_M)(fa, f)
}

export function foldRight_<A, I, B>(fa: Tuple<A, I>, b: B, f: (a: A, b: B) => B): B {
  return f(fst(fa), b)
}

export function foldRight<A, B>(b: B, f: (a: A, b: B) => B): <I>(fa: Tuple<A, I>) => B {
  return (fa) => foldRight_(fa, b, f)
}

/*
 * -------------------------------------------
 * Functor
 * -------------------------------------------
 */

export function map_<A, I, B>(fa: Tuple<A, I>, f: (a: A) => B): Tuple<B, I> {
  return [f(fst(fa)), snd(fa)]
}

export function map<A, B>(f: (a: A) => B): <I>(fa: Tuple<A, I>) => Tuple<B, I> {
  return (fa) => map_(fa, f)
}

/*
 * -------------------------------------------
 * Monad
 * -------------------------------------------
 */

export function getMonad<M>(M: P.Monoid<M>): P.Monad<[URI], V & HKT.Fix<'I', M>> {
  const flatMap_: P.FlatMapFn_<[URI], V & HKT.Fix<'I', M>> = (ma, f) => {
    const mb = f(fst(ma))
    return [fst(mb), M.combine_(snd(ma), snd(mb))]
  }
  const flatten: P.FlattenFn<[URI], V & HKT.Fix<'I', M>> = (mma) =>
    [fst(fst(mma)), M.combine_(snd(fst(mma)), snd(mma))] as const

  return HKT.instance<P.Monad<[URI], V & HKT.Fix<'I', M>>>({
    ...getApplicative(M),
    flatMap_,
    flatMap: (f) => (ma) => flatMap_(ma, f),
    flatten
  })
}

/*
 * -------------------------------------------
 * Semigroupoid
 * -------------------------------------------
 */

export function compose_<B, A, C>(ab: Tuple<B, A>, bc: Tuple<C, B>): Tuple<C, A> {
  return [fst(bc), snd(ab)]
}

export function compose<C, B>(bc: Tuple<C, B>): <A>(ab: Tuple<B, A>) => Tuple<C, A> {
  return (ab) => compose_(ab, bc)
}

/*
 * -------------------------------------------
 * Traversable
 * -------------------------------------------
 */

export const traverse_: P.TraverseFn_<[URI], V> = P.implementTraverse_<[URI], V>()((_) => (G) => (ta, f) =>
  G.map_(f(fst(ta)), (b) => [b, snd(ta)])
)

export const traverse: P.TraverseFn<[URI], V> = (G) => {
  const traverseG_ = traverse_(G)
  return (f) => (ta) => traverseG_(ta, f)
}

export const sequence: P.SequenceFn<[URI], V> = P.implementSequence<[URI]>()((_) => (G) => (ta) =>
  G.map_(fst(ta), (a) => [a, snd(ta)])
)
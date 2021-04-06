import type * as G from './Guard'

import * as E from './Eq'
import * as F from './Field'
import * as P from './typeclass'

/*
 * -------------------------------------------
 * refinements
 * -------------------------------------------
 */

export function isNumber(u: unknown): u is number {
  return typeof u === 'number'
}

/*
 * -------------------------------------------
 * instances
 * -------------------------------------------
 */

/**
 * @category instances
 */
export const Eq: P.Eq<number> = E.EqStrict

/**
 * @category instances
 */
export const Ord: P.Ord<number> = P.makeOrd((x, y) => (x < y ? -1 : x > y ? 1 : 0))

/**
 * @category instances
 */
export const Bounded: P.Bounded<number> = {
  ...Ord,
  top: Infinity,
  bottom: -Infinity
}

/**
 * @category instances
 */
export const Show: P.Show<number> = P.makeShow((x) => JSON.stringify(x))

/**
 * @category instances
 */
export const SemigroupSum: P.Semigroup<number> = P.makeSemigroup((x, y) => x + y)

/**
 * @category instances
 */
export const SemigroupProduct: P.Semigroup<number> = P.makeSemigroup((x, y) => x * y)

/**
 * @category instances
 */
export const MonoidSum: P.Monoid<number> = {
  ...SemigroupSum,
  nat: 0
}

/**
 * @category instances
 */
export const MonoidProduct: P.Monoid<number> = {
  ...SemigroupProduct,
  nat: 1
}

/**
 * @category instances
 */
export const Guard: G.Guard<unknown, number> = {
  is: isNumber
}

/**
 * @category instances
 */
export const Field: F.Field<number> = F.Field({
  zero: 0,
  one: 1,
  degree: (_) => 1,
  add_: (x, y) => x + y,
  mul_: (x, y) => x * y,
  sub_: (x, y) => x - y,
  div_: (x, y) => x / y,
  mod_: (x, y) => x % y
})
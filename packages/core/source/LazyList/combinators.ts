import type { CompareFn_ } from "@principia/prelude/Ord";
import { GT } from "@principia/prelude/Ordering";

import type { Lazy, Trampoline } from "../Function";
import { done, matchPredicate, more, trampoline } from "../Function";
import { cons, cons_, list, nil } from "./constructors";
import { isEmpty, isNonEmpty } from "./guards";
import type { LazyList } from "./model";
import { errorEmptyList } from "./model";

/*
 * -------------------------------------------
 * Combinators
 * -------------------------------------------
 */

export const head: <A>(xs: LazyList<A>) => A = matchPredicate(
   isNonEmpty,
   (l) => l.head(),
   (_) => errorEmptyList("head")
);

export const tail: <A>(xs: LazyList<A>) => LazyList<A> = matchPredicate(
   isNonEmpty,
   (l) => l.tail(),
   (_) => errorEmptyList("tail")
);

export const rangeBy_ = (start: number, end: number, step: (n: number) => number): LazyList<number> => {
   if (start === end)
      return cons_(
         () => start,
         () => nil
      );

   return cons_(
      () => start,
      () => rangeBy_(step(start), end, step)
   );
};

export const init: <A>(xs: LazyList<A>) => LazyList<A> = matchPredicate(
   isNonEmpty,
   (l) =>
      isEmpty(tail(l))
         ? nil
         : cons_(
              () => head(l),
              () => init(tail(l))
           ),
   (_) => errorEmptyList("init")
);

export const last: <A>(xs: LazyList<A>) => A = trampoline(function last<A>(xs: LazyList<A>): Trampoline<A> {
   return matchPredicate(
      isNonEmpty,
      (l) => (isEmpty(tail(l)) ? done(head(l)) : more(() => last(tail(l)))),
      (_) => errorEmptyList("last")
   )(xs);
});

export const take_ = <A>(xs: LazyList<A>, n: number): LazyList<A> => {
   if (n <= 0) return nil;
   if (isEmpty(xs)) return nil;
   return cons_(
      () => head(xs),
      () => take_(tail(xs), n - 1)
   );
};

export const take = (n: number) => <A>(xs: LazyList<A>) => take_(xs, n);

export const lines: (s: string) => LazyList<string> = matchPredicate(
   (s) => s.length === 0,
   (_) => nil,
   (s) => list(...s.split("\n"))
);

/* eslint-disable @typescript-eslint/no-use-before-define */

export function sortBy_<A>(xs: LazyList<A>, cmp: CompareFn_<A>): LazyList<A> {
   const _sequences = (xs: LazyList<A>): Trampoline<LazyList<LazyList<A>>> => {
      if (isEmpty(xs)) {
         return done(list(xs));
      }
      let as = tail(xs);
      if (isEmpty(as)) {
         return done(list(xs));
      }
      const a = head(xs);
      const b = head(as);
      as = tail(as);
      if (cmp(a, b) === GT) {
         return _descending(b, list(a), as);
      }
      return _ascending(b, cons(() => a) as any, as);
   };

   const _ascending = (
      a: A,
      fas: (xs: Lazy<LazyList<A>>) => LazyList<A>,
      bbs: LazyList<A>
   ): Trampoline<LazyList<LazyList<A>>> => {
      if (isEmpty(bbs)) {
         return done(
            cons_(
               () => fas(() => list(a)),
               () => trampoline(_sequences)(bbs)
            )
         );
      }
      const b = head(bbs);
      const bs = tail(bbs);
      const ys = (ys: Lazy<LazyList<A>>) => fas(() => cons_(() => a, ys));
      if (cmp(a, b) !== GT) {
         return more(() => _ascending(b, ys, bs));
      }
      return done(
         cons_(
            () => fas(() => list(a)),
            () => trampoline(_sequences)(bbs)
         )
      );
   };

   const _descending = (a: A, as: LazyList<A>, bbs: LazyList<A>): Trampoline<LazyList<LazyList<A>>> => {
      if (isEmpty(bbs)) {
         return done(
            cons_(
               () =>
                  cons_(
                     () => a,
                     () => as
                  ),
               () => trampoline(_sequences)(bbs)
            )
         );
      }
      const b = head(bbs);
      const bs = tail(bbs);
      if (cmp(a, b) === GT) {
         return more(() =>
            _descending(
               b,
               cons_(
                  () => a,
                  () => as
               ),
               bs
            )
         );
      }
      return done(
         cons_(
            () =>
               cons_(
                  () => a,
                  () => as
               ),
            () => trampoline(_sequences)(bbs)
         )
      );
   };

   const _mergePairs = (as: LazyList<LazyList<A>>): Trampoline<LazyList<LazyList<A>>> => {
      if (isEmpty(as)) {
         return done(as);
      }
      let xs = tail(as);
      if (isEmpty(xs)) {
         return done(as);
      }
      const a = head(as);
      const b = head(xs);
      xs = tail(xs);
      return done(
         cons_(
            () => trampoline(_merge)(a, b),
            () => trampoline(_mergePairs)(xs)
         )
      );
   };

   const _merge = (as: LazyList<A>, bs: LazyList<A>): Trampoline<LazyList<A>> => {
      if (isEmpty(as)) {
         return done(bs);
      }
      if (isEmpty(bs)) {
         return done(as);
      }
      const a = head(as);
      const as1 = tail(as);
      const b = head(bs);
      const bs1 = tail(bs);
      if (cmp(a, b) === GT) {
         return done(
            cons_(
               () => b,
               () => trampoline(_merge)(as, bs1)
            )
         );
      }
      return done(
         cons_(
            () => a,
            () => trampoline(_merge)(as1, bs)
         )
      );
   };

   const _mergeAll = (xs: LazyList<LazyList<A>>): Trampoline<LazyList<A>> => {
      if (isEmpty(tail(xs))) {
         return done(head(xs));
      }
      return more(() => _mergeAll(trampoline(_mergePairs)(xs)));
   };

   return trampoline(_mergeAll)(trampoline(_sequences)(xs));
}

/* eslint-enable */

export const sortBy = <A>(cmp: CompareFn_<A>) => (xs: LazyList<A>) => sortBy_(xs, cmp);

export const append_ = trampoline(function append<A>(xs: LazyList<A>, ys: LazyList<A>): Trampoline<LazyList<A>> {
   if (isEmpty(xs)) return done(ys);
   if (isEmpty(ys)) return done(xs);
   return done(
      cons_(
         () => head(xs),
         () => trampoline(append)(tail(xs), ys)
      )
   );
});
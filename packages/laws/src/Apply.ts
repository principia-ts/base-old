import type * as Eq from "@principia/core/Eq";
import type * as P from "@principia/prelude";
import type { FunctionN } from "@principia/prelude/Function";
import type * as HKT from "@principia/prelude/HKT";

function AssociativeCompositionLaw<F extends HKT.URIS, TC, C>(
  F: P.Apply<F, TC>,
  S: Eq.Eq<
    HKT.Kind<
      F,
      TC,
      HKT.Initial<TC, "N">,
      HKT.Initial<TC, "K">,
      HKT.Initial<TC, "Q">,
      HKT.Initial<TC, "W">,
      HKT.Initial<TC, "X">,
      HKT.Initial<TC, "I">,
      HKT.Initial<TC, "S">,
      HKT.Initial<TC, "R">,
      HKT.Initial<TC, "E">,
      C
    >
  >
): <
  N extends string,
  K,
  Q,
  W,
  X,
  I,
  S,
  R,
  E,
  A,
  NB extends string,
  KB,
  QB,
  WB,
  XB,
  IB,
  SB,
  RB,
  EB,
  B,
  NC extends string,
  KC,
  QC,
  WC,
  XC,
  IC,
  SC,
  RC,
  EC
>(
  fa: HKT.Kind<F, TC, N, K, Q, W, X, I, S, R, E, A>,
  fab: HKT.Kind<F, TC, NB, KB, QB, WB, XB, IB, SB, RB, EB, (a: A) => B>,
  fbc: HKT.Kind<F, TC, NC, KC, QC, WC, XC, IC, SC, RC, EC, (b: B) => C>
) => boolean;
function AssociativeCompositionLaw<F, A, B, C>(
  F: P.Apply<HKT.UHKT<F>>,
  S: Eq.Eq<HKT.HKT<F, C>>
): (
  fa: HKT.HKT<F, A>,
  fab: HKT.HKT<F, FunctionN<[A], B>>,
  fbc: HKT.HKT<F, FunctionN<[B], C>>
) => boolean {
  return (fa, fab, fbc) => {
    return S.equals_(
      F.ap_(
        F.ap_(
          F.map_(fbc, (bc) => (ab: FunctionN<[A], B>) => (a: A) => bc(ab(a))),
          fab
        ),
        fa
      ),
      F.ap_(fbc, F.ap_(fab, fa))
    );
  };
}

export const Apply = {
  associativeComposition: AssociativeCompositionLaw
};
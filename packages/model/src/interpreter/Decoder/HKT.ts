import * as D from "@principia/core/Decoder";
import type * as HKT from "@principia/prelude/HKT";

import type { InterfaceConfigKind, IntersectionConfigKind, TaggedUnionConfigKind } from "../../HKT";
import { getApplyConfig } from "../../HKT";

declare module "../../HKT" {
   interface URItoInterpreted<Env, S, R, E, A> {
      readonly [D.URI]: (_: Env) => D.Decoder<unknown, A>;
   }
   interface URItoConfig<S, R, E, A> {
      readonly [D.URI]: D.Decoder<unknown, A>;
   }
}

declare module "../../algebra/primitives" {
   interface NonEmptyArrayConfig<E, A> {
      readonly [D.URI]: D.Decoder<unknown, A>;
   }
   interface ArrayConfig<E, A> {
      readonly [D.URI]: D.Decoder<unknown, A>;
   }
}

declare module "../../algebra/object" {
   interface TypeConfig<Props> {
      readonly [D.URI]: InterfaceConfigKind<D.URI, Props>;
   }
   interface PartialConfig<Props> {
      readonly [D.URI]: InterfaceConfigKind<D.URI, Props>;
   }
   interface BothConfig<Props, PropsPartial> {
      readonly [D.URI]: {
         required: InterfaceConfigKind<D.URI, Props>;
         optional: InterfaceConfigKind<D.URI, PropsPartial>;
      };
   }
}

declare module "../../algebra/newtype" {
   interface IsoConfig<E, A, N> {
      readonly [D.URI]: D.Decoder<unknown, A>;
   }
   interface PrismConfig<E, A, N> {
      readonly [D.URI]: D.Decoder<unknown, A>;
   }
}

declare module "../../algebra/record" {
   interface RecordConfig<E, A> {
      readonly [D.URI]: D.Decoder<unknown, A>;
   }
}

declare module "../../algebra/set" {
   interface SetConfig<E, A> {
      readonly [D.URI]: D.Decoder<unknown, A>;
   }
}

declare module "../../algebra/sum" {
   interface TaggedUnionConfig<Types> {
      readonly [D.URI]: TaggedUnionConfigKind<D.URI, Types>;
   }
   interface EitherConfig<ES, ER, EE, EA, AS, AR, AE, AA> {
      readonly [D.URI]: {
         readonly left: D.Decoder<unknown, EA>;
         readonly right: D.Decoder<unknown, AA>;
      };
   }
   interface OptionConfig<S, R, E, A> {
      readonly [D.URI]: D.Decoder<unknown, A>;
   }
}

declare module "../../algebra/nullable" {
   interface NullableConfig<S, R, E, A> {
      readonly [D.URI]: D.Decoder<unknown, A>;
   }
   interface OptionalConfig<S, R, E, A> {
      readonly [D.URI]: D.Decoder<unknown, A>;
   }
}

declare module "../../algebra/intersection" {
   interface IntersectionConfig<S, R, E, A> {
      readonly [D.URI]: IntersectionConfigKind<D.URI, S, R, E, A>;
   }
}

export const applyDecoderConfig = getApplyConfig(D.URI);
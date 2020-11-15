import * as A from "../Array";
import type { Tree } from "./model";

/*
 * -------------------------------------------
 * Unit Tree
 * -------------------------------------------
 */

export function unit(): Tree<void> {
   return {
      value: undefined,
      forest: A.empty()
   };
}
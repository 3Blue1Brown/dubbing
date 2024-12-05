import type { PrimitiveAtom } from "jotai";
import { getDefaultStore, type Atom } from "jotai";

export const getAtom = <Value>(atom: Atom<Value>) =>
  getDefaultStore().get(atom);

export const setAtom = <Value>(atom: PrimitiveAtom<Value>, value: Value) =>
  getDefaultStore().set(atom, value);

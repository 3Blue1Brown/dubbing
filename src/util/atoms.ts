import type { PrimitiveAtom } from "jotai";
import { getDefaultStore, type Atom } from "jotai";

export const getAtom = <Value>(atom: Atom<Value>) =>
  getDefaultStore().get(atom);

export const setAtom = <Value>(atom: PrimitiveAtom<Value>, value: Value) =>
  getDefaultStore().set(atom, value);

export const subscribe = <Value>(
  atom: PrimitiveAtom<Value>,
  func: (value: Value) => void,
) =>
  getDefaultStore().sub(atom, () => func(getAtom(atom)));

import type { PrimitiveAtom } from "jotai";
import { atom, getDefaultStore, type Atom } from "jotai";
import { countdown } from "@/util/misc";

export const getAtom = <Value>(atom: Atom<Value>) =>
  getDefaultStore().get(atom);

export const setAtom = <Value>(atom: PrimitiveAtom<Value>, value: Value) => {
  getDefaultStore().set(atom, value);
  return value;
};

export const subscribe = <Value>(
  atom: PrimitiveAtom<Value>,
  func: (value: Value) => void,
) => getDefaultStore().sub(atom, () => func(getAtom(atom)));

export const countdownAtom = (time: number) => {
  const _atom = atom(true);

  const reset = countdown(
    time,
    () => setAtom(_atom, true),
    () => setAtom(_atom, false),
  );

  return { atom: _atom, reset };
};

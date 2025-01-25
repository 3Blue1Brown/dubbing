import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type Context,
  type Provider,
} from "react";

/** https://github.com/dai-shi/use-context-selector/issues/109 */

type Subscribe = Parameters<typeof useSyncExternalStore>[0];
type Subscriber = () => void;
type Store<Value> = { value: Value; subscribe: Subscribe };

/** useContext that supports selectors */
export const createContextWithSelectors = <Value,>(defaultValue: Value) => {
  /** create default react context */
  const context = createContext<Store<Value>>({
    /** put context value one level deep to allow addition of... */
    value: defaultValue,
    /** subscribe function to access from outside */
    subscribe: () => () => {},
  });

  /** original provider */
  const Original = context.Provider;

  /** provider to replace original one */
  const NewProvider: CallSignature<Provider<Value>> = ({ value, children }) => {
    /** non-reactive store */
    const store = useRef<Store<Value>>(null);

    /** subscribers of store */
    const subscribers = useRef(new Set<Subscriber>());

    /** initialize store */
    if (!store.current)
      store.current = {
        value,
        subscribe: (subscriber) => {
          subscribers.current.add(subscriber);
          return () => subscribers.current.delete(subscriber);
        },
      };

    /** when context value changes */
    useEffect(() => {
      if (!store.current) return;
      /** if new value is referentially different from old value */
      if (!Object.is(store.current.value, value)) {
        /** update value */
        store.current.value = value;
        /** notify subscribers of change */
        subscribers.current.forEach((subscriber) => subscriber());
      }
    }, [value]);

    /** render original provider */
    return <Original value={store.current}>{children}</Original>;
  };

  /** replace old provider with new one */
  context.Provider = NewProvider as Provider<Store<Value>>;

  return context as unknown as ReturnType<typeof createContext<Value>>;
};

/** select slice from context value */
export const useContextSelector = <Value, Slice>(
  context: Context<Value>,
  selector: (value: Value) => Slice,
) => {
  const store = useContext(context) as Store<Value>;
  return useSyncExternalStore<Slice>(store.subscribe, () =>
    selector(store.value),
  );
};

/** https://stackoverflow.com/questions/58657325/typescript-pick-call-signature-from-function-interface */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CallSignature<T> = T extends (...args: any[]) => any
  ? (...args: Parameters<T>) => ReturnType<T>
  : never;

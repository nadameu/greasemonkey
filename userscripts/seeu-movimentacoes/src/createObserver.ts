interface IObserver<K, V extends any[]> {
  (map: Map<K, Set<(...args: V) => void>>): INativeObserver<K>;
}
interface INativeObserver<K> {
  observe(key: K): void;
  disconnect(): void;
}
interface IObserverR<K, V extends any[]> {
  observe(key: K, callback: (...args: V) => void): ISubscription;
}
interface ISubscription {
  unobserve(): void;
}
export const createObserver = <K, V extends any[]>(
  nativeObserver: IObserver<K, V>
): IObserverR<K, V> => {
  const callbacks = new Map<K, Set<(...args: V) => any>>();
  const obs = nativeObserver(callbacks);
  return {
    observe(key, callback) {
      if (!callbacks.has(key)) {
        callbacks.set(key, new Set());
      }
      callbacks.get(key)!.add(callback);
      obs.observe(key);
      return {
        unobserve() {
          callbacks.get(key)?.delete(callback);
          if (callbacks.get(key)?.size ?? 0 === 0) {
            callbacks.delete(key);
            if (callbacks.size === 0) {
              obs.disconnect();
            }
          }
        },
      };
    },
  };
};

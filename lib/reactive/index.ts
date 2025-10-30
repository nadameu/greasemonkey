// https://dev.to/ryansolid/building-a-reactive-library-from-scratch-1i0p

interface Effect {
  execute(): void;
  dependencies: Set<Set<Effect>>;
}

const context: Effect[] = [];

function subscribe(running: Effect, subscriptions: Set<Effect>) {
  subscriptions.add(running);
  running.dependencies.add(subscriptions);
}

export function atom<T>(initial_value: T) {
  let value = initial_value;
  const subscriptions = new Set<Effect>();

  return {
    get,
    set,
    update,
  };

  function get() {
    const running = context[context.length - 1];
    if (running) subscribe(running, subscriptions);
    console.log('Watchers:', subscriptions.size, 'Value:', value);
    return value;
  }

  function set(new_value: T) {
    value = new_value;
    [...subscriptions].forEach(f => f.execute());
  }

  function update(fn: { (_: T): T }) {
    set(fn(value));
  }
}

function cleanup(running: Effect) {
  running.dependencies.forEach(dep => dep.delete(running));
  running.dependencies.clear();
}

export function effect(fn: { (): void }) {
  const execute = () => {
    cleanup(running);
    context.push(running);
    try {
      fn();
    } finally {
      context.pop();
    }
  };
  const running: Effect = { execute, dependencies: new Set() };

  execute();
}

export function compute<T>(fn: { (): T }) {
  const value = atom(undefined as unknown as T);
  effect(() => {
    value.set(fn());
  });
  return { get: () => value.get() };
}

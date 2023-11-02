import { Handler } from '@nadameu/handler';

export interface Subscription {
  unsubscribe(): void;
}
export interface BroadcastService<Msg> {
  destroy(): void;
  publish(message: Msg): void;
  subscribe(listener: Handler<Msg>): Subscription;
}

export function createBroadcastService<Msg>(
  id: string,
  validate: (x: unknown) => x is Msg
): BroadcastService<Msg> {
  const listeners = new Set<Handler<Msg>>();
  const bc = new BroadcastChannel(id);
  bc.addEventListener('message', onMessage);

  return { destroy, publish, subscribe };

  function onMessage(evt: MessageEvent<unknown>) {
    if (validate(evt.data))
      for (const listener of listeners) listener(evt.data);
  }

  function destroy() {
    bc.removeEventListener('message', onMessage);
    listeners.clear();
    bc.close();
  }
  function publish(message: Msg) {
    bc.postMessage(message);
  }
  function subscribe(listener: Handler<Msg>) {
    listeners.add(listener);
    return {
      unsubscribe() {
        listeners.delete(listener);
      },
    };
  }
}

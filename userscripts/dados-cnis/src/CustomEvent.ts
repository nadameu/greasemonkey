import { hasKeys, isObject } from '@nadameu/predicates';

export const isCustomEvent = hasKeys('detail');

export function createCustomEventDispatcher<T>(target: EventTarget) {
  return function dispatch(detail: T) {
    target.dispatchEvent(new CustomEvent<T>('gm/cnis', { detail }));
  };
}

export function onCustomEvent<T>(
  target: EventTarget,
  checker: (x: unknown) => x is T,
  handler: (detail: T) => void,
  errorToDetail: (reason: Error) => T
) {
  target.addEventListener('gm/cnis', evt => {
    if (!isObject(evt) || !('detail' in evt))
      return void handler(errorToDetail(new EventoDesconhecidoError('Evento desconhecido.', evt)));

    if (!checker(evt.detail))
      return void handler(
        errorToDetail(new Error(`Mensagem desconhecida: \`${JSON.stringify(evt.detail)}\`.`))
      );

    handler(evt.detail);
  });
}

class EventoDesconhecidoError extends Error {
  name = 'EventoDesconhecidoError';
  constructor(msg: string, public evento: Event) {
    super(msg);
  }
}

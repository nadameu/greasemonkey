import { Handler } from '@nadameu/handler';
import { hasShape, isString } from '@nadameu/predicates';

export type AjaxListenerResult = Err | Ok;
export interface Err {
  type: 'Err';
  reason: string;
}
export interface Ok {
  type: 'Ok';
  source: string;
  extension: Extension | null;
}

export type Extension = never;

interface Listener {
  source: string;
  fn: Handler<Extension | null>;
  once: boolean;
}

export function createAjaxListener() {
  const listeners = new Set<Listener>();
  jQuery.fx.off = true;
  $(document).ajaxComplete((_, xhr, opts) => onResult(toResult(xhr, opts)));

  return { listen, listenOnce };

  function listen(source: string, fn: Handler<Extension | null>) {
    console.debug('AjaxListener.listen(source)', source, fn);
    const listener: Listener = { source, fn, once: false };
    listeners.add(listener);
  }

  function listenOnce(source: string): Promise<Extension | null> {
    console.debug('AjaxListener.listenOnce(source)', source);
    let handler: Handler<Extension | null>;
    const promise = new Promise<Extension | null>(resolve => {
      handler = resolve;
    });
    const listener: Listener = { source, fn: handler!, once: true };
    listeners.add(listener);
    return promise;
  }

  function toResult(jqXHR: JQuery.jqXHR, ajaxOptions: JQuery.AjaxSettings): AjaxListenerResult {
    if (!hasShape({ source: isString })(ajaxOptions))
      return { type: 'Err', reason: 'Sem propriedade "source".' };

    const createResult = (extension: Extension | null = null): AjaxListenerResult => ({
      type: 'Ok',
      source: ajaxOptions.source,
      extension,
    });

    if (!jqXHR.responseXML) return createResult();
    const extensions = jqXHR.responseXML.querySelectorAll('extension');
    if (extensions.length !== 1) return createResult();
    const text = extensions[0]!.textContent?.trim() || null;
    if (text === null) return createResult();
    try {
      return createResult(JSON.parse(text));
    } catch (_) {
      return createResult();
    }
  }

  function onResult(result: AjaxListenerResult): void {
    if (result.type === 'Err') return console.debug('ajaxComplete() erro:', result.reason);
    const { source, extension } = result;
    for (const listener of listeners) {
      if (listener.source !== source) continue;
      listener.fn(extension);
      if (listener.once) {
        listeners.delete(listener);
      }
    }
  }
}

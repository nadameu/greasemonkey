import { Handler } from '@nadameu/handler';
import * as p from '@nadameu/predicates';

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

export const isExtension = /* @__PURE__ */ p.isAnyOf(
  p.hasShape({ totalRecords: p.isNumber }),
  p.hasShape({
    currentStep: p.isAnyOf(
      ...(['inclui-restricao', 'pesquisa-veiculo', 'confirma-restricao'] as const).map(x =>
        p.isLiteral(x)
      )
    ),
  })
);
export type Extension = p.Static<typeof isExtension>;

interface Listener {
  source: string;
  fn: Handler<Extension | null>;
  once: boolean;
}

interface AjaxListener {
  listen(source: string, fn: Handler<Extension | null>): void;
  listenOnce(source: string): Promise<Extension | null>;
}

let ajaxListener: AjaxListener;
export function getAjaxListener(): AjaxListener {
  if (ajaxListener) return ajaxListener;
  const listeners = new Set<Listener>();
  jQuery.fx.off = true;
  $(document).ajaxComplete((_, xhr, opts) => onResult(toResult(xhr, opts)));

  return (ajaxListener = { listen, listenOnce });

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
    if (!p.hasShape({ source: p.isString })(ajaxOptions))
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
      const parsed = JSON.parse(text) as unknown;
      if (isExtension(parsed)) return createResult(parsed);
      else return createResult();
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

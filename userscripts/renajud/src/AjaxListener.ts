import * as p from '@nadameu/predicates';
import { createResolvable } from '@nadameu/resolvable';

const isExtension = p.isAnyOf(
  p.hasShape({ totalRecords: p.isNumber }),
  p.hasShape({ currentStep: p.isString })
);
type Extension = p.Static<typeof isExtension>;

type Handler = (_: Extension | null) => void;
type Handlers = Map<string, Handler[]>;

const callbacks: Handlers = new Map();
const resolves: Handlers = new Map();

function getOrCreate(collection: Handlers, id: string) {
  if (!collection.has(id)) {
    collection.set(id, []);
  }
  return collection.get(id)!;
}

function addItem(collection: Handlers, id: string, item: Handler) {
  getOrCreate(collection, id).push(item);
}

const addCallback = addItem.bind(null, callbacks);
const getCallbacks = getOrCreate.bind(null, callbacks);

const addResolve = addItem.bind(null, resolves);
function getResolves(source: string) {
  const sourceResolves = getOrCreate(resolves, source);
  resolves.delete(source);
  return sourceResolves;
}

jQuery.fx.off = true;
$(window.document).ajaxComplete(ajaxCompleteHandler);

function ajaxCompleteHandler(
  event: JQuery.TriggeredEvent<Document, undefined, Document, Document>,
  xhr: JQuery.jqXHR,
  ajaxOptions: JQuery.AjaxSettings
): void | false {
  const extension = (() => {
    if (!xhr.responseXML) return null;
    const extension = $('extension', xhr.responseXML).text();
    try {
      const value = JSON.parse(extension);
      if (isExtension(value)) return value;
    } catch (_) {}
    return null;
  })();
  try {
    p.assert(p.isNotNullish(xhr.responseXML));
    console.dir(xhr.responseXML.documentElement.outerHTML);
    p.assert(p.hasShape({ source: p.isString })(ajaxOptions));
    getResolves(ajaxOptions.source).forEach(resolve => resolve(extension));
    getCallbacks(ajaxOptions.source).forEach(callback => callback(extension));
  } catch (error) {
    console.error(error);
  }
}

export function listen(source: string, fn: Handler) {
  console.debug('AjaxListener.listen(source)', source, fn);
  addCallback(source, fn);
}

export function listenOnce(source: string) {
  console.debug('AjaxListener.listenOnce(source)', source);
  const [promise, { resolve }] = createResolvable<Extension | null>();
  addResolve(source, resolve);
  return promise;
}

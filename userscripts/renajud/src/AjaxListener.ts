import {
  hasShape,
  isAnyOf,
  isLiteral,
  isNull,
  isNumber,
  isString,
  Static,
} from '@nadameu/predicates';
import { createResolvable } from '@nadameu/resolvable';

const isExtension = isAnyOf(
  hasShape({ totalRecords: isNumber }),
  hasShape({ currentStep: isString })
);
type Extension = Static<typeof isExtension>;

const isDetails = hasShape({
  type: isLiteral('ajaxComplete'),
  source: isString,
  extension: isAnyOf(isExtension, isNull),
});
type Details = Static<typeof isDetails>;

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

function privilegedCode() {
  jQuery.fx.off = true;

  const origin = document.location.origin;

  function sendObject(obj: Details) {
    window.postMessage(JSON.stringify(obj), origin);
  }

  function hasKeyOfType<T, K extends string>(
    obj: T,
    key: K,
    type: 'string'
  ): obj is T & { [k in K]: string };
  function hasKeyOfType<T, K extends string>(
    obj: T,
    key: K,
    type: 'number'
  ): obj is T & { [k in K]: number };
  function hasKeyOfType<T, K extends string>(obj: T, key: K, type: string): boolean {
    return key in obj && typeof (obj as T & { [k in K]: unknown })[key] === type;
  }

  $(window.document).ajaxComplete((evt, xhr, options) => {
    if (!xhr.responseXML) return;
    if (!hasKeyOfType(options, 'source', 'string')) return;
    const extensionText = $('extension', xhr.responseXML).text();
    let extension: Extension | null = null;
    if (extensionText !== '') {
      const parsed = JSON.parse(extensionText) as unknown;
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        hasKeyOfType(parsed, 'totalRecords', 'number')
      ) {
        extension = parsed;
      } else return;
    }
    sendObject({
      type: 'ajaxComplete',
      source: options.source,
      extension,
    });
  });
}

const script = document.createElement('script');
script.innerHTML = '(' + privilegedCode.toString() + ')();';
document.getElementsByTagName('head')[0]!.appendChild(script);

const origin = document.location.origin;
window.addEventListener(
  'message',
  function (evt) {
    if (evt.origin !== origin) {
      return;
    }
    try {
      const eventDetails = JSON.parse(evt.data);
      if (eventDetails.type === 'ajaxComplete') {
        getResolves(eventDetails.source).forEach(resolve => resolve(eventDetails.extension));
        getCallbacks(eventDetails.source).forEach(callback => callback(eventDetails.extension));
        console.debug('ajaxComplete()', eventDetails);
      } else {
        throw new Error('Tipo desconhecido: ' + eventDetails.type);
      }
    } catch (err) {
      console.error(err);
    }
  },
  false
);

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

import { Handler } from '@nadameu/handler';

export const AjaxListener = (() => {
  const callbacks = new Map<string, Handler<unknown>[]>();
  const resolves = new Map<string, Handler<unknown>[]>();

  function getOrCreate<T, U>(collection: Map<T, U[]>, id: T): U[] {
    if (!collection.has(id)) {
      collection.set(id, []);
    }
    return collection.get(id)!;
  }

  function addItem<T, U>(collection: Map<T, U[]>, id: T, item: U): void {
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

  $(document).ajaxComplete((evt, xhr, options) => {
    const extensionText =
      Array.from(xhr.responseXML?.querySelectorAll('extension') ?? [])
        .map(x => x.textContent ?? '')
        .join('') || null;
    let extension: unknown;
    if (extensionText === null) {
      extension = null;
    } else {
      extension = JSON.parse(extensionText);
    }
    const source = (options as { source?: unknown }).source;
    try {
      getResolves(source).forEach(resolve => resolve(extension));
      getCallbacks(source).forEach(callback => callback(extension));
      console.debug('ajaxComplete()', { source, extension });
    } catch (err) {
      console.error(err);
    }
  });

  return {
    listen(source: string, fn: (extension: unknown) => void) {
      console.debug('AjaxListener.listen(source)', source, fn);
      addCallback(source, fn);
    },
    listenOnce<T>(source: string) {
      console.debug('AjaxListener.listenOnce(source)', source);
      const resolvable: { (resolve: Handler<T>): void; resolve?: Handler<T> } = function (resolve) {
        resolvable.resolve = resolve;
      };
      const promise = new Promise(resolvable);
      addResolve(source, resolvable.resolve as Handler<T>);
      return promise;
    },
  };
})();

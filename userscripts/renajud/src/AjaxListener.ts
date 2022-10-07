export var AjaxListener = (function () {
  'use strict';

  var callbacks = new Map();
  var resolves = new Map();

  function getOrCreate(collection, id) {
    if (!collection.has(id)) {
      collection.set(id, []);
    }
    return collection.get(id);
  }

  function addItem(collection, id, item) {
    getOrCreate(collection, id).push(item);
  }

  var addCallback = addItem.bind(null, callbacks);
  var getCallbacks = getOrCreate.bind(null, callbacks);

  var addResolve = addItem.bind(null, resolves);
  function getResolves(source) {
    var sourceResolves = getOrCreate(resolves, source);
    resolves.delete(source);
    return sourceResolves;
  }

  function privilegedCode() {
    jQuery.fx.off = true;

    const origin = [location.protocol, document.domain].join('//');

    function sendObject(obj) {
      window.postMessage(JSON.stringify(obj), origin);
    }

    $(window.document).ajaxComplete(function (evt, xhr, options) {
      var extension = $('extension', xhr.responseXML).text();
      if (extension === '') {
        extension = null;
      } else {
        extension = JSON.parse(extension);
      }
      var eventDetails = {
        type: 'ajaxComplete',
        source: options.source,
        extension: extension,
      };
      sendObject(eventDetails);
    });
  }

  var script = document.createElement('script');
  script.innerHTML = '(' + privilegedCode.toString() + ')();';
  document.getElementsByTagName('head')[0].appendChild(script);

  const origin = [location.protocol, document.domain].join('//');
  window.addEventListener(
    'message',
    function (evt) {
      if (evt.origin !== origin) {
        return;
      }
      try {
        var eventDetails = JSON.parse(evt.data);
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

  return {
    listen(source, fn) {
      console.debug('AjaxListener.listen(source)', source, fn);
      addCallback(source, fn);
    },
    listenOnce(source) {
      console.debug('AjaxListener.listenOnce(source)', source);
      var hijackedResolve;
      var promise = new Promise(function (resolve) {
        hijackedResolve = resolve;
      });
      addResolve(source, hijackedResolve);
      return promise;
    },
  };
})();

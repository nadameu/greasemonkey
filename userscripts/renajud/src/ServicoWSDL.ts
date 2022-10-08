import { GM_xmlhttpRequest } from '$';
import { GUI } from './GUI';

export var ServicoWSDL = (() => {
  var dadosSalvos = new Map();

  function analisarRespostaNumeroProcesso(xhr) {
    var promise = new Promise((resolve, reject) => {
      var parser = new DOMParser();
      var xml = parser.parseFromString(xhr.responseText, 'application/xml');
      if (xml.lastChild.nodeName === 'parsererror') {
        throw new Error('Erro ao tentar obter os dados do processo.');
      }
      var ret = xml.getElementsByTagName('return')[0].textContent;
      var processo = parser.parseFromString(ret, 'application/xml');
      if (processo.lastChild.nodeName === 'parsererror') {
        throw new Error('Erro ao tentar obter os dados do processo.');
      }
      var erros = [...processo.getElementsByTagName('Erro')].map(err => err.textContent);
      if (erros.length) {
        reject(new Error(erros.join('\n')));
      } else {
        var docs = [...processo.querySelectorAll('Partes Parte CPF_CGC')]
          .filter(doc => doc.parentNode.querySelectorAll('Réu').length > 0)
          .map(doc => doc.textContent);
        dadosSalvos.set(GUI.estado + GUI.numproc, docs);
        resolve(docs);
      }
    });
    return promise;
  }

  var ServicoWSDL = {
    obterDocumentosReus(numproc) {
      console.debug('ServicoWSDL.obterDocumentosReus(numproc)', numproc);
      var estado = GUI.estado;
      var id = estado + numproc;
      if (dadosSalvos.has(id)) {
        return Promise.resolve(dadosSalvos.get(id));
      }
      var promise = new Promise((resolve, reject) => {
        var options = {
          method: 'POST',
          url: 'https://www2.trf4.jus.br/trf4/processos/acompanhamento/consultaws.php',
          data: [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">',
            '<SOAP-ENV:Header/>',
            '<SOAP-ENV:Body>',
            `<num_proc>${numproc}</num_proc>`,
            `<uf>${estado}</uf>`,
            '<todas_fases>N</todas_fases>',
            '<todas_partes>S</todas_partes>',
            '<todos_valores>N</todos_valores>',
            '</SOAP-ENV:Body>',
            '</SOAP-ENV:Envelope>',
          ].join(''),
          headers: {
            SOAPAction: 'consulta_processual_ws_wsdl#ws_consulta_processo',
          },
          onload: xhr => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr);
            } else {
              reject(new Error('Erro ao tentar obter os dados do processo.'));
            }
          },
          onerror: () => {
            reject(new Error('Erro ao tentar obter os dados do processo.'));
          },
        };
        GM_xmlhttpRequest(options);
      });
      return promise.then(analisarRespostaNumeroProcesso);
    },
  };
  return ServicoWSDL;
})();

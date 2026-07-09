// ==UserScript==
// @name         eproc-area-de-trabalho-exportar
// @name:pt-BR   eproc - área de trabalho - exportar
// @namespace    http://nadameu.com.br
// @version      2.0.0
// @author       nadameu
// @description  Permite exportar minutas da área de trabalho
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=minuta_area_trabalho&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=minuta_area_trabalho&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=minuta_area_trabalho&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=minuta_area_trabalho&*
// @match        https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=minuta_imprimir&*
// @match        https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=minuta_imprimir&*
// @match        https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=minuta_imprimir&*
// @match        https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=minuta_imprimir&*
// @require      https://cdn.jsdelivr.net/npm/@zip.js/zip.js@2.8.26/dist/zip.min.js
// @grant        GM_addStyle
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_info
// @grant        GM_setValue
// @grant        unsafeWindow
// @grant        window.close
// @run-at       document-start
// ==/UserScript==

(function (_zip_js_zip_js) {
  'use strict';
  var s = new Set();
  var _css = async t => {
    if (s.has(t)) return;
    s.add(t);
    (c => {
      if (typeof GM_addStyle === 'function') GM_addStyle(c);
      else
        (document.head || document.documentElement)
          .appendChild(document.createElement('style'))
          .append(c);
    })(t);
  };
  _css(
    ' .infra-styles{& button.infraButton._button_659eq_2{background:#e0d7db;border:1px outset #ccc;&:hover{background:#e5d2da;border:1px outset #ccc;box-shadow:0 2px 4px #000a}&:disabled{opacity:.5}}}\n/*$vite$:1*/ '
  );
  var _GM_deleteValue = (() =>
    typeof GM_deleteValue != 'undefined' ? GM_deleteValue : void 0)();
  var _GM_getValue = (() =>
    typeof GM_getValue != 'undefined' ? GM_getValue : void 0)();
  var _GM_info = (() => (typeof GM_info != 'undefined' ? GM_info : void 0))();
  var _GM_setValue = (() =>
    typeof GM_setValue != 'undefined' ? GM_setValue : void 0)();
  var _unsafeWindow = (() =>
    typeof unsafeWindow != 'undefined' ? unsafeWindow : void 0)();
  function isMensagem(value) {
    return (
      typeof value === 'object' &&
      value !== null &&
      'segredo' in value &&
      'estilos' in value &&
      'minutas' in value &&
      typeof value.segredo === 'string' &&
      Array.isArray(value.estilos) &&
      value.estilos.every(e => typeof e === 'string') &&
      Array.isArray(value.minutas) &&
      value.minutas.every(isMinuta)
    );
  }
  function isMinuta(value) {
    return (
      typeof value === 'object' &&
      value !== null &&
      'titulo' in value &&
      'codigo' in value &&
      'html' in value &&
      typeof value.titulo === 'string' &&
      typeof value.codigo === 'string' &&
      typeof value.html === 'string'
    );
  }
  var ResultImpl = class {
    map(f) {
      return this.chain(x => new Ok(f(x)));
    }
    mapErr(f) {
      return this.catch(x => new Err(f(x)));
    }
  };
  var Ok = class extends ResultImpl {
    value;
    ok = true;
    constructor(value) {
      super();
      this.value = value;
    }
    catch(_) {
      return this;
    }
    chain(f) {
      return f(this.value);
    }
  };
  function ok(value) {
    return new Ok(value);
  }
  var Err = class extends ResultImpl {
    reason;
    ok = false;
    constructor(reason) {
      super();
      this.reason = reason;
    }
    catch(f) {
      return f(this.reason);
    }
    chain(_) {
      return this;
    }
  };
  function err(reason) {
    return new Err(reason);
  }
  function map2(ra, rb, f) {
    return ra.chain(a => rb.map(b => f(a, b)));
  }
  function queryUnique(selector) {
    return context => {
      const elts = context.querySelectorAll(selector);
      if (elts.length === 1) return ok(elts[0]);
      return err(new NotUnique(context, selector));
    };
  }
  var NotUnique = class extends Error {
    name = 'NotUnique';
    cause;
    constructor(context, selector) {
      super();
      this.cause = {
        context,
        selector,
      };
    }
  };
  var area_de_trabalho_module_default = { button: '_button_659eq_2' };
  var CustomError = class extends Error {
    payload;
    constructor(message, payload = {}) {
      super(message);
      this.payload = payload;
    }
  };
  CustomError.prototype.name = 'CustomError';
  function lift_throwable(fn) {
    return (...args) => {
      try {
        const result = fn(...args);
        if (typeof result === 'object' && result !== null && 'then' in result)
          Promise.resolve(result).catch(print_error);
      } catch (err) {
        print_error(err);
      }
    };
  }
  function print_error(err) {
    console.group(`<${_GM_info.script.name}>`);
    console.error(err);
    if (err instanceof CustomError) console.debug(err.payload);
    else if (err instanceof Error && err.cause) console.debug(err.cause);
    console.groupEnd();
  }
  function try_catch(fn) {
    return lift_throwable(fn)();
  }
  function parseAreaDeTrabalho() {
    window.addEventListener(
      'load',
      lift_throwable(() => {
        const imprimir = ok(document).chain(
          queryUnique('button[id="btnImprimir"]')
        );
        const resultado = map2(
          ok(document).chain(queryUnique('table[id="tabelaMinutas"]')),
          imprimir,
          (tabela, imprimir) => {
            const salvar = criar_botao();
            imprimir.after(' ', salvar);
            let state = (() => {
              const init = {
                _tag: 'Init',
                init() {
                  habilitar_botao_se_minutas_selecionadas();
                  state = ocioso;
                },
              };
              const ocioso = {
                _tag: 'Ocioso',
                onminutasclicadas: habilitar_botao_se_minutas_selecionadas,
                onbotaoclicado() {
                  state = {
                    _tag: 'Aguarda_resposta',
                    onmessage: lift_throwable(async ({ data }) => {
                      _GM_deleteValue('salvar');
                      if (isMensagem(data) && data.segredo === segredo) {
                        const url = await gerar_zip(data);
                        if (window.confirm('Fazer download?')) {
                          const link = Object.assign(
                            document.createElement('a'),
                            {
                              href: url,
                              download: 'minutas.zip',
                            }
                          );
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      } else console.debug('Mensagem recebida:', data);
                      habilitar_botao_se_minutas_selecionadas();
                      state = ocioso;
                    }),
                  };
                  salvar.disabled = true;
                  const segredo = Math.random().toString(36).slice(2);
                  _GM_setValue('salvar', segredo);
                  imprimir.click();
                },
              };
              tabela.addEventListener('click', () => {
                if (state._tag === 'Ocioso') state.onminutasclicadas();
              });
              salvar.addEventListener('click', () => {
                if (state._tag === 'Ocioso') state.onbotaoclicado();
              });
              window.addEventListener('message', evt => {
                if (state._tag === 'Aguarda_resposta') state.onmessage(evt);
              });
              return init;
            })();
            state.init();
            function habilitar_botao_se_minutas_selecionadas() {
              const selecionados = tabela.querySelectorAll(
                'input[type="checkbox"]:checked'
              );
              salvar.disabled = selecionados.length === 0;
            }
          }
        );
        if (!resultado.ok) throw resultado.reason;
      })
    );
  }
  function criar_botao() {
    return Object.assign(document.createElement('button'), {
      className: 'infraButton ' + area_de_trabalho_module_default.button,
      type: 'button',
      textContent: 'Fazer download das minutas selecionadas',
      disabled: true,
    });
  }
  async function gerar_zip(mensagem) {
    const zipFileStream = new TransformStream();
    const zipFileBlobPromise = new Response(zipFileStream.readable).blob();
    const zipWriter = new _zip_js_zip_js.ZipWriter(zipFileStream.writable);
    await Promise.all(
      mensagem.minutas.map(async minuta => {
        const nome = `${minuta.titulo}_${minuta.codigo}`;
        const nome_arquivo = `${nome}.html`;
        const codigo_html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${nome}</title>
${mensagem.estilos.join('\n')}
</head>
<body>
${minuta.html}    
</body>
</html>`;
        await zipWriter.add(nome_arquivo, new Blob([codigo_html]).stream());
      })
    );
    await zipWriter.close();
    const zipFileBlob = await zipFileBlobPromise;
    return URL.createObjectURL(
      new File([zipFileBlob], 'minutas.zip', { type: 'application/zip' })
    );
  }
  var acoes = ['minuta_area_trabalho', 'minuta_imprimir'];
  function parseEndereco(url) {
    const acao = url.searchParams.get('acao');
    if (acao !== null && acoes.includes(acao)) return ok(acao);
    else return err(new AcaoDesconhecida(acao));
  }
  var AcaoDesconhecida = class extends Error {
    name = 'AcaoDesconhecida';
    cause;
    constructor(acao) {
      super();
      this.cause = acao;
    }
  };
  function parseImprimir() {
    const segredo = _GM_getValue('salvar');
    _GM_deleteValue('salvar');
    if (segredo !== void 0)
      _unsafeWindow.print = lift_throwable(() => {
        const estilos = [
          ...document.querySelectorAll(
            'link[rel="stylesheet"][href^="css/estilos-editor"]'
          ),
        ].map(e => {
          const clone = e.cloneNode(true);
          clone.href = new URL(clone.href, document.location.href).href;
          return clone.outerHTML;
        });
        const minutas = document
          .querySelectorAll('#toPrint > #Body > #Content > article')
          .values()
          .map((article, index) => {
            return {
              titulo:
                article
                  .querySelector('section[data-nome="titulo"]')
                  ?.textContent.trim()
                  .replace(/ Nº \d+$/, '')
                  .replace(/(\/|\s|-)+/g, '_') ?? 'MINUTA',
              codigo:
                article.querySelector(
                  'footer span[data-codigo_documento_rodape]'
                )?.dataset.codigo_documento_rodape ??
                (index + 1).toString().padStart(12, '0'),
              html: article.innerHTML,
            };
          })
          .toArray();
        const mensagem = {
          segredo,
          estilos,
          minutas,
        };
        window.opener?.postMessage(mensagem);
        window.close();
      });
  }
  function main() {
    const resultado = parseEndereco(new URL(document.location.href)).map(
      acao => {
        switch (acao) {
          case 'minuta_area_trabalho':
            return parseAreaDeTrabalho();
          case 'minuta_imprimir':
            return parseImprimir();
          default:
            return acao;
        }
      }
    );
    if (!resultado.ok) throw resultado.reason;
  }
  try_catch(main);
})(zip);

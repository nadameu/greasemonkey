// ==UserScript==
// @name        sei-zoom-documentos
// @name:pt-br  SEI! - Zoom em documentos
// @namespace   http://nadameu.com.br
// @match       https://sei.trf4.jus.br/controlador.php?acao=arvore_visualizar&*
// @match       https://sei.trf4.jus.br/controlador.php?acao=documento_visualizar&*
// @grant       none
// @version     1.0.0
// @author      Paulo R. Maurici Jr.
// @description Permite aplicar zoom apenas aos documentos do processo, sem afetar o restante da interface
// ==/UserScript==

const LOCAL_STORAGE_NAME = "gm-sei-zoom-documentos";

function main() {
  const url = new URL(document.location.href);
  const params = url.searchParams;
  switch (params.get("acao")) {
    case "arvore_visualizar":
      criar_controles();
      break;

    case "documento_visualizar":
      aplicar_zoom();
      break;

    default:
      throw new Error(`Ação desconhecida: "${String(acao)}".`);
  }
}

function criar_controles() {
  const divs_documento = document.querySelectorAll("#divArvoreConteudoIfr");
  if (divs_documento.length !== 1)
    throw new Error("Erro ao buscar o container do documento.");
  const div_documento = divs_documento[0];

  const iframes = div_documento.querySelectorAll("iframe");
  if (iframes.length !== 1)
    throw new Error("Erro ao buscar a janela do documento.");
  const iframe = iframes[0];

  const nivel = document.createElement("input");
  nivel.type = "number";
  nivel.min = 30;
  nivel.max = 500;
  nivel.step = 10;
  nivel.required = true;
  let zoom_salvo = localStorage.getItem(LOCAL_STORAGE_NAME);
  if (
    Number.isNaN(zoom_salvo) ||
    zoom_salvo < 30 ||
    zoom_salvo > 500 ||
    zoom_salvo % 10 !== 0
  ) {
    localStorage.removeItem(LOCAL_STORAGE_NAME);
    zoom_salvo = 100;
  }
  nivel.value = zoom_salvo.toString();
  const div = document.createElement("div");
  div.onchange = (evt) => logar_erros(aplicar_zoom);
  div.append("Zoom:", nivel, "%");
  div_documento.insertAdjacentElement("beforebegin", div);
  logar_erros(aplicar_zoom);

  function aplicar_zoom() {
    if (!nivel.validity.valid) {
      throw new Error(`Valor inválido: "${nivel.value}".`);
    }

    const zoom = nivel.valueAsNumber;
    iframe.contentDocument.documentElement.style.zoom = (zoom / 100).toString();
    localStorage.setItem(LOCAL_STORAGE_NAME, zoom);
  }
}

function aplicar_zoom() {
  let zoom_salvo = localStorage.getItem(LOCAL_STORAGE_NAME);
  if (
    Number.isNaN(zoom_salvo) ||
    zoom_salvo < 30 ||
    zoom_salvo > 500 ||
    zoom_salvo % 10 !== 0
  ) {
    localStorage.removeItem(LOCAL_STORAGE_NAME);
    zoom_salvo = 100;
  }
  document.documentElement.style.zoom = (zoom_salvo / 100).toString();
}

function logar_erros(fn) {
  try {
    fn();
  } catch (err) {
    console.group("sei-zoom-documentos");
    console.error(err);
    console.groupEnd();
  }
}

logar_erros(main);

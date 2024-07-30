// ==UserScript==
// @name        legislacao-planalto
// @name:pt-BR  Legislação Planalto
// @namespace   http://nadameu.com.br
// @match       https://www.trf4.jus.br/trf4/upload/legislacao/*
// @match       http://www.planalto.gov.br/ccivil_03/*
// @match       https://www.planalto.gov.br/ccivil_03/*
// @match       http://www.planalto.gov.br/CCIVIL_03/*
// @match       https://www.planalto.gov.br/CCIVIL_03/*
// @grant       GM_addStyle
// @version     1.2.0
// @author      nadameu
// @description Melhora a aparência da legislação disponível no site do Planalto
// @run-at      document-start
// ==/UserScript==

if (document.location.hostname.match(/trf4/)) {
  GM_addStyle(`
body {
  font-size: 0.85em;
}
`);
}

GM_addStyle(`
:root > body {
  margin: 2em auto;
  max-width: 90ch;
  background: hsl(333deg 8% 68%);
  color: hsl(333deg 60% 13.8%);
}
body {
  position: relative;
  padding-top: 2em;
  font-family: Arial, sans-serif;
  line-height: 1.5em;
}
body::before {
  content: "";
  background: hsl(333deg 12% 96%);
  position: absolute;
  inset: 0 -2cm;
  z-index: -1;
  box-shadow: 2px 2px 4px #0008, 4px 4px 8px #0004, 8px 8px 16px #0002;
}
i.fas {
  text-indent: 0;
}
strike,
[style*="line-through"] {
  opacity: .5;
}
a:link {
  color: hsl(213deg 60% 40%);
}
a:visited {
  color: hsl(273deg 60% 40%);
}
`);

document.addEventListener("readystatechange", checkComplete);
checkComplete();

function checkComplete() {
  if (document.readyState === "complete") {
    document.removeEventListener("readystatechange", checkComplete);
    onload();
  }
}

function onload() {
  for (const ordm of xQuery(
    '//sup[u/text()="o"]|//u[sup/text()="o"]|//sup[text()="o"]',
    document.body
  )) {
    ordm.parentNode.replaceChild(new Text("º"), ordm);
  }
  for (const text of xQuery("//text()", document.body)) {
    text.nodeValue = text.nodeValue.replace(/\s+/g, " ");
  }
}

function xQuery(expr, context) {
  return {
    *[Symbol.iterator]() {
      const nodes = document.evaluate(
        expr,
        context,
        null,
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE
      );
      for (let i = 0; i < nodes.snapshotLength; i += 1) {
        yield nodes.snapshotItem(i);
      }
    },
  };
}

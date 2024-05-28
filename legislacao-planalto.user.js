// ==UserScript==
// @name        legislacao-planalto
// @name:pt-BR  Legislação Planalto
// @namespace   http://nadameu.com.br
// @match       http://www.planalto.gov.br/ccivil_03/*
// @match       https://www.planalto.gov.br/ccivil_03/*
// @match       http://www.planalto.gov.br/CCIVIL_03/*
// @match       https://www.planalto.gov.br/CCIVIL_03/*
// @grant       GM_addStyle
// @version     1.0.0
// @author      nadameu
// @description Melhora a aparência da legislação disponível no site do Planalto
// @run-at      document-start
// ==/UserScript==

GM_addStyle(`
:root > body {
  margin: 0 auto;
  max-width: 90ch;
  background: hsl(60, 25%, 96%);
  color: #003;
}
i.fas {
  text-indent: 0;
}
strike, [style*="line-through"] {
  opacity: .5;
}
a:link {
  color: hsl(213, 60%, 40%);
}
a:visited {
  color: hsl(273, 60%, 40%);
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

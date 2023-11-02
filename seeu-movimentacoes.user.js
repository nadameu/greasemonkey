// ==UserScript==
// @name        seeu-movimentacoes
// @name:pt-BR  SEEU - Movimentações
// @namespace   nadameu.com.br
// @match       https://seeu.pje.jus.br/seeu/visualizacaoProcesso.do?*
// @grant       GM_addStyle
// @version     1.0.0
// @author      nadameu
// @description Melhoria na apresentação das movimentações do processo
// ==/UserScript==

(function () {
  const abaCorreta = document.querySelector(
    'li[name="tabMovimentacoesProcesso"].currentTab'
  );
  if (!abaCorreta) return;

  const links = document.querySelectorAll('img[id^=iconmovimentacoes]');
  const ob = new IntersectionObserver(([{ target: link }]) => {
    ob.unobserve(link);
    console.log(link);
    link.click();
  });
  links.forEach(link => {
    ob.observe(link);
  });

  GM_addStyle(/* css */ `
body {
  background-image: linear-gradient(to bottom, hsl(270, 100%, 98.8%) 0%, hsl(267.7, 13.8%, 63.1%) 100%);
  background-attachment: fixed;
}

table.resultTable > colgroup > col:nth-child(2) {
  visibility: collapse;
}

table.resultTable tr div.extendedinfo {
  width: fit-content;
  border: none;
}

table.resultTable table.form {
  width: auto;
}

table.resultTable table.form td {
  width: auto;
}
  `);
})();

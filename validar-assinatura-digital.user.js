// ==UserScript==
// @name        validar-assinatura-digital
// @name:pt-BR  Validar assinatura digital
// @description Envia documentos PDF para o site validar.iti.gov.br para validação de assinatura digital
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=acessar_documento&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=acessar_documento&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=acessar_documento&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=acessar_documento&*
// @match       https://validar.iti.gov.br/
// @version     2.1.0
// @author      nadameu
// @grant       GM.getValue
// @grant       GM.deleteValue
// @grant       GM.setValue
// @grant       GM.xmlHttpRequest
// ==/UserScript==

class DocumentoInvalido extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'DocumentoInvalido';
  }
}

main();

async function main() {
  if (/^(eproc|homologa-1g1)\.(jf(pr|rs|sc)|trf4)\.jus\.br$/.test(document.location.hostname)) {
    try {
      const iframe = document.getElementById('conteudoIframe');
      if (!iframe) return;
      const css = document.head.appendChild(document.createElement('style'));
      css.textContent = /* css */ `
body {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
button {
  background-color: hsl(266, 23%, 78%);
  color: hsl(266, 50%, 8%);
}
`;
      const url = new URL(iframe.src);
      const button = document.createElement('button');
      button.type = 'button';
      button.addEventListener('click', async () => {
        try {
          await GM.setValue('customPDF', url.href);
          await GM.setValue('customPDFName', document.title.replace(/\W+/g, '_') + '.pdf');
          window.open('https://validar.iti.gov.br/');
        } catch (err) {
          console.error(err);
        }
      });
      button.textContent = 'Validar assinatura digital';
      iframe.insertAdjacentElement('afterend', button);
    } catch (err) {
      console.error(err);
    }
  } else if (/^validar\.iti\.gov\.br$/.test(document.location.hostname)) {
    try {
      const url = await GM.getValue('customPDF', undefined);
      if (!url) return;
      await GM.deleteValue('customPDF');
      const filename = (await GM.getValue('customPDFName')) || 'documento_userscript.pdf';
      await GM.deleteValue('customPDFName');
      const blob = await new Promise(async (resolve, reject) => {
        GM.xmlHttpRequest({
          url: url,
          responseType: 'blob',
          onload: xhr => resolve(xhr.response),
          onerror: reject,
        });
      });
      if (!/^application\/pdf;?$/.test(blob.type)) {
        throw new DocumentoInvalido(`Erro no formado do arquivo: ${blob.type}.`);
      }
      console.log('url', url);
      console.log('blob', blob);
      const transfer = new DataTransfer();
      transfer.items.add(new File([blob], filename, { type: blob.type }));
      document.getElementById('signature_files').files = transfer.files;
      $('#signature_files').trigger('change');
      $('#acceptTerms').trigger('click');
      $('#validateSignature').trigger('click');
    } catch (err) {
      if (err instanceof DocumentoInvalido) {
        window.alert('Utilize apenas documentos PDF.');
      } else {
        window.alert('Ocorreu um erro desconhecido.');
      }
      console.error(err);
      window.close();
    }
  }
}

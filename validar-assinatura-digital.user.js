// ==UserScript==
// @name        validar-assinatura-digital
// @name:pt-BR  Validar assinatura digital
// @namespace   http://nadameu.com.br
// @match       https://eproc.jfpr.jus.br/eprocV2/controlador.php?acao=acessar_documento&*
// @match       https://eproc.jfrs.jus.br/eprocV2/controlador.php?acao=acessar_documento&*
// @match       https://eproc.jfsc.jus.br/eprocV2/controlador.php?acao=acessar_documento&*
// @match       https://eproc.trf4.jus.br/eproc2trf4/controlador.php?acao=acessar_documento&*
// @match       https://homologa-1g1.trf4.jus.br/homologa_1g/controlador.php?acao=acessar_documento&*
// @match       https://validar.iti.gov.br/
// @version     1.0.0
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
      if (! iframe) return;
      const url = new URL(iframe.src);
      const button = document.createElement('button');
      button.type = 'button';
      button.addEventListener('click', async () => {
        try {
          await GM.setValue('customPDF', url.href);
          window.open('https://validar.iti.gov.br/');
        } catch (err) {
          console.error(err);
        }
      });
      button.textContent = 'Validar assinatura digital';
      iframe.insertAdjacentElement('beforebegin', button);
    } catch (err) {
      console.error(err);
    }
  } else if (/^validar\.iti\.gov\.br$/.test(document.location.hostname)) {
    try {
      const url = await GM.getValue('customPDF');
      if (! url) return;
      await GM.deleteValue('customPDF');
      const blob = await new Promise(async (resolve, reject) => {
        GM.xmlHttpRequest({
          url: url,
          responseType: 'blob',
          onload: xhr => resolve(xhr.response),
          onerror: reject,
        });
      });
      if (blob.type !== 'application/pdf') {
        throw new DocumentoInvalido(`Erro no formado do arquivo: ${blob.type}.`);
      }
      console.log('url', url);
      console.log('blob', blob);
      const transfer = new DataTransfer();
      transfer.items.add(new File([blob], 'documento_userscript.pdf', {type: blob.type}));
      document.getElementById('signature_files').files = transfer.files;
      $('#signature_files').trigger('change');
      $('#acceptTerms').click();
      $('#validateSignature').click();
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

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
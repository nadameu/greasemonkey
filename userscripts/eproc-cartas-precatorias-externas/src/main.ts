import { pdpj_main } from './pdpj_main';
import { eproc_main } from './eproc_main';

export async function main() {
  switch (document.location.hostname) {
    case 'eproc.jfpr.jus.br':
    case 'eproc.jfrs.jus.br':
    case 'eproc.jfsc.jus.br':
    case 'eproc.trf4.jus.br':
      return eproc_main();

    case 'portaldeservicos.pdpj.jus.br':
      return pdpj_main();

    default:
      throw new Error(`Servidor desconhecido: ${document.location.hostname}.`);
  }
}

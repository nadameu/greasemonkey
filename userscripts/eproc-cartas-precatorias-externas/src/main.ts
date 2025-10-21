import { eproc_main } from './eproc_main';
import { pdpj_main } from './pdpj_main';

export async function main() {
  const hostname = document.location.hostname;
  switch (hostname) {
    case 'eproc.jfpr.jus.br':
    case 'eproc.jfrs.jus.br':
    case 'eproc.jfsc.jus.br':
    case 'eproc.trf4.jus.br':
      return eproc_main();

    case 'portaldeservicos.pdpj.jus.br':
      return pdpj_main();

    default:
      throw new Error(`Servidor desconhecido: ${hostname}.`);
  }
}

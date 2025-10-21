import { GM } from '$';
import { NumProc } from './NumProc';

export async function abrir_aba_pdpj(numero: NumProc) {
  await GM.setValue('numero', numero);
  window.open('https://portaldeservicos.pdpj.jus.br/consulta', '_blank');
}

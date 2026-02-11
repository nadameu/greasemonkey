import { GM } from '$';

export async function abrir_aba_pdpj(numero: string) {
  await GM.setValue('numero', numero);
  window.open('https://portaldeservicos.pdpj.jus.br/consulta', '_blank');
}

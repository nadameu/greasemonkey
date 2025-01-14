import { tela_com_barra_superior } from './tela_com_barra_superior';
import { tela_processo } from './tela_processo';

export async function main() {
  const casas = Array.from(
    document.querySelectorAll<HTMLElement>('#navbar i.navbar-icons')
  ).filter(x => x.textContent === 'home');
  if (casas.length > 1) throw new Error('Mais de um ícone encontrado.');
  if (casas.length === 0) return;
  await tela_com_barra_superior(casas[0]!);

  const url = new URL(document.location.href);
  if (url.searchParams.get('acao') === 'processo_selecionar') {
    await tela_processo();
  }
}

import { h } from '@nadameu/create-element';

export function adicionarAvisoCarregando({ tabela }: { tabela: HTMLElement }) {
  const aviso = h('label', { className: 'gm-ajg__aviso' });
  tabela.insertAdjacentElement('beforebegin', aviso);
  let qtdPontinhos = 2;
  function update() {
    const pontinhos = '.'.repeat(qtdPontinhos + 1);
    aviso.textContent = `Aguarde, carregando formulário${pontinhos}`;
    qtdPontinhos = (qtdPontinhos + 1) % 3;
  }
  const timer = window.setInterval(update, 1000 / 3);
  update();
  return {
    set carregado(carregado: boolean) {
      window.clearInterval(timer);
      if (carregado) {
        aviso.classList.add('gm-ajg__aviso--carregado');
        aviso.textContent =
          'Selecione as nomeações desejadas para criar solicitações de pagamento em bloco através do formulário no final da página.';
      } else {
        aviso.classList.add('gm-ajg__aviso--nao-carregado');
      }
    },
  };
}

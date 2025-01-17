import { h } from '@nadameu/create-element';

export function criar_dialogo(titulo: string, classes: CSSModuleClasses) {
  const aviso = h(
    'div',
    { classList: [classes.aviso] },
    h('p', { style: { textAlign: 'center' } }, h('strong', {}, 'ATENÇÃO'))
  );
  const output = h('output');
  const barra_topo = h(
    'div',
    { classList: [classes.barra] },
    h('button', { type: 'button' }, 'Fechar')
  );
  const barra_rodape = barra_topo.cloneNode(true) as HTMLDivElement;
  const barras = [barra_topo, barra_rodape];
  barras.forEach(barra => {
    barra.querySelector('button')!.onclick = onclick;
  });
  const dialogo = h(
    'dialog',
    { classList: [classes.dialogo] },
    aviso,
    h('h1', {}, titulo),
    barra_topo,
    output,
    barra_rodape
  );
  return { dialogo, aviso, output, barras };

  function onclick(evt: Event) {
    evt.preventDefault();
    dialogo.close();
  }
}

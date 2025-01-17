import { h } from '@nadameu/create-element';

export function criar_dialogo(titulo: string, classes: CSSModuleClasses) {
  const aviso = h(
    'div',
    { classList: [classes.aviso] },
    h('p', { style: { textAlign: 'center' } }, h('strong', {}, 'ATENÇÃO'))
  );
  const output = h('output');
  const dialogo = h(
    'dialog',
    { classList: [classes.dialogo] },
    aviso,
    h('h1', {}, titulo),
    h(
      'div',
      { classList: [classes.barra] },
      h('button', { type: 'button', onclick }, 'Fechar')
    ),
    output,
    h(
      'div',
      { classList: [classes.barra] },
      h('button', { type: 'button', onclick }, 'Fechar')
    )
  );
  return { dialogo, aviso, output };

  function onclick(evt: Event) {
    evt.preventDefault();
    dialogo.close();
  }
}

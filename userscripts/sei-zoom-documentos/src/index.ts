import { h } from '@nadameu/create-element';
import { Opaque } from '@nadameu/opaque';
import * as p from '@nadameu/predicates';
import classes from './estilos.module.scss';

type ValorZoom = Opaque<p.Natural, { ValorZoom: ValorZoom }>;

const ZOOM_PADRAO = 100 as ValorZoom;
const ZOOM_MINIMO = 30 as ValorZoom;
const ZOOM_MAXIMO = 500 as ValorZoom;
const ZOOM_STEP = 10 as p.Natural;

function aproximar(valor: number) {
  return (ZOOM_MINIMO +
    Math.round((valor - ZOOM_MINIMO) / ZOOM_STEP) * ZOOM_STEP) as ValorZoom;
}

const LOCAL_STORAGE_NAME = 'gm-sei-zoom-documentos';

function main() {
  const url = new URL(document.location.href);
  const params = url.searchParams;
  const acao = params.get('acao');
  switch (acao) {
    case 'arvore_visualizar':
      criar_controles();
      break;

    case 'documento_visualizar':
      aplicar_zoom();
      break;

    default:
      throw new Error(`Ação desconhecida: "${String(acao)}".`);
  }
}

function criar_controles() {
  const div_documento = query_one(
    document,
    '#divArvoreConteudoIfr',
    'Erro ao buscar o container do documento.'
  );

  const iframe = query_one<HTMLIFrameElement>(
    div_documento,
    'iframe',
    'Erro ao buscar a janela do documento.'
  );

  const nivel = h('input', {
    type: 'number',
    min: ZOOM_MINIMO.toString(),
    max: ZOOM_MAXIMO.toString(),
    step: ZOOM_STEP.toString(),
    required: true,
    value: localStorage.getItem(LOCAL_STORAGE_NAME) ?? ZOOM_PADRAO.toString(),
    onchange,
  });
  if (!nivel.validity.valid) {
    onchange();
  }
  const div = h(
    'div',
    { className: classes.div },
    'Zoom do documento:',
    nivel,
    '%'
  );
  div_documento.insertAdjacentElement('afterend', div);

  function onchange() {
    return logar_erros(() => {
      if (nivel.validity.rangeUnderflow) {
        nivel.value = nivel.min;
      } else if (nivel.validity.rangeOverflow) {
        nivel.value = nivel.max;
      } else if (nivel.validity.stepMismatch) {
        nivel.value = aproximar(nivel.valueAsNumber).toString();
      } else if (!nivel.validity.valid) {
        nivel.value = ZOOM_PADRAO.toString();
      }
      const valor = nivel.valueAsNumber;
      localStorage.setItem(LOCAL_STORAGE_NAME, valor.toString());
      const zoom = valor / 100;
      if (!iframe.contentDocument) {
        throw new Error('Conteúdo do documento não encontrado.');
      }
      iframe.contentDocument.documentElement.style.zoom = zoom.toString();
    });
  }
}

function aplicar_zoom() {
  const input = window.parent?.document.querySelector<HTMLInputElement>(
    `.${classes.div} > input`
  );
  if (!input || !input.validity.valid) return;
  const zoom = input.valueAsNumber / 100;
  document.documentElement.style.zoom = zoom.toString();
}

function query_one<T extends Element>(
  context: ParentNode,
  selector: string,
  error_msg: string
) {
  const elements = context.querySelectorAll<T>(selector);
  if (elements.length !== 1) throw new Error(error_msg);
  return elements[0]!;
}

function logar_erros(fn: () => void) {
  try {
    fn();
  } catch (err) {
    console.group('sei-zoom-documentos');
    console.error(err);
    console.groupEnd();
  }
}

logar_erros(main);

import { h } from '@nadameu/create-element';
import { Either, Left, Right, validateAll } from '@nadameu/either';
import { expectUnreachable } from '@nadameu/expect-unreachable';
import { createFiniteStateMachine } from '@nadameu/finite-state-machine';
import * as p from '@nadameu/predicates';
import { NumProc } from './NumProc';
import { adicionarProcessoAguardando } from './processosAguardando';
import { TransicaoInvalida } from './TransicaoInvalida';

export function paginaProcesso(numproc: NumProc): Either<Error[], void> {
  return validateAll([obterInformacoesAdicionais(), obterLink()]).map(
    ([informacoesAdicionais, link]) =>
      modificarPaginaProcesso({ informacoesAdicionais, link, numproc, url: link.href })
  );
}

function modificarPaginaProcesso({
  informacoesAdicionais,
  link,
  numproc,
  url,
}: {
  informacoesAdicionais: HTMLElement;
  link: HTMLAnchorElement;
  numproc: NumProc;
  url: string;
}) {
  type Estado =
    | { status: 'AGUARDA_VERIFICACAO_SALDO'; tentativas: number }
    | { status: 'COM_CONTA' }
    | { status: 'SEM_CONTA' }
    | { status: 'ERRO' };
  type Acao = { type: 'TICK' } | { type: 'CLIQUE' };
  const fsm = createFiniteStateMachine<Estado, Acao>(
    { status: 'AGUARDA_VERIFICACAO_SALDO', tentativas: 0 },
    {
      AGUARDA_VERIFICACAO_SALDO: {
        TICK: (acao, estado) => {
          if (link.textContent === '') {
            if (estado.tentativas > 30) return { status: 'ERRO' };
            return { status: 'AGUARDA_VERIFICACAO_SALDO', tentativas: estado.tentativas + 1 };
          }
          if (link.textContent === 'Há conta com saldo') return { status: 'COM_CONTA' };
          return { status: 'SEM_CONTA' };
        },
      },
      COM_CONTA: {
        CLIQUE: (acao, estado) => {
          adicionarProcessoAguardando(numproc);
          window.open(url);
          return estado;
        },
      },
      SEM_CONTA: {
        CLIQUE: (acao, estado) => {
          window.open(url);
          return estado;
        },
      },
      ERRO: {},
    },
    (estado, acao) => ({ status: 'ERRO', erro: new TransicaoInvalida(estado, acao) })
  );

  {
    const timer = window.setInterval(() => {
      fsm.dispatch({ type: 'TICK' });
    }, 100);
    const sub = fsm.subscribe(estado => {
      if (estado.status !== 'AGUARDA_VERIFICACAO_SALDO') {
        window.clearInterval(timer);
        sub.unsubscribe();
      }
    });
  }

  {
    interface JSX {
      tag: string;
      props: { style?: Record<string, string>; [key: string]: any };
      children: Array<string | JSX>;
    }

    function t(tag: JSX['tag'], props: JSX['props'], ...children: Array<string | JSX>): JSX {
      return { tag, props, children };
    }

    function render(estado: Estado): JSX {
      switch (estado.status) {
        case 'AGUARDA_VERIFICACAO_SALDO':
          return t('output', {}, 'Verificando contas com saldo...');

        case 'COM_CONTA':
          return t('button', { onClick }, 'Atualizar saldo RPV');

        case 'SEM_CONTA':
          return t('button', { onClick }, 'Verificar saldo RPV');

        case 'ERRO':
          return t(
            'output',
            { style: { color: 'red' } },
            'Ocorreu um erro com a atualização de saldo de RPV.'
          );

        default:
          return expectUnreachable(estado);
      }
    }

    function mount(jsx: JSX, before: HTMLElement) {
      let elt = create(jsx);
      before.insertAdjacentElement('beforebegin', elt);
      return function patch(newJSX: JSX) {
        elt = patchElement(elt, newJSX, jsx);
        jsx = newJSX;
        function patchElement(element: HTMLElement, newJSX: JSX, oldJSX: JSX): HTMLElement {
          if (newJSX.tag !== oldJSX.tag) {
            for (const [key, value] of Object.entries(oldJSX.props)) {
              if (/^on/.test(key)) {
                element.removeEventListener(key.slice(2).toLowerCase(), value);
              }
            }
            const newElement = create(newJSX);
            element.replaceWith(newElement);
            return newElement;
          }

          // Remover propriedades conflitantes
          for (const [key, value] of Object.entries(oldJSX.props)) {
            if (key === 'style') {
              const oldStyles = value as Record<string, string>;
              const newStyles = newJSX.props.style ?? {};
              for (const key of Object.keys(oldStyles)) {
                if (!(key in newStyles)) {
                  (element.style as any)[key] = '';
                }
              }
            } else if (/^on/.test(key)) {
              if (newJSX.props[key] !== value) {
                element.removeEventListener(key.slice(2).toLowerCase(), value);
              }
            } else {
              if (newJSX.props[key] !== value) {
                (element as any)[key] = null;
              }
            }
          }

          // Definir propriedades
          for (const [key, value] of Object.entries(newJSX.props)) {
            if (key === 'style') {
              const css = value;
              for (const [key, value] of Object.entries(css)) {
                (element.style as any)[key] = value;
              }
            } else if (/^on/.test(key)) {
              element.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
              (element as any)[key] = value;
            }
          }

          // Ajustar filhos
          const removed = new Map<string, Array<{ element: HTMLElement; jsx: JSX }>>();
          let oldIndex = 0;
          let newIndex = 0;
          while (true) {
            const oldChild = oldJSX.children[oldIndex]!;
            const newChild = newJSX.children[newIndex]!;
            if (!newChild) {
              break;
            } else if (!oldChild) {
              if (typeof newChild === 'string') {
                element.append(newChild);
              } else {
                if (removed.has(newChild.tag)) {
                  const elts = removed.get(newChild.tag)!;
                  const first = elts.pop()!;
                  if (elts.length === 0) {
                    removed.delete(newChild.tag);
                  }
                  element.appendChild(patchElement(first.element, newChild, first.jsx));
                } else {
                  element.appendChild(create(newChild));
                }
              }
              newIndex += 1;
            } else if (typeof oldChild === 'string' && typeof newChild === 'string') {
              if (newChild !== oldChild) {
                element.childNodes[newIndex]!.textContent = newChild;
                oldIndex += 1;
                newIndex += 1;
              } else {
                oldIndex += 1;
                newIndex += 1;
              }
            } else if (typeof oldChild === 'string') {
              element.childNodes[newIndex]!.remove();
              oldIndex += 1;
            } else if (typeof newChild === 'string') {
              removed.set(
                oldChild.tag,
                (removed.get(oldChild.tag) ?? []).concat([
                  { element: element.childNodes[newIndex] as HTMLElement, jsx: oldChild },
                ])
              );
              element.removeChild(element.childNodes[newIndex]!);
              oldIndex += 1;
            } else {
              patchElement(element.childNodes[newIndex] as HTMLElement, newChild, oldChild);
              oldIndex += 1;
              newIndex += 1;
            }
          }
          return element;
        }
      };
      function create(jsx: JSX): HTMLElement {
        const elt = document.createElement(jsx.tag);
        for (const [key, value] of Object.entries(jsx.props)) {
          if (key === 'style') {
            const css = value;
            for (const [key, value] of Object.entries(css)) {
              (elt.style as any)[key] = value;
            }
          } else if (/^on/.test(key)) {
            elt.addEventListener(key.slice(2).toLowerCase(), value);
          } else {
            (elt as any)[key] = value;
          }
        }
        for (const child of jsx.children) {
          if (typeof child === 'string') {
            elt.appendChild(document.createTextNode(child));
          } else {
            elt.appendChild(create(child));
          }
        }
        return elt;
      }
    }

    let patch: ReturnType<typeof mount> | undefined;
    const sub = fsm.subscribe(estado => {
      if (!patch) {
        patch = mount(render(estado), informacoesAdicionais);
      } else {
        patch(render(estado));
      }
    });
  }

  function onClick(evt: Event) {
    evt.preventDefault();
    fsm.dispatch({ type: 'CLIQUE' });
  }
}

function obterLink() {
  return obter<HTMLAnchorElement>('a#labelPrecatorios', 'Link não encontrado.');
}

function obterInformacoesAdicionais() {
  return obter('#fldInformacoesAdicionais', 'Tabela de informações adicionais não encontrada.');
}

function obter<T extends HTMLElement>(selector: string, msg: string) {
  const elt = document.querySelector<T>(selector);
  if (p.isNull(elt)) return Left(new Error(msg));
  else return Right(elt);
}

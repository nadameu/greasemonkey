import { GM_deleteValue, GM_setValue } from '$';
import { ZipWriter } from '@zip.js/zip.js';
import { isMensagem, Mensagem } from './Mensagem';
import { map2, ok } from './Result';
import { queryUnique } from './Result/functions';
import classes from './area_de_trabalho.module.css';
import { lift_throwable } from './try_catch';

type State =
  | { _tag: 'Init'; init(): void }
  | { _tag: 'Ocioso'; onminutasclicadas(): void; onbotaoclicado(): void }
  | {
      _tag: 'Aguarda_resposta';
      onmessage(_: { data: unknown }): void;
      ontimeout(): void;
    };

export function parseAreaDeTrabalho() {
  return ok(null).chain(() => {
    const imprimir = ok(document).chain(
      queryUnique<HTMLButtonElement>('button[id="btnImprimir"]')
    );

    const tabela = ok(document).chain(
      queryUnique<HTMLTableElement>('table[id="tabelaMinutas"]')
    );

    return map2(tabela, imprimir, (tabela, imprimir) => () => {
      const salvar = criar_botao();
      imprimir.after(' ', salvar);

      let state: State = (() => {
        const init: State = {
          _tag: 'Init',
          init() {
            habilitar_botao_se_minutas_selecionadas();
            state = ocioso;
          },
        };
        const ocioso: State = {
          _tag: 'Ocioso',
          onminutasclicadas: habilitar_botao_se_minutas_selecionadas,
          onbotaoclicado() {
            state = {
              _tag: 'Aguarda_resposta',
              onmessage: lift_throwable(async ({ data }) => {
                window.clearTimeout(timer);
                GM_deleteValue('salvar');
                if (isMensagem(data) && data.segredo === segredo) {
                  const url = await gerar_zip(data);
                  if (window.confirm('Fazer download?')) {
                    window.open(url);
                  }
                } else {
                  console.debug('Mensagem recebida:', data);
                }
                habilitar_botao_se_minutas_selecionadas();
                state = ocioso;
              }),
              ontimeout() {
                window.clearTimeout(timer);
                GM_deleteValue('salvar');
                habilitar_botao_se_minutas_selecionadas();
                state = ocioso;
              },
            };
            salvar.disabled = true;
            const segredo = Math.random().toString(36).slice(2);
            GM_setValue('salvar', segredo);
            const timer = window.setTimeout(() => {
              if (state._tag === 'Aguarda_resposta') {
                state.ontimeout();
              }
            }, 30_000);
            imprimir.click();
          },
        };
        tabela.addEventListener('click', () => {
          if (state._tag === 'Ocioso') state.onminutasclicadas();
        });
        salvar.addEventListener('click', () => {
          if (state._tag === 'Ocioso') state.onbotaoclicado();
        });
        window.addEventListener('message', evt => {
          if (state._tag === 'Aguarda_resposta') {
            state.onmessage(evt);
          }
        });
        return init;
      })();
      state.init();

      function habilitar_botao_se_minutas_selecionadas() {
        const selecionados = tabela.querySelectorAll<HTMLInputElement>(
          'input[type="checkbox"]:checked'
        );
        salvar.disabled = selecionados.length === 0;
      }
    });
  });
}

function criar_botao(): HTMLButtonElement {
  return Object.assign(document.createElement('button'), {
    className: 'infraButton ' + classes.button,
    type: 'button',
    textContent: 'Fazer download das minutas selecionadas',
    disabled: true,
  });
}

async function gerar_zip(mensagem: Mensagem) {
  const zipFileStream = new TransformStream();
  const zipFileBlobPromise = new Response(zipFileStream.readable).blob();
  const zipWriter = new ZipWriter(zipFileStream.writable);
  await Promise.all(
    mensagem.minutas.map(async minuta => {
      const nome = `${minuta.titulo}_${minuta.codigo}`;
      const nome_arquivo = `${nome}.html`;
      const codigo_html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${nome}</title>
${mensagem.estilos.join('\n')}
</head>
<body>
${minuta.html}    
</body>
</html>`;
      await zipWriter.add(nome_arquivo, new Blob([codigo_html]).stream());
    })
  );
  await zipWriter.close();
  const zipFileBlob = await zipFileBlobPromise;
  return URL.createObjectURL(new File([zipFileBlob], 'minutas.zip'));
}

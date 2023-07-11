import { enviarFormulario } from './enviarFormulario';
import { nomeacaoFromLinha } from './nomeacaoFromLinha';
import { getTabela } from './getTabela';
import { h } from '@nadameu/create-element';

export async function onEnviarClicado() {
  const form = document.querySelector<HTMLFormElement>('.gm-ajg__formulario')!;
  const url = form.action;
  const method = form.method;

  const tabela = await getTabela();
  const linhas = Array.from(tabela.rows).slice(1);
  const linhasProcessosSelecionados = linhas.filter(linha => {
    const checkbox = linha.querySelector<HTMLInputElement>('input[type="checkbox"]');
    return checkbox && checkbox.checked;
  });

  if (linhasProcessosSelecionados.length === 0) return;
  const cao = linhasProcessosSelecionados.length > 1 ? 'ções' : 'ção';
  const s = linhasProcessosSelecionados.length > 1 ? 's' : '';
  const pergunta = `Criar solicita${cao} de pagamento para ${linhasProcessosSelecionados.length} processo${s}?`;
  if (!confirm(pergunta)) return;

  const resultado = document.querySelector('.gm-ajg__resultado')!;
  resultado.innerHTML = `
<label>Solicitações a criar:</label><br>
<dl class="gm-ajg__lista"></dl>
		`;
  const lista = resultado.querySelector('.gm-ajg__lista')!;

  let duvida = false;
  try {
    await linhasProcessosSelecionados.reduce(async (promise, linha) => {
      const nomeacao = await nomeacaoFromLinha(linha);
      const data = new FormData(form);
      data.set('hdnInfraTipoPagina', '1');
      data.set('id_unica', nomeacao.idUnica);
      data.set('num_processo', nomeacao.numProcesso);
      data.set('numeroNomeacao', nomeacao.numeroNomeacao);

      const termo = h('dt', { className: 'gm-ajg__lista__processo' }, nomeacao.numProcesso);
      const definicao = h('dd', { className: 'gm-ajg__lista__resultado' }, 'Na fila');
      lista.appendChild(termo);
      lista.appendChild(definicao);
      const DEBUG = false;
      return promise
        .then(async () => {
          definicao.textContent = 'Criando...';
          const num = await (DEBUG
            ? new Promise<string>((resolve, reject) => {
                let timer: number;
                timer = window.setTimeout(() => {
                  window.clearTimeout(timer);
                  if (Math.random() < 0.1) {
                    reject(new Error('Erro ao criar solicitação!'));
                  } else {
                    resolve(String(Math.round(Math.random() * 1000)));
                  }
                }, 1000);
              })
            : enviarFormulario(url, method, data));
          if (num) {
            definicao.classList.add('gm-ajg__lista__resultado--ok');
            definicao.textContent = `Criada solicitação ${num}.`;
          } else {
            duvida = true;
            definicao.textContent = '???';
          }
        })
        .catch(async err => {
          definicao.classList.add('gm-ajg__lista__resultado--erro');
          definicao.textContent = 'Erro.';
          throw err;
        });
    }, Promise.resolve());

    lista.scrollIntoView();

    let mensagem: string;
    if (duvida) {
      mensagem = 'Não foi possível verificar se uma ou mais solicitações foram criadas.';
    } else {
      if (linhasProcessosSelecionados.length === 1) {
        mensagem = 'Solicitação criada com sucesso!';
      } else {
        mensagem = 'Solicitações criadas com sucesso!';
      }
      mensagem += '\nA página será recarregada para atualizar a lista de processos.';
    }
    window.alert(mensagem);
    if (!duvida) {
      window.location.reload();
    }
  } catch (err) {
    console.error(err);
    window.alert(err instanceof Error ? err.message : String(err));
  }
}

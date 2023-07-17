import { Either, Left, Right, validateAll } from '@nadameu/either';
import { expectUnreachable } from '@nadameu/expect-unreachable';
import { render } from 'preact';
import { createStore } from '../../../lib/create-store';
import { Estado } from './Estado';
import { Mensagem, isMensagem } from './Mensagem';
import './estilos.scss';
import { createCustomEventDispatcher, isCustomEvent, onCustomEvent } from './CustomEvent';
import { queryAll } from './queryAll';
import { queryOne } from './queryOne';

export function main(): Either<Error[], void> {
  return validateAll([obterInformacoesAdicionais(), obterURLConsulta()]).map(
    ([informacoesAdicionais, consulta]) => {
      const div = document.createElement('div');
      div.className = 'gm-cnis';
      informacoesAdicionais.insertAdjacentElement('afterbegin', div);

      const store = createStore<Estado, Mensagem>(
        () => Estado.Aguardando,
        (state, msg) =>
          Mensagem.match(msg, {
            CarregandoDados: () =>
              Estado.match(state, { Erro: () => state }, () => Estado.CarregandoDados),
            ErroDesconhecido: erro =>
              Estado.match(state, { Erro: () => state }, () => Estado.Erro(erro.erro)),
            MultiplosModais: () =>
              Estado.match(state, { Erro: () => state }, () =>
                Estado.Erro(
                  new Error(`Não foi possível identificar a(s) consulta(s) realizada(s).`)
                )
              ),
            SemConsulta: () => Estado.match(state, { Erro: () => state }, () => Estado.SemConsulta),
          })
      );

      onCustomEvent(document, isMensagem, store.dispatch, err => Mensagem.ErroDesconhecido(err));

      store.subscribe(estado => {
        render(<Botao consulta={consulta} estado={estado} />, div);
      });
    }
  );
}

function obterInformacoesAdicionais(): Either<Error, HTMLElement> {
  return queryOne('#conteudoInfAdicional');
}

function obterURLConsulta(): Either<Error, URL> {
  const linksValidos = queryAll<HTMLAnchorElement>('#fldAcoes a.infraButton[href^="javascript:"]')
    .map(x => x.href)
    .filter(x => /controlador\.php\?acao=pessoa_consulta_integrada\/listar&/.test(x))
    .map(x => x.match(/controlador\.php\?[^'"]+/)![0])
    .map(x => new URL(x, document.URL));
  if (linksValidos.length !== 1) return Left(new Error('Não encontrado link para consulta CNJ.'));
  return Right(linksValidos[0]!);
}

function Botao({ consulta, estado }: { consulta: URL; estado: Estado }) {
  if (estado.tag === 'Aguardando' || estado.tag === 'SemConsulta') {
    const botao = (
      <button type="button" onClick={createOnBotaoClicado(consulta)}>
        Analisar dados CNIS
      </button>
    );
    if (estado.tag === 'Aguardando') return botao;
    if (estado.tag === 'SemConsulta')
      return (
        <>
          Não foi realizada consulta ao CNJ.
          <br />
          Realize-a e tente novamente.
          <br />
          {botao}
        </>
      );
  }
  return Estado.match(estado, {
    CarregandoDados: () => <>Carregando dados, aguarde...</>,
    DadosCarregados: () => <>Dados carregados.</>,
    Erro: erro => <>Ocorreu um erro: {erro.motivo}</>,
  });
}

function createOnBotaoClicado(consulta: URL) {
  return function onBotaoClicado(evt: Event) {
    evt.preventDefault();
    document.dispatchEvent(new CustomEvent('gm/cnis', { detail: Mensagem.CarregandoDados }));
    const iframe = document.createElement('iframe');
    iframe.addEventListener('load', () => onIframeLoaded(iframe), { once: true });
    iframe.src = consulta.href;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  };
}

function onIframeLoaded(iframe: HTMLIFrameElement) {
  const doc = iframe.contentDocument!;
  const win = doc.defaultView!;
  const dispatch = createCustomEventDispatcher(document);
  const modais = queryAll('#tbl_pessoa_consulta_integrada-modal', doc);
  if (modais.length < 1) {
    return void dispatch(Mensagem.SemConsulta);
  } else if (modais.length > 1) {
    return void dispatch(Mensagem.MultiplosModais);
  }
  let tentativas = 30;
  let result: NodeListOf<HTMLElement>;
  const timer = win.setInterval(() => {
    if ((result = doc.querySelectorAll('[onclick^="executarAcao"].btnDownloadJson')).length > 0) {
      win.clearInterval(timer);
      console.log(result);
      const mySet = new Set<string>();
      try {
        for (const elt of result) {
          const onclick = elt.getAttribute('onclick')!;
          const match = onclick.match(/controlador\.php\?[^'"]+/);
          if (match) mySet.add(match[0]);
        }
      } catch (e) {
        console.error(e);
      }
      console.log([...mySet].map(url => new URL(url, doc.URL)));
      if (mySet.size === 1) {
        const [first] = mySet;
        fetch(first!)
          .then(x => x.json())
          .then(x => {
            if (!x || !('sucesso' in x) || !x.sucesso) throw new Error('erro', { cause: x });
            return x.data as any;
          })
          .then(x => console.log(JSON.parse(x)));
      }
    } else if (--tentativas <= 0) {
      dispatch(Mensagem.ErroDesconhecido(new Error('Número máximo de tentativas excedido.')));
      win.clearInterval(timer);
    }
  }, 100);
}

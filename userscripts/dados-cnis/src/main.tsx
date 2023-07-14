import { render } from 'preact';
import './estilos.scss';
import { queryAll } from './queryAll';
import { queryOne } from './queryOne';

export async function main(): Promise<void> {
  const informacoesAdicionais = await queryOne('#conteudoInfAdicional');
  const consulta = await queryAll<HTMLAnchorElement>('#fldAcoes a.infraButton[href^="javascript:"]')
    .map(x => x.href)
    .filter(x => /controlador\.php\?acao=pessoa_consulta_integrada\/listar&/.test(x))
    .map(x => x.match(/controlador\.php\?[^'"]+/)![0])
    .map(x => new URL(x, document.URL))
    .one();
  const div = document.createElement('div');
  div.className = 'gm-cnis';
  informacoesAdicionais.insertAdjacentElement('afterbegin', div);
  render(<Botao consulta={consulta} />, div);
}

function Botao({ consulta }: { consulta: URL }) {
  return (
    <button type="button" onClick={createOnBotaoClicado(consulta)}>
      Analisar dados CNIS
    </button>
  );
}

function createOnBotaoClicado(consulta: URL) {
  return function onBotaoClicado(evt: Event) {
    evt.preventDefault();
    const iframe = document.createElement('iframe');
    const texto = 'x';
    iframe.onload = function () {
      ((win, doc = win.document) => {
        let tentativas = 30;
        let result: NodeListOf<HTMLElement>;
        const timer = win.setInterval(() => {
          if (
            (result = doc.querySelectorAll('[onclick^="executarAcao"].btnDownloadJson')).length > 0
          ) {
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
            console.log('failed');
            win.clearInterval(timer);
          }
        }, 100);
      })((this as HTMLIFrameElement).contentDocument!.defaultView!);
      $.ajaxSetup({
        complete() {
          console.log('complete', this, arguments);
        },
        success() {
          console.log('success', this, arguments);
        },
        error() {
          console.log('error', this, arguments);
        },
      });
      console.log({ this: this, arguments });
      console.log(this.contentDocument.defaultView);
      this.contentDocument.title = texto;
    };
    iframe.src = consulta.href;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    console.log({ consulta });
    (async () => {
      // const response = await fetch(consulta);
      // const html = await response.text();
      // const doc = new DOMParser().parseFromString(html, 'text/html');
      // console.debug({ doc, cli: doc.querySelectorAll('[onclick^="executar"]') });
    })().catch(err => {
      console.error(err);
    });
  };
}

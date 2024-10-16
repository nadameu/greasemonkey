import { h } from '@nadameu/create-element';
import {
  arrayHasAtLeastLength,
  arrayHasLength,
  assert,
  isDefined,
  isNonEmptyString,
  isNotNull,
  isNotNullish,
} from '@nadameu/predicates';
import classes from './estilos.module.scss';
import { Info } from './Info';
import { XHR } from './XHR';

export function main(): Info | void {
  const areaAtual = document.querySelector('#areaatuacao')?.textContent;
  assert(isNonEmptyString(areaAtual), 'Área de atuação atual desconhecida.');
  const linkAlterar = document.querySelector('#alterarAreaAtuacao');
  assert(
    linkAlterar instanceof HTMLAnchorElement,
    'Elemento não encontrado: `#alterarAreaAtuacao`.'
  );
  const match = decodeURI(linkAlterar.href).match(
    /^javascript:openSubmitDialog\('(\/seeu\/usuario\/areaAtuacao\.do\?_tj=[0-9a-f]+)', 'Alterar Atua[^']+o', 0, 0\);/
  );
  assert(
    isNotNull(match) && arrayHasAtLeastLength(2)(match),
    'Link para alteração da área de atuação não reconhecido.'
  );
  const urlAlterar = match[1];

  const informacoesProcessuais = document.querySelector(
    '#informacoesProcessuais'
  );
  assert(
    isNotNull(informacoesProcessuais),
    `Informações processuais não encontradas.`
  );
  const linhaJuizo = Array.from(informacoesProcessuais.querySelectorAll('tr'))
    .filter(
      (
        x: HTMLTableRowElement
      ): x is HTMLTableRowElement & {
        cells: Record<'0' | '1', HTMLTableCellElement>;
      } => arrayHasLength(2)(x.cells)
    )
    .filter(x => (x.cells[0].textContent?.trim() ?? '') === 'Juízo:')
    .at(0);
  assert(isDefined(linhaJuizo), `Informações de juízo não encontradas.`);
  const juizo = linhaJuizo.cells[1].textContent?.trim();
  assert(isNonEmptyString(juizo), `Informações de juízo não encontradas.`);
  if (areaAtual === juizo)
    return new Info('Botão não adicionado - mesmo juízo');
  linhaJuizo.cells[1].append(' ', criarBotao(urlAlterar, juizo));

  const aba = document.querySelector('li[name="tabDadosProcesso"].currentTab');
  if (!aba) return;
  const labels = Array.from(
    document.querySelectorAll('#includeContent td.labelRadio > label')
  ).filter(x => x.textContent === 'Juízo:');
  assert(
    arrayHasLength(1)(labels),
    `Encontrado(s) ${labels.length} elemento(s) com texto "Juízo:".`
  );
  const label = labels[0];
  const td = label.closest('td')?.nextElementSibling;
  assert(
    isNotNullish(td),
    'Não foi possível encontrar um local para adicionar o botão.'
  );
  const juizoProcesso = td.textContent?.trim();
  assert(isNonEmptyString(juizoProcesso), 'Juízo do processo desconhecido.');
  if (areaAtual === juizoProcesso)
    return new Info('Botão não adicionado - mesmo juízo');

  // Todos os elementos presentes
  const button = criarBotao(urlAlterar, juizoProcesso);
  td.append(' ', button);
}

function criarBotao(urlAlterar: string, juizoProcesso: string) {
  const button = h('input', {
    className: classes.btn,
    type: 'button',
    value: 'Alternar para esta área de atuação',
  });
  button.addEventListener('click', evt => {
    evt.preventDefault();
    button.disabled = true;
    alternar(urlAlterar, juizoProcesso)
      .catch(err => {
        console.error(err);
        window.alert(
          [
            `Não foi possível alternar a área de atuação. Você possui acesso a \`${juizoProcesso}\`?`,
            '',
            'Em caso de erro, entre em contato com o desenvolvedor do script através do endereço abaixo:',
            '',
            'https://www.nadameu.com.br/',
          ].join('\n')
        );
      })
      .finally(() => {
        button.disabled = false;
      });
  });
  return button;
}

async function alternar(url: string, area: string) {
  const doc = await XHR(url);
  const links = Array.from(
    doc.querySelectorAll<HTMLAnchorElement>('a[href][target="mainFrame"]')
  ).filter(x => x.textContent?.trim() === area);
  assert(
    arrayHasLength(1)(links),
    `Encontrado(s) ${links.length} link(s) para a área selecionada.`
  );
  const link = links[0];
  document.body.appendChild(link);
  link.click();
}

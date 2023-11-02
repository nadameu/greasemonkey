import { h } from '@nadameu/create-element';
import {
  ABA_DIVERSA,
  BOTAO_ADICIONADO,
  MESMO_JUIZO,
  ResultType,
} from './ResultType';
import { XHR } from './XHR';
import { adicionarEstilos } from './adicionarEstilos';
import { assert } from './assert';

export function main(): ResultType {
  const aba = document.querySelector('li[name="tabDadosProcesso"].currentTab');
  if (!aba) return ABA_DIVERSA;
  const labels = Array.from(
    document.querySelectorAll('#includeContent td.labelRadio > label')
  ).filter(x => x.textContent === 'Juízo:');
  assert(
    labels.length === 1,
    `Encontrado(s) ${labels.length} elemento(s) com texto "Juízo:".`
  );
  const label = labels[0]!;
  const td = label.closest('td')?.nextElementSibling;
  assert(
    td != null,
    'Não foi possível encontrar um local para adicionar o botão.'
  );
  const juizoProcesso = td?.textContent?.trim() ?? '';
  assert(juizoProcesso !== '', 'Juízo do processo desconhecido.');
  const areaAtual = document.querySelector('#areaatuacao')?.textContent ?? '';
  assert(areaAtual !== '', 'Área de atuação atual desconhecida.');
  if (areaAtual === juizoProcesso) return MESMO_JUIZO;
  const linkAlterar = document.querySelector('#alterarAreaAtuacao');
  assert(
    linkAlterar instanceof HTMLAnchorElement,
    'Elemento não encontrado: `#alterarAreaAtuacao`.'
  );
  const match = linkAlterar.href.match(
    /^javascript:openSubmitDialog\('(\/seeu\/usuario\/areaAtuacao\.do\?_tj=[0-9a-f]+)', 'Alterar Atua[^']+o', 0, 0\);/
  );
  assert(
    match !== null && match.length >= 2,
    'Link para alteração da área de atuação não reconhecido.'
  );
  const urlAlterar = match[1]!;

  // Todos os elementos presentes
  adicionarEstilos();
  const button = h('input', {
    id: 'gm-seeu-switch-button',
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
  td.append(' ', button);
  return BOTAO_ADICIONADO;
}

async function alternar(url: string, area: string) {
  const doc = await XHR(url);
  const links = Array.from(
    doc.querySelectorAll<HTMLAnchorElement>('a[href][target="mainFrame"]')
  ).filter(x => x.textContent?.trim() === area);
  assert(
    links.length === 1,
    `Encontrado(s) ${links.length} link(s) para a área selecionada.`
  );
  const link = links[0]!;
  document.body.appendChild(link);
  link.click();
}

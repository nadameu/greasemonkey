import { expect, it } from 'vitest';
import { obterReferencias } from '../src/referentes';

it('Zero evento', () => {
  expect(obterReferencias('Qualquer coisaRefer.Mais coisas')).to.deep.equal([]);
});

it('Um evento', () => {
  testarExpressoes([42]);
});

it('Dois eventos', () => {
  testarExpressoes([27, 45]);
  testarExpressoes([45, 27], [27, 45]);
});

it('Três eventos', () => {
  testarExpressoes([4, 8, 19]);
  testarExpressoes([4, 19, 8], [4, 8, 19]);
  testarExpressoes([8, 4, 19], [4, 8, 19]);
  testarExpressoes([8, 19, 4], [4, 8, 19]);
  testarExpressoes([19, 4, 8], [4, 8, 19]);
  testarExpressoes([19, 8, 4], [4, 8, 19]);
});

it('Quatro eventos', () => {
  testarExpressoes([4, 8, 19, 26]);
  testarExpressoes([19, 8, 26, 4], [4, 8, 19, 26]);
});

it('Cinco eventos', () => {
  testarExpressoes([4, 8, 14, 19, 26]);
  testarExpressoes([19, 14, 8, 26, 4], [4, 8, 14, 19, 26]);
});

function testarExpressoes(numeroEventos: number[], numerosEmOrdem: number[] = numeroEventos) {
  for (const expressao of gerarExpressoes(numeroEventos)) {
    expect(obterReferencias(expressao)).to.deep.equal(
      numerosEmOrdem,
      `Erro analisando a expressão "${expressao}".`
    );
  }
}

function gerarExpressoes(numeroEventos: number[]) {
  if (numeroEventos.length < 1) throw new Error('Ao menos um número deve ser fornecido.');
  const numeros = numeroEventos.slice();
  const ultimo = numeros.pop()!.toString();
  const partes = numeros.length === 0 ? [] : [numeros.join(', ')];
  partes.push(ultimo);
  const textoEventos = partes.join(' e ');

  const expressoes: string[] = [];
  for (const parte0 of [' ', '  '])
    for (const parte1 of ['ao Evento', 'aos Eventos'])
      for (const parte2 of [':', ''])
        for (const parte3 of [' ', '  '])
          expressoes.push(
            `Qualquer coisaRefer.${parte0}${parte1}${parte2}${parte3}${textoEventos}Mais coisas`
          );
  return expressoes;
}

import { Either, Left, Right } from '@nadameu/either';
import * as RE from 'descriptive-regexp';
import { inserir } from './paginas/inserir';

export function main(): Either<Error, void> {
  const loc = window.location.href;
  return getAcao(loc).chain(acao => {
    switch (acao) {
      case 'insercao':
        return inserir();
      default:
        return Left(new Error(`Ação desconhecida: ${acao}.`));
    }
  });
}

function getAcao(url: string): Either<Error, string> {
  const match = url.match(
    RE.concat(
      'https://renajud.denatran.serpro.gov.br/renajud/restrito/restricoes-',
      RE.capture(/\w+/),
      '.jsf'
    )
  );
  if (!match) return Left(new Error(`URL desconhecida: <${url}>.`));
  return Right(match[1]!);
}

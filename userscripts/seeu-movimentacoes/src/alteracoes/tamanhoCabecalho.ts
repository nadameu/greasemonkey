import { GM_addStyle } from '$';
import { D, Either, M, Maybe, Right } from '@nadameu/adts';
import { pipe } from '@nadameu/pipe';
import css from './tamanhoCabecalho.scss?inline';

export const tamanhoCabecalho = (url: URL): Maybe<Either<string, void>> => {
  return pipe(
    pipe(
      url,
      M.maybeBool(u => u.pathname === '/seeu/'),
      M.map(alterarFrameset)
    ),
    M.orElse(() =>
      pipe(
        url,
        M.maybeBool(u => u.pathname === '/seeu/cabecalho.jsp'),
        M.map(alterarEstilosCabecalho)
      )
    )
  );
};

function alterarFrameset() {
  return pipe(
    document,
    D.query<HTMLFrameSetElement>('frameset'),
    M.map(f => {
      f.rows = '22,*';
    }),
    M.toEither(() => `Elemento <frameset> não encontrado.`)
  );
}

function alterarEstilosCabecalho(): Either<string, void> {
  GM_addStyle(css);
  return Right(undefined);
}

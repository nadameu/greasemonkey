import { Either, M, Maybe, Right } from '@nadameu/adts';
import { pipe } from '@nadameu/pipe';
import css from './barra-superior.scss?inline';
import { GM_addStyle } from '$';

export const barraSuperior = (url: URL): Maybe<Either<string, void>> =>
  pipe(
    url.pathname,
    M.maybeBool(x => x === '/seeu/usuario/areaAtuacao.do'),
    M.map(() => {
      GM_addStyle(css);
      return Right(undefined);
    })
  );

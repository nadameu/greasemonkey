import { Either, Right } from '@nadameu/either';
import { queryAll } from './queryAll';

export function paginaListar(): Either<Error, void> {
  console.log(
    queryAll<HTMLTableElement>('table#tbl_pessoa_consulta_integrada')
      .slice(0, 1)
      .map(x => x.rows.length)
  );
  return Right(undefined);
}

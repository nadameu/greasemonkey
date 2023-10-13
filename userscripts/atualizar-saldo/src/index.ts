import { E, Right, pipeValue as pipe } from 'adt-ts';
import { main } from './main';

pipe(
  main(),
  E.catchError(error => {
    console.group('<atualizar-saldo>');
    console.error(error);
    console.groupEnd();
    return Right(undefined as void);
  })
);

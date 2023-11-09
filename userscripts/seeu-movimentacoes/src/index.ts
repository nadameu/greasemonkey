import { E, M } from '@nadameu/adts';
import { pipe } from '@nadameu/pipe';
import { main } from './main';

pipe(
  main(),
  M.map(
    E.mapLeft(err => {
      console.log('<SEEU - Movimentações>', 'Erro encontrado:', err);
    })
  )
);

import { E } from '@nadameu/adts';
import { pipe } from '@nadameu/pipe';
import { main } from './main';

pipe(
  main(),
  E.mapLeft(err => {
    console.log('<SEEU - Movimentações>', 'Erro encontrado:', err);
  })
);

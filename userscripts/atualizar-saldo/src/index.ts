import { E, flow } from '@nadameu/adts';
import { main } from './main';

flow(
  main(),
  E.getOrElse(error => {
    console.group('<atualizar-saldo>');
    console.error(error);
    console.groupEnd();
  })
);

import { main } from './main';

main().ifErr(error => {
  console.group('<atualizar-saldo>');
  console.error(error);
  console.groupEnd();
});

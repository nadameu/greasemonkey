import { main } from './main';

main().catch(err => {
  console.group('<atualizar-saldo>');
  console.error(err);
  console.groupEnd();
});

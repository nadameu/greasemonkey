import { main } from './main';

main().mapLeft((err) => {
  console.group('<atualizar-saldo>');
  console.error(err);
  console.groupEnd();
});

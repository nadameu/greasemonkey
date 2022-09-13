import { main } from './main';

main().mapLeft(errors => {
  console.group('<atualizar-saldo>');
  for (const error of errors) {
    console.error(error);
  }
  console.groupEnd();
});

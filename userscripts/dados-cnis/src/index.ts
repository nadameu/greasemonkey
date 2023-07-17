import { main } from './main';

main().mapLeft(errors => {
  console.group('<dados-cnis>');
  for (const error of errors) {
    console.error(error);
  }
  console.groupEnd();
});

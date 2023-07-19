import { eitherToPromise } from './eitherToPromise';
import { main } from './main';

main()
  .then(eitherToPromise)
  .catch(error => {
    console.group('<dados-cnis>');
    console.error(error);
    console.groupEnd();
  });

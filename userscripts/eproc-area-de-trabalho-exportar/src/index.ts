import { main } from './main';
import { try_catch } from './try_catch';

try_catch(() =>
  main().mapErr(err => {
    throw err;
  })
);

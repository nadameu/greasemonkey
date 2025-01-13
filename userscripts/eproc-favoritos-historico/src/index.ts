import * as pkg from '../package.json';
import { main } from './main';

main().catch(err => {
  console.group(pkg.name);
  console.error(err);
  console.groupEnd();
});

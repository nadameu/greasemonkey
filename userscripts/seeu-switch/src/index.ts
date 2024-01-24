import * as pkg from '../package.json';
import { Info } from './Info';
import { main } from './main';

const HEADER = `<${pkg.gm_name}>`;
try {
  const resultado = main();
  if (resultado instanceof Info) {
    console.info(HEADER, resultado.message);
  }
} catch (err) {
  console.group(HEADER);
  console.error(err);
  console.groupEnd();
}

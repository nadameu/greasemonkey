import { GM_info } from '$';
import { Info } from './Info';
import { main } from './main';

const HEADER = `<${GM_info.script.name}>`;
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

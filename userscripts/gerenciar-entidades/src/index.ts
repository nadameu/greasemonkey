import { GM_info } from '$';
import { main } from './main';

main().catch(err => {
  console.group(GM_info.script.name);
  console.error(err);
  console.groupEnd();
});

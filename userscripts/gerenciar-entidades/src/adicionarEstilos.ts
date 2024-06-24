import { GM_addStyle, GM_info } from '$';

export function adicionarEstilos() {
  GM_addStyle(`
.bootstrap-styles .${GM_info.script.name}__div {
  position: relative;
  background: hsl(333deg 35% 70%);
  display: inline-block;
  padding: 1em 2ch;
  border-radius: 4px;
}
    `);
}

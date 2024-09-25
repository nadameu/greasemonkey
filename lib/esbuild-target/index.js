import browserslist from 'browserslist';

const list = browserslist();
const chrome = Math.min(
  ...list
    .map(x => x.match(/^chrome (\d+)$/))
    .filter(x => x !== null)
    .map(x => Number(x[1]))
);
const firefox = Math.min(
  ...list
    .map(x => x.match(/^firefox (\d+)$/))
    .filter(x => x !== null)
    .map(x => Number(x[1]))
);
export default [`chrome${chrome}`, `firefox${firefox}`];

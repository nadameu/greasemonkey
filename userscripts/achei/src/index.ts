import { main } from './main';

main({ doc: document, log: console.log.bind(console, '[achei]') }).catch(
  err => {
    if (err && err instanceof Error) {
      console.error(err);
    } else {
      console.error(String(err));
    }
  }
);

import { main } from './main';

try {
  main({ doc: document, log: console.log.bind(console, '[achei]') });
} catch (err) {
  console.error(err);
}

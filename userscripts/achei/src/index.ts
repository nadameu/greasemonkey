import { main } from './main';

try {
  main({ doc: document, log: console.log.bind(console, '[achei]') });
} catch (err) {
  console.group('[achei]');
  console.error(err);
  console.groupEnd();
}

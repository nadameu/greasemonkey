import { main } from './main';

try {
  main();
} catch (err) {
  console.group('<SEEU - Movimentações>');
  console.error(err);
  console.groupEnd();
}

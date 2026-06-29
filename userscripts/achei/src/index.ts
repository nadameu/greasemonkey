import { program } from './main';

try {
  program()
    .run({
      document,
      console: { log: console.log.bind(console, '[achei]') } as Console,
    })
    .mapErr(err => {
      console.group('[achei]');
      console.error(err);
      console.groupEnd();
    });
} catch (err) {
  console.group('[achei]');
  console.error(err);
  console.groupEnd();
}

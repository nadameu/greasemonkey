if (import.meta.env.DEV) {
  await import('preact/debug');
}
import { Right } from '@nadameu/either';
import { main } from './main';

main().catch(e => {
  if (e instanceof AggregateError) {
    console.error(e);
    console.debug('Erros:', e.errors);
  } else {
    console.error(e);
  }
  return Right(undefined);
});

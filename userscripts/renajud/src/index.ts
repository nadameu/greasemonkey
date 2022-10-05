import { Right } from '@nadameu/either';
import { main } from './main';

main().catch(err => {
  console.error(err);
  return Right(undefined);
});

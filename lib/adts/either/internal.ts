import { Kind } from '../typeclasses';
import { Either } from './definitions';

export interface EitherF extends Kind {
  in: Either<this['e'], this['a']>;
  out: Either<this['e'], this['b']>;
  indexed: false;
}

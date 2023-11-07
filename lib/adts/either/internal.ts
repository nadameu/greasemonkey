import { Kind } from '../typeclasses';
import { Either } from './definitions';

export interface EitherF extends Kind {
  type: Either<this['e'], this['a']>;
}

import { Kind } from '../typeclasses';
import { Nullish } from './definitions';

export interface NullishF extends Kind {
  type: Nullish<this['a']>;
}

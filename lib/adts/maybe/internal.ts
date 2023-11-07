import { Kind } from '../typeclasses';
import { Maybe } from './definitions';

export interface MaybeF extends Kind {
  type: Maybe<this['a']>;
}

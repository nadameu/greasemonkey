import { Kind } from '../typeclasses';
import { List } from './definitions';

export interface ListF extends Kind {
  type: List<this['a']>;
}

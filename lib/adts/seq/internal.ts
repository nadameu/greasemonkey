import { Kind } from '../typeclasses';
import { Seq } from './definitions';

export interface SeqF extends Kind {
  type: Seq<this['a']>;
}

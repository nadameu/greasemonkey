import { Kind } from '../../typeclasses';

export interface IteratorResultF extends Kind {
  in: IteratorResult<this['a'], this['e']>;
  out: IteratorResult<this['b'], this['e']>;
  indexed: false;
}

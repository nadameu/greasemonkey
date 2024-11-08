import { Kind } from '../typeclasses';

export interface ArrayF extends Kind {
  type: Array<this['a']>;
}

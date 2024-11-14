import { Applicative } from '../typeclasses';
import { ap, map, of } from './functions';
import { NullishF } from './internal';

export const applicativeNullish: Applicative<NullishF> = { ap, map, of } as any;

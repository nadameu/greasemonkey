import { E, Left, Right, isLeft } from '../either';
import { Applicative, Kind, Semigroup, SemigroupK, Type } from '../typeclasses';
import { Validation } from './definitions';

interface ValidationF<e> extends Kind {
  type: Validation<e, this['a']>;
}
interface ValidationKF<F extends Kind> extends Kind {
  type: Validation<Type<F, never, this['e']>, this['a']>;
}

export const makeApplicativeValidation: {
  <F extends Kind>(M: SemigroupK<F>): Applicative<ValidationKF<F>>;
  <e>(M: Semigroup<e>): Applicative<ValidationF<e>>;
} = <e>(M: Semigroup<e>): Applicative<ValidationF<e>> => ({
  map: E.map,
  of: E.of,
  ap: fa => ff =>
    isLeft(ff)
      ? isLeft(fa)
        ? Left(M.concat(ff.left, fa.left))
        : ff
      : isLeft(fa)
      ? fa
      : Right(ff.right(fa.right)),
});

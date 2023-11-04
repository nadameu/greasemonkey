import { Just, Maybe, Nothing } from '../maybe';
import { T } from '../typeclasses';
import { Either, Left, Right, isLeft, isRight } from './definitions';
import { EitherF } from './internal';

export const of: <a, e = never>(value: a) => Either<e, a> = Right;
export const flatMap =
  <a, b, e2>(f: (a: a) => Either<e2, b>) =>
  <e>(fa: Either<e, a>): Either<e | e2, b> =>
    isLeft(fa) ? fa : f(fa.right);
export const map = T.deriveMap<EitherF>({ of, flatMap });
export const ap = T.deriveAp<EitherF>({ of, flatMap });
export const liftN = T.deriveLiftN<EitherF>({ ap, map, of });
export const mapLeft = <e, e2>(
  f: (_: e) => e2
): (<a>(fa: Either<e, a>) => Either<e2, a>) =>
  orElse<e2, e, never>(x => Left(f(x)));
export const toMaybe = <e, a>(either: Either<e, a>): Maybe<a> =>
  isLeft(either) ? Nothing : Just(either.right);

export const eitherBool: {
  <a, b extends a>(pred: (a: a) => a is b): (a: a) => Either<a, b>;
  <a>(pred: (_: a) => boolean): (a: a) => Either<a, a>;
} =
  <a>(pred: (_: a) => boolean) =>
  (a: a): Either<a, a> =>
    pred(a) ? Right(a) : Left(a);

export const merge = <e, a>(fa: Either<e, a>): e | a =>
  isLeft(fa) ? fa.left : fa.right;

export const getOrElse =
  <e, b>(whenLeft: (left: e) => b) =>
  <a>(fa: Either<e, a>): a | b =>
    isLeft(fa) ? whenLeft(fa.left) : fa.right;

export const getOr = <b>(defaultValue: b) => getOrElse(() => defaultValue);

export const orElse =
  <e2, e, b>(f: (_: e) => Either<e2, b>) =>
  <a>(fa: Either<e, a>): Either<e2, a | b> =>
    isRight(fa) ? fa : f(fa.left);

export const or =
  <c, d>(alternative: Either<c, d>) =>
  <a, b>(fa: Either<a, b>): Either<a | c, b | d> =>
    isRight(fa) ? fa : alternative;

const yieldedEither: unique symbol = Symbol();
interface YieldedEither<a> {
  [yieldedEither]: a;
}
interface EitherYielder {
  <e = never, a = never>(
    fa: Either<e, a>
  ): Generator<YieldedEither<Left<e>>, a, YieldedEither<never>>;
}
function* eitherYielder(fa: any): any {
  yield fa;
  return fa?.right;
}
interface EitherGen<e, a, w> extends Generator<YieldedEither<Left<e>>, a, w> {}
export const gen: {
  <e, a, w>(
    f: (_: EitherYielder) => EitherGen<e, a, w>
  ): [YieldedEither<never>] extends [w] ? Either<e, a> : never;
} = (<e, a, w>(f: (_: EitherYielder) => EitherGen<e, a, w>): Either<e, a> => {
  const it: Iterator<any, any, any> = f(eitherYielder);
  let result = it.next();
  while (true) {
    if (result.done) return Right(result.value);
    if (isLeft(result.value)) return result.value as any;
    result = it.next(result.value);
  }
}) as any;

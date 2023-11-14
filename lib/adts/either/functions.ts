import { constant, identity } from '../function';
import { Just, Maybe, Nothing } from '../maybe';
import { derive } from '../typeclasses';
import { Either, Left, Right, isLeft, isRight } from './definitions';
import { EitherF } from './internal';

export const of: <a, e = never>(value: a) => Either<e, a> = Right;
export const match =
  <e, b, a, b2>(f: (_: e) => b, g: (_: a) => b2) =>
  (fa: Either<e, a>): b | b2 =>
    isLeft(fa) ? f(fa.left) : g(fa.right);
export const flatMapBoth: <e, e2, a, b>(
  f: (_: e) => Either<e2, b>,
  g: (_: a) => Either<e2, b>
) => (fa: Either<e, a>) => Either<e2, b> = match;
export const flatMap =
  <a, b, e2>(f: (a: a) => Either<e2, b>) =>
  <e>(fa: Either<e, a>) =>
    isRight(fa) ? f(fa.right) : fa;
export const mapBoth = <e, e2, a, b>(f: (_: e) => e2, g: (_: a) => b) =>
  flatMapBoth(
    (e: e) => Left(f(e)),
    (a: a) => Right(g(a))
  );
export const map = /* #__PURE__ */ derive.map<EitherF>({ of, flatMap });
export const ap = /* #__PURE__ */ derive.ap<EitherF>({ of, flatMap });
export const lift2 = /* #__PURE__ */ derive.lift2<EitherF>({ ap, map });
export const mapLeft =
  <e, e2>(f: (_: e) => e2) =>
  <a = never>(fa: Either<e, a>): Either<e2, a> =>
    isLeft(fa) ? Left(f(fa.left)) : fa;
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
  <e, b = never>(whenLeft: (left: e) => b) =>
  <a = never>(fa: Either<e, a>): a | b =>
    isLeft(fa) ? whenLeft(fa.left) : fa.right;

export const getOr = <a = never, b = a>(defaultValue: b) =>
  getOrElse(() => defaultValue);

export const orElse =
  <e, e2 = never, b = never>(f: (_: e) => Either<e2, b>) =>
  <a>(fa: Either<e, a>): Either<e2, a | b> =>
    isRight(fa) ? fa : f(fa.left);

export const or =
  <c = never, d = never>(alternative: Either<c, d>) =>
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
export const tryCatch = <e, a>(
  tryFn: () => a,
  catchFn: (err: unknown) => e
): Either<e, a> => {
  try {
    return Right(tryFn());
  } catch (err) {
    return Left(catchFn(err));
  }
};

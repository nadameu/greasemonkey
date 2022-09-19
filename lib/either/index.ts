export type Either<a, b> = Left<a, b> | Right<b, a>;

abstract class _Either<a, b> {
  catch<c>(f: (_: a) => Either<c, b>): Either<c, b>;
  catch<c>(this: Left<a> | Right<b>, f: (_: a) => Either<c, b>): Either<c, b> {
    return this.match({ Left: f, Right: () => this as Right<b> });
  }
  chain<c>(f: (_: b) => Either<a, c>): Either<a, c>;
  chain<c>(this: Left<a> | Right<b>, f: (_: b) => Either<a, c>): Either<a, c> {
    return this.match({ Left: () => this as Left<a>, Right: f });
  }
  mapLeft<c>(f: (_: a) => c): Either<c, b>;
  mapLeft<c>(this: Left<a> | Right<b>, f: (_: a) => c): Either<c, b> {
    return this.match({ Left: x => Left(f(x)), Right: () => this as Right<b> });
  }
  map<c>(f: (_: b) => c): Either<a, c>;
  map<c>(this: Left<a> | Right<b>, f: (_: b) => c): Either<a, c> {
    return this.match({ Left: () => this as Left<a>, Right: x => Right(f(x)) });
  }
  abstract match<c>(matchers: { Left: (leftValue: a) => c; Right: (rightValue: b) => c }): c;
}

export interface Left<a, b = never> extends _Either<a, b> {
  isLeft: true;
  isRight: false;
  leftValue: a;
}
class _Left<a, b = never> extends _Either<a, b> implements Left<a, b> {
  isLeft: true = true;
  isRight: false = false;
  constructor(public leftValue: a) {
    super();
  }
  match<c>({ Left }: { Left: (leftValue: a) => c }): c {
    return Left(this.leftValue);
  }
}
export function Left<a, b = never>(leftValue: a): Either<a, b> {
  return new _Left(leftValue);
}

export interface Right<b, a = never> extends _Either<a, b> {
  isLeft: false;
  isRight: true;
  rightValue: b;
}
class _Right<b, a = never> extends _Either<a, b> implements Right<b, a> {
  isLeft: false = false;
  isRight: true = true;
  constructor(public rightValue: b) {
    super();
  }
  match<c>({ Right }: { Right: (rightValue: b) => c }): c {
    return Right(this.rightValue);
  }
}
export function Right<b, a = never>(rightValue: b): Either<a, b> {
  return new _Right(rightValue);
}

export function sequence<a, b>(eithers: [Either<a, b>]): Either<a, [b]>;
export function sequence<a, b, c>(eithers: [Either<a, b>, Either<a, c>]): Either<a, [b, c]>;
export function sequence<a, b, c, d>(
  eithers: [Either<a, b>, Either<a, c>, Either<a, d>]
): Either<a, [b, c, d]>;
export function sequence<a, b>(eithers: Iterable<Either<a, b>>): Either<a, b[]>;
export function sequence<a, b>(eithers: Iterable<Either<a, b>>): Either<a, b[]> {
  return traverse(eithers, x => x);
}

export function traverse<a, b, c>(
  collection: Iterable<a>,
  transform: (_: a) => Either<b, c>
): Either<b, c[]> {
  const results: c[] = [];
  for (const value of collection) {
    const either = transform(value);
    if (either.isLeft) return either as Left<b>;
    results.push(either.rightValue);
  }
  return Right(results);
}

export function validateAll<a, b>(eithers: [Either<a, b>]): Either<a[], [b]>;
export function validateAll<a, b, c>(eithers: [Either<a, b>, Either<a, c>]): Either<a[], [b, c]>;
export function validateAll<a, b, c, d>(
  eithers: [Either<a, b>, Either<a, c>, Either<a, d>]
): Either<a[], [b, c, d]>;
export function validateAll<a, b>(eithers: Iterable<Either<a, b>>): Either<a[], b[]>;
export function validateAll<a, b>(eithers: Iterable<Either<a, b>>): Either<a[], b[]> {
  return validateMap(eithers, x => x);
}

export function validateMap<a, b, c>(
  collection: Iterable<a>,
  transform: (_: a) => Either<b, c>
): Either<b[], c[]> {
  const errors: b[] = [];
  const results: c[] = [];
  for (const value of collection) {
    const either = transform(value);
    if (either.isLeft) errors.push(either.leftValue);
    else results.push(either.rightValue);
  }
  if (errors.length > 0) return Left(errors);
  return Right(results);
}

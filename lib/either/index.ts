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
  abstract match<c>(matchers: {
    Left: (leftValue: a) => c;
    Right: (rightValue: b) => c;
  }): c;
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

type Sequenced<
  a,
  es extends Array<Either<a, unknown>>,
  bs extends unknown[] = [],
> = es extends []
  ? Either<a, bs>
  : es extends [
      Either<a, infer b>,
      ...infer rest extends Array<Either<a, unknown>>,
    ]
  ? Sequenced<a, rest, [...bs, b]>
  : es extends Array<Either<a, infer b>>
  ? Sequenced<a, [], [...bs, ...b[]]>
  : never;
export function sequence<a, es extends Array<Either<a, unknown>>>(
  eithers: [...es]
): Sequenced<a, es>;
export function sequence<a, b>(
  eithers: Iterable<Either<a, b>> | ArrayLike<Either<a, b>>
): Either<a, b[]>;
export function sequence<a, b>(
  eithers: Iterable<Either<a, b>> | ArrayLike<Either<a, b>>
): Either<a, b[]> {
  return traverse(eithers, x => x);
}

export function traverse<a, b, c>(
  collection: Iterable<a> | ArrayLike<a>,
  transform: (x: a, i: number) => Either<b, c>
): Either<b, c[]> {
  const results: c[] = [];
  for (const [index, value] of Array.from(collection).entries()) {
    const either = transform(value, index);
    if (either.isLeft) return either as Left<b, never>;
    results.push(either.rightValue);
  }
  return Right(results);
}

export function partition<a, es extends Array<Either<a, unknown>>>(
  eithers: [...es]
): Sequenced<a, es> extends Either<a, infer bs>
  ? { left: a[]; right: bs }
  : never;
export function partition<a, b>(
  eithers: Iterable<Either<a, b>> | ArrayLike<Either<a, b>>
): { left: a[]; right: b[] };
export function partition<a, b>(
  eithers: Iterable<Either<a, b>> | ArrayLike<Either<a, b>>
): { left: a[]; right: b[] } {
  return partitionMap(eithers, x => x);
}
export function partitionMap<a, b, c>(
  collection: Iterable<a> | ArrayLike<a>,
  transform: (value: a, index: number) => Either<b, c>
): { left: b[]; right: c[] } {
  const left = [] as b[];
  const right = [] as c[];
  for (const [index, value] of Array.from(collection).entries()) {
    const either = transform(value, index);
    if (either.isLeft) left.push(either.leftValue);
    else right.push(either.rightValue);
  }
  return { left, right };
}

export function validateAll<a, es extends Array<Either<a, unknown>>>(
  eithers: [...es]
): Sequenced<a, es> extends Either<a, infer bs> ? Either<a[], bs> : never;
export function validateAll<a, b>(
  eithers: Iterable<Either<a, b>> | ArrayLike<Either<a, b>>
): Either<a[], b[]>;
export function validateAll<a, b>(
  eithers: Iterable<Either<a, b>> | ArrayLike<Either<a, b>>
): Either<a[], b[]> {
  return validateMap(eithers, x => x);
}

export function validateMap<a, b, c>(
  collection: Iterable<a> | ArrayLike<a>,
  transform: (x: a, i: number) => Either<b, c>
): Either<b[], c[]> {
  const partitioned = partitionMap(collection, transform);
  if (partitioned.left.length > 0) return Left(partitioned.left);
  else return Right(partitioned.right);
}

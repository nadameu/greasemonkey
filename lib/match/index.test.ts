import { describe, expect, test } from 'vitest';
import { createTaggedUnion, matchBy, Static } from '.';

test('create', () => {
  const MaybeNumber = createTaggedUnion({
    Just: (x: number) => ({ value: x }),
    Nothing: null,
  });

  const just = MaybeNumber.Just(42);
  expect(just).toHaveProperty('tag', 'Just');
  expect(just).toHaveProperty('value', 42);

  const nothing = MaybeNumber.Nothing;
  expect(nothing).toHaveProperty('tag', 'Nothing');
});

test('match (method)', async () => {
  const MyType = createTaggedUnion({
    Pending: null,
    Resolved: (value: number) => ({ value }),
    Rejected: (reason: any) => ({ reason }),
  });
  type MyType = Static<typeof MyType>;
  const { Pending, Resolved, Rejected, match } = MyType;

  const matchers = {
    Resolved: ({ value }: { value: number }) => Promise.resolve(value),
    Rejected: ({ reason }: { reason: any }) => Promise.reject(reason),
  };
  const otherwise = () => Promise.reject(Pending);

  const resolvedPromise = match(Resolved(42) as MyType, matchers, otherwise);
  await expect(resolvedPromise).resolves.toEqual(42);

  const rejectedPromise = match(Rejected('error') as MyType, matchers, otherwise);
  await expect(rejectedPromise).rejects.toEqual('error');

  const pendingPromise = match(Pending as MyType, matchers, otherwise);
  await expect(pendingPromise).rejects.toStrictEqual(Pending);
});

test('match (standalone)', () => {
  const match = matchBy('tag');

  const t0 = { tag: 'Tag0' as 'Tag0' };
  const t1 = { tag: 'Tag1' as 'Tag1', data: 42 };
  const t2 = { tag: 'Tag2' as 'Tag2', data: { x: 'abc', y: 123 } };

  type T = typeof t0 | typeof t1 | typeof t2;

  const getResult = (t: T) =>
    match(
      t,
      {
        Tag1: ({ data: x }) => x,
        Tag2: ({ data: { y } }) => y,
      },
      u => u.tag.length
    );

  expect(getResult(t0)).toEqual(4);
  expect(getResult(t1)).toEqual(42);
  expect(getResult(t2)).toEqual(123);
});

describe('no discriminant', () => {
  test('tag', () => {
    const match = matchBy('tag');
    expect(() => match({} as { tag: 'A' }, { A: () => 3 })).toThrow(
      'Object does not have a valid "tag" property.'
    );
  });

  test('variant', () => {
    const match = matchBy('variant');
    expect(() => match({} as { variant: 'A' }, { A: () => 3 })).toThrow(
      'Object does not have a valid "variant" property.'
    );
  });
});

test('no matcher', () => {
  const match = matchBy('type');
  expect(() => match({ type: 'Abc' as 'Abc' }, {} as { Abc: () => number })).toThrow(
    'Not matched: "Abc".'
  );
});

describe('Unusual tagName and tag', () => {
  test('number as tagName', () => {
    const MyType = createTaggedUnion({ a: null, b: (value: string) => ({ value }) }, 0);
    const typeA = MyType.a;
    const typeB = MyType.b('abc');
    type MyType = Static<typeof MyType>;
    const resultA = MyType.match(typeA as MyType, { a: () => true }, () => false);
    expect(resultA).toBe(true);
    const resultB = MyType.match(typeB as MyType, { b: x => x.value === '3' }, () => true);
    expect(resultB).toBe(false);

    type OriginalType = [tag: 'v1', value: string] | [tag: 'v2', value: number];
    const match = matchBy(0);
    const variant1: OriginalType = ['v1', 'abc'];
    const variant2: OriginalType = ['v2', 123];
    const res1 = match(variant1 as OriginalType, { v1: x => x[1].length, v2: x => x[1] });
    expect(res1).toBe(3);
    const res2 = match(variant2 as OriginalType, { v1: x => x[1].length, v2: x => x[1] });
    expect(res2).toBe(123);
  });
  test('numbers as tags', () => {
    const T = createTaggedUnion({ 0: null, 1: (value: string) => ({ value }) }, 'discriminant');
    type T = Static<typeof T>;
    const t0 = T[0];
    const t1 = T[1]('hi');
    const tRes0 = T.match(t0 as T, [x => x.discriminant.toString(2), x => x.value] as const);
    expect(tRes0).toBe('0');
    const tRes1 = T.match(t1 as T, [x => x.discriminant.toString(2), x => x.value] as const);
    expect(tRes1).toBe('hi');

    type U = { tag: 0 } | { tag: 1; value: string };
    const u0: U = { tag: 0 };
    const u1: U = { tag: 1, value: 'hi' };
    const match = matchBy('tag');
    const uRes0 = match(u0 as U, [x => x.tag.toString(2), x => x.value] as const);
    expect(uRes0).toBe('0');
    const uRes1 = match(u1 as U, [x => x.tag.toString(2), x => x.value] as const);
    expect(uRes1).toBe('hi');
  });
  test('enums as tags', () => {
    enum Tags {
      FIRST,
      SECOND,
    }
    const MyType = createTaggedUnion(
      { [Tags.FIRST]: null, [Tags.SECOND]: (value: string) => ({ value }) },
      'discriminant'
    );
    type MyType = Static<typeof MyType>;
    const first = MyType[Tags.FIRST];
    const res1 = MyType.match(first as MyType, {
      [Tags.FIRST]: () => 8,
      [Tags.SECOND]: x => x.value.length,
    });
    expect(res1).toEqual(8);
    const second = MyType[Tags.SECOND]('xyz');
    const res2 = MyType.match(second as MyType, {
      [Tags.FIRST]: () => 8,
      [Tags.SECOND]: x => x.value.length,
    });
    expect(res2).toEqual(3);
  });
  test('const enums as tags', () => {
    const enum Tags {
      FIRST,
      SECOND,
    }
    const MyType = createTaggedUnion(
      { [Tags.FIRST]: null, [Tags.SECOND]: (value: string) => ({ value }) },
      'discriminant'
    );
    type MyType = Static<typeof MyType>;
    const first = MyType[Tags.FIRST];
    const res1 = MyType.match(first as MyType, {
      [Tags.FIRST]: () => 8,
      [Tags.SECOND]: x => x.value.length,
    });
    expect(res1).toEqual(8);
    const second = MyType[Tags.SECOND]('xyz');
    const res2 = MyType.match(second as MyType, {
      [Tags.FIRST]: () => 8,
      [Tags.SECOND]: x => x.value.length,
    });
    expect(res2).toEqual(3);
  });
  test('symbol as tagName', () => {
    const Sym = Symbol();
    const MyType = createTaggedUnion({ a: null, b: (value: string) => ({ value }) }, Sym);
    const typeA = MyType.a;
    const typeB = MyType.b('abc');
    type MyType = Static<typeof MyType>;
    const resultA = MyType.match(typeA as MyType, { a: () => true }, () => false);
    expect(resultA).toBe(true);
    const resultB = MyType.match(typeB as MyType, { b: x => x.value === '3' }, () => true);
    expect(resultB).toBe(false);
  });
  test('symbols as tags', () => {
    const a = Symbol();
    const b = Symbol();
    const MyType = createTaggedUnion(
      { [a]: null, [b]: (value: string) => ({ value }) },
      'myTagName'
    );
    const typeA = MyType[a];
    const typeB = MyType[b]('abc');
    type MyType = Static<typeof MyType>;
    const resultA = MyType.match(typeA as MyType, { [a]: () => true }, () => false);
    expect(resultA).toBe(true);
    const resultB = MyType.match(typeB as MyType, { [b]: x => x.value === '3' }, () => true);
    expect(resultB).toBe(false);
  });
});

test.skip('typescript (constructors)', () => {
  const MaybeString = createTaggedUnion({ Nothing: null, Just: (x: string) => ({ value: x }) });
  type MaybeString = Static<typeof MaybeString>;
  const just = MaybeString.Just('hi');
  const nothing = MaybeString.Nothing;
  const maybe = nothing as MaybeString;

  // @ts-expect-error
  MaybeString.match(maybe, {});
  // @ts-expect-error
  MaybeString.match(maybe, { Just: ({ value: x }) => x });
  // @ts-expect-error
  MaybeString.match(maybe, { Nothing: () => 'no value' });

  const x0 = MaybeString.match(just, { Just: ({ value: x }) => x.length });
  const y0: number = x0;
  const x1 = MaybeString.match(nothing, { Nothing: () => 1 });
  const y1: number = x1;
  const x2 = MaybeString.match(maybe, { Just: ({ value: x }) => x.length, Nothing: () => 4 });
  const y2: number = x2;

  const x3 = MaybeString.match(maybe, { Just: ({ value: x }) => x.length }, tagged =>
    MaybeString.match(tagged, {
      Nothing: () => 8,
    })
  );
  const y3: number = x3;
});

test.skip('typescript (manual creation)', () => {
  interface JustString {
    type: 'Just';
    value: string;
  }
  interface Nothing {
    type: 'Nothing';
  }
  type MaybeString = JustString | Nothing;
  const just = { type: 'Just', value: 'hi' } as JustString;
  const nothing = { type: 'Nothing' } as Nothing;
  const maybe = nothing as MaybeString;

  const match = matchBy('type');

  // @ts-expect-error
  match(maybe, {});
  // @ts-expect-error
  match(maybe, { Just: ({ value: x }) => x });
  // @ts-expect-error
  match(maybe, { Nothing: () => 'no value' });

  const x0 = match(just, { Just: ({ value: x }) => x.length });
  const y0: number = x0;
  const x1 = match(nothing, { Nothing: () => 1 });
  const y1: number = x1;
  const x2 = match(maybe, { Just: ({ value: x }) => x.length, Nothing: () => 4 });
  const y2: number = x2;

  const x3 = match(maybe, { Just: ({ value: x }) => x.length }, tagged =>
    match(tagged, {
      Nothing: () => 8,
    })
  );
  const y3: number = x3;
});

test('result must be object', () => {
  // @ts-expect-error
  const MyType = createTaggedUnion({ Str: (value: string) => value });
  // @ts-expect-error
  expect(() => MyType.Str('hello')).toThrow();
});

test('match not allowed', () => {
  // @ts-expect-error
  expect(() => createTaggedUnion({ match: null })).toThrow();
});

test('tag in result not allowed', () => {
  // @ts-expect-error
  const Err1 = createTaggedUnion({ Str: (x?: string) => ({ tag: x }) });
  // @ts-expect-error
  const err1 = Err1.Str('hey');
  expect(err1).not.toHaveProperty('tag', 'hey');
  expect(err1).toHaveProperty('tag', 'Str');

  // @ts-expect-error
  const Err2 = createTaggedUnion({ Str: (x?: string) => ({ variant: x }) }, 'variant');
  // @ts-expect-error
  const err2 = Err2.Str('hey');
  expect(err2).not.toHaveProperty('variant', 'hey');
  expect(err2).toHaveProperty('variant', 'Str');
});

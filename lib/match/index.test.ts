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

test.skip('TypeScript - correct usage', () => {
  const StringOrEmpty = createTaggedUnion({ Str: (value: string) => ({ value }), Empty: null });
});

test.skip('TypeScript - result must be object', () => {
  // @ts-expect-error
  const Err = createTaggedUnion({ Str: (value: string) => value });
});

test.skip('TypeScript - match not allowed', () => {
  // @ts-expect-error
  const Err = createTaggedUnion({ match: null });
});

test.skip('TypeScript - tag in result not allowed', () => {
  // @ts-expect-error
  const Err1 = createTaggedUnion({ Str: (x?: string) => ({ tag: x }) });
  // @ts-expect-error
  const Err2 = createTaggedUnion({ Str: (x?: string) => ({ variant: x }) }, 'variant');
});

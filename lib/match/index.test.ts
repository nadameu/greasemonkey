import { expect, test } from 'vitest';
import { createTaggedUnion, match, matchOr, Static } from '.';

test('create', () => {
  const MaybeNumber = createTaggedUnion({
    Just: (x: number) => ({ value: x }),
    Nothing: null,
  });

  const just = MaybeNumber.Just(42);
  expect(just).toHaveProperty('tag', 'Just');
  expect(just).toHaveProperty('data', 42);

  const nothing = MaybeNumber.Nothing;
  expect(nothing).toHaveProperty('tag', 'Nothing');
});

test('match (method)', async () => {
  const PromiseNumber = createTaggedUnion({
    Pending: null,
    Resolved: (value: number) => ({ value }),
    Rejected: (reason: any) => ({ reason }),
  });

  const matchers = {
    Resolved: (value: number) => Promise.resolve(value),
    Rejected: (reason: any) => Promise.reject(reason),
  };
  const otherwise = () => Promise.reject(PromiseNumber.Pending);

  const resolvedPromise = PromiseNumber.match(PromiseNumber.Resolved(42), matchers, otherwise);
  await expect(resolvedPromise).resolves.toEqual(42);

  const rejectedPromise = PromiseNumber.Rejected('error').matchOr(matchers, otherwise);
  await expect(rejectedPromise).rejects.toEqual('error');

  const pendingPromise = PromiseNumber.Pending.matchOr(matchers, otherwise);
  await expect(pendingPromise).rejects.toStrictEqual(PromiseNumber.Pending);
});

test('match (standalone)', () => {
  const t0 = { tag: 'Tag0' as 'Tag0' };
  const t1 = { tag: 'Tag1' as 'Tag1', data: 42 };
  const t2 = { tag: 'Tag2' as 'Tag2', data: { x: 'abc', y: 123 } };

  type T = typeof t0 | typeof t1 | typeof t2;

  const getResult = (t: T): number =>
    matchOr(
      t,
      {
        Tag1: x => x,
        Tag2: ({ y }) => y,
      },
      u => u.tag.length
    );

  expect(getResult(t0)).toEqual(4);
  expect(getResult(t1)).toEqual(42);
  expect(getResult(t2)).toEqual(123);
});

test('no tag', () => {
  expect(() => match({} as { tag: 'A' }, { A: () => 3 })).toThrow(
    'Object does not have a valid "tag" property.'
  );
});

test('no matcher', () => {
  expect(() => match({ tag: 'Abc' as 'Abc' }, {} as { Abc: () => number })).toThrow(
    'Not matched: "Abc".'
  );
});

test.skip('typescript (methods)', () => {
  const MaybeString = createTaggedUnion({ Nothing: null, Just: (x: string) => x });
  type MaybeString = Static<typeof MaybeString>;
  const just = MaybeString.Just('hi');
  const nothing = MaybeString.Nothing;
  const maybe = nothing as MaybeString;

  // @ts-expect-error
  maybe.match({});
  // @ts-expect-error
  maybe.match({ Just: x => x });
  // @ts-expect-error
  maybe.match({ Nothing: () => 'no value' });

  const x0 = just.match({ Just: x => x.length });
  const y0: number = x0;
  const x1 = nothing.match({ Nothing: () => 1 });
  const y1: number = x1;
  const x2 = maybe.match({ Just: x => x.length, Nothing: () => 4 });
  const y2: number = x2;

  const x3 = maybe.matchOr({ Just: x => x.length }, tagged =>
    tagged.match({
      Nothing: () => 8,
    })
  );
  const y3: number = x3;
});

test.skip('typescript (functions)', () => {
  interface JustString {
    tag: 'Just';
    data: string;
  }
  interface Nothing {
    tag: 'Nothing';
  }
  type MaybeString = JustString | Nothing;
  const just = { tag: 'Just', data: 'hi' } as JustString;
  const nothing = { tag: 'Nothing' } as Nothing;
  const maybe = nothing as MaybeString;

  // @ts-expect-error
  match(maybe, {});
  // @ts-expect-error
  match(maybe, { Just: x => x });
  // @ts-expect-error
  match(maybe, { Nothing: () => 'no value' });

  const x0 = match(just, { Just: x => x.length });
  const y0: number = x0;
  const x1 = match(nothing, { Nothing: () => 1 });
  const y1: number = x1;
  const x2 = match(maybe, { Just: x => x.length, Nothing: () => 4 });
  const y2: number = x2;

  const x3 = matchOr(maybe, { Just: x => x.length }, tagged =>
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

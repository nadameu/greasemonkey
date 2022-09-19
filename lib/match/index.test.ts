import { expect, test } from 'vitest';
import { createTaggedUnion, match, matchOr, Static } from '.';

test('create', () => {
  const MaybeNumber = createTaggedUnion({
    Just: (x: number) => x,
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
    Resolved: (value: number) => value,
    Rejected: (reason: any) => reason,
  });

  const matchers = {
    Resolved: (value: number) => Promise.resolve(value),
    Rejected: (reason: any) => Promise.reject(reason),
  };
  const otherwise = () => Promise.reject(PromiseNumber.Pending);

  const resolvedPromise = PromiseNumber.Resolved(42).matchOr(matchers, otherwise);
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

test.skip('typescript', () => {
  const MaybeString = createTaggedUnion({ Nothing: null, Just: (x: string) => x });
  type MaybeString = Static<typeof MaybeString>;
  const maybe = MaybeString.Nothing as MaybeString;

  // @ts-expect-error
  maybe.match({});

  // @ts-expect-error
  maybe.match({ Just: x => x });

  // @ts-expect-error
  maybe.match({ Nothing: () => 'no value' });

  maybe.match({ Just: x => x.length, Nothing: () => 4 });

  maybe.matchOr({}, tagged =>
    match(tagged, {
      Just: x => x,
      Nothing: () => 'no value',
    })
  );
});

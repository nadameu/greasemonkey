import { expect, test } from 'vitest';
import { MemberOf, TaggedUnion, taggedWith } from '.';

test('Maybe', () => {
  type Union<a> = TaggedUnion<{ Just: { value: a }; Nothing: {} }>;
  interface Just<a> extends MemberOf<Union<a>, 'Just'> {}
  interface Nothing extends MemberOf<Union<never>, 'Nothing'> {}
  const Just = <a>(value: a): Just<a> => taggedWith('Just')({ value });
  const Nothing: Nothing = taggedWith('Nothing')();
  type Maybe<a> = Just<a> | Nothing;

  expect<Maybe<number>>(Just(42)).toEqual({ '@nadameu/match/tag': 'Just', 'value': 42 });
  expect<Maybe<number>>(Nothing).toEqual({ '@nadameu/match/tag': 'Nothing' });
});

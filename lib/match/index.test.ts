import { describe, expect, test } from 'vitest';
import { MemberOf, Tagged, TaggedUnion, match, taggedWith } from '.';

test('Maybe', () => {
  type Internal<a> = TaggedUnion<{ Just: { value: a }; Nothing: {} }>;
  interface Just<a> extends MemberOf<Internal<a>, 'Just'> {}
  interface Nothing extends MemberOf<Internal<never>, 'Nothing'> {}
  const Just = <a>(value: a): Just<a> => taggedWith('Just')({ value });
  const Nothing: Nothing = taggedWith('Nothing')();
  type Maybe<a> = Just<a> | Nothing;

  expect<Maybe<number>>(Just(42)).toEqual({ '@nadameu/match/tag': 'Just', 'value': 42 });
  expect<Maybe<number>>(Nothing).toEqual({ '@nadameu/match/tag': 'Nothing' });
});

describe('FingerTree', () => {
  type Digit<a> = Tagged<'Digit', { values: [a] | [a, a] | [a, a, a] | [a, a, a, a] }>;
  const Digit = <a>(...values: [a] | [a, a] | [a, a, a] | [a, a, a, a]): Digit<a> =>
    taggedWith('Digit')({ values });
  type Node<a> = TaggedUnion<{ Node2: { values: [a, a] }; Node3: { values: [a, a, a] } }>;
  type Node2<a> = MemberOf<Node<a>, 'Node2'>;
  const Node2 = <a>(...values: [a, a]): Node<a> => taggedWith('Node2')({ values });
  type Node3<a> = MemberOf<Node<a>, 'Node3'>;
  const Node3 = <a>(...values: [a, a, a]): Node<a> => taggedWith('Node3')({ values });
  type FingerTree<a> = TaggedUnion<{
    Empty: {};
    Single: { value: a };
    Deep: { left: Digit<a>; middle: FingerTree<Node<a>>; right: Digit<a> };
  }>;
  type Empty = MemberOf<FingerTree<never>, 'Empty'>;
  const Empty: Empty = taggedWith('Empty')({});
  type Single<a> = MemberOf<FingerTree<a>, 'Single'>;
  const Single = <a>(value: a): Single<a> => taggedWith('Single')({ value });
  type Deep<a> = MemberOf<FingerTree<a>, 'Deep'>;
  const Deep = <a>(left: Digit<a>, middle: FingerTree<Node<a>>, right: Digit<a>): Deep<a> =>
    taggedWith('Deep')({ left, middle, right });

  test('match', () => {
    const ft: FingerTree<number> = Deep(
      Digit(0, 1),
      Deep(Digit(Node2(2, 3), Node3(4, 5, 6)), Empty, Digit(Node2(7, 8), Node3(9, 10, 11))),
      Digit(12, 13, 14, 15)
    );
    const reduceDigit = <a, b>(xs: Digit<a>, b: b, f: (b: b, a: a) => b): b =>
      xs.values.reduce((acc, x) => f(acc, x), b);
    const reduceNode = <a, b>(xs: Node<a>, b: b, f: (b: b, a: a) => b): b =>
      xs.values.reduce((acc, x) => f(acc, x), b);
    const reduceFT = <a, b>(xs: FingerTree<a>, b: b, f: (b: b, a: a) => b): b =>
      match(xs)
        .case('Empty', () => b)
        .case('Single', ({ value }) => f(b, value))
        .case('Deep', ({ left, middle, right }) =>
          reduceDigit(
            right,
            reduceFT(middle, reduceDigit(left, b, f), (acc, node) => reduceNode(node, acc, f)),
            f
          )
        )
        .get();

    expect(reduceFT(ft, [], (acc: number[], x) => (acc.push(x), acc))).toEqual(
      Array.from({ length: 16 }, (_, i) => i)
    );
  });
});

test('Match', () => {
  const matcher = (x: number) =>
    match(x)
      .when(
        x => x > 100,
        () => `x is greater than one hundred`
      )
      .when(
        x => x > 10,
        () => `x is: ${x}`
      )
      .otherwise(() => `x is too small`)
      .get();

  expect(matcher(937)).toEqual('x is greater than one hundred');
  expect(matcher(33)).toEqual('x is: 33');
  expect(matcher(3)).toEqual('x is too small');
});

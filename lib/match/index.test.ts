import { describe, expect, test } from 'vitest';
import {
  MemberWith,
  TaggedWith,
  TaggedUnion,
  MemberOf,
  isTagged,
  tag,
  Tagged,
  TaggedWithUnion,
  match,
  tagWith,
  isTaggedWith,
} from '.';

test('Maybe', () => {
  type Internal<a> = TaggedWithUnion<'__my_custom_tag', { Just: { value: a }; Nothing: {} }>;
  interface Just<a> extends MemberWith<Internal<a>, '__my_custom_tag', 'Just'> {}
  interface Nothing extends MemberWith<Internal<never>, '__my_custom_tag', 'Nothing'> {}
  const tag = tagWith('__my_custom_tag');
  const Just = <a>(value: a): Just<a> => tag('Just')({ value });
  const Nothing: Nothing = tag('Nothing')();
  type Maybe<a> = Just<a> | Nothing;

  expect<Maybe<number>>(Just(42)).toEqual({ __my_custom_tag: 'Just', value: 42 });
  expect<Maybe<number>>(Nothing).toEqual({ __my_custom_tag: 'Nothing' });
});

describe('FingerTree', () => {
  interface Digit<a> extends Tagged<'Digit', { values: [a] | [a, a] | [a, a, a] | [a, a, a, a] }> {}
  const Digit = <a>(...values: [a] | [a, a] | [a, a, a] | [a, a, a, a]): Digit<a> =>
    tag('Digit')({ values });
  type InternalNode<a> = TaggedUnion<{ Node2: { values: [a, a] }; Node3: { values: [a, a, a] } }>;
  interface Node2<a> extends MemberOf<InternalNode<a>, 'Node2'> {}
  const Node2 = <a>(...values: [a, a]): Node<a> => tag('Node2')({ values });
  interface Node3<a> extends MemberOf<InternalNode<a>, 'Node3'> {}
  const Node3 = <a>(...values: [a, a, a]): Node<a> => tag('Node3')({ values });
  type Node<a> = Node2<a> | Node3<a>;
  type InternalFingerTree<a> = TaggedUnion<{
    Empty: {};
    Single: { value: a };
    Deep: { left: Digit<a>; middle: FingerTree<Node<a>>; right: Digit<a> };
  }>;
  interface Empty extends MemberOf<InternalFingerTree<never>, 'Empty'> {}
  const Empty: Empty = tag('Empty')({});
  interface Single<a> extends MemberOf<InternalFingerTree<a>, 'Single'> {}
  const Single = <a>(value: a): Single<a> => tag('Single')({ value });
  interface Deep<a> extends MemberOf<InternalFingerTree<a>, 'Deep'> {}
  const Deep = <a>(left: Digit<a>, middle: FingerTree<Node<a>>, right: Digit<a>): Deep<a> =>
    tag('Deep')({ left, middle, right });
  type FingerTree<a> = Empty | Single<a> | Deep<a>;

  test('match', () => {
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

    const toArray = <a>(xs: FingerTree<a>): a[] =>
      reduceFT(xs, [], (xs: a[], x) => (xs.push(x), xs));

    const ft: FingerTree<number> = Deep(
      Digit(0, 1),
      Deep(Digit(Node2(2, 3), Node3(4, 5, 6)), Empty, Digit(Node2(7, 8), Node3(9, 10, 11))),
      Digit(12, 13, 14, 15)
    );
    expect(toArray(ft)).toEqual(Array.from({ length: 16 }, (_, i) => i));
    expect(toArray(Single(42))).toEqual([42]);
    expect(toArray(Empty)).toEqual([]);
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

test('Not exhaustive', () => {
  expect(() => match(42).unsafeGet()).toThrow();
  expect(() =>
    match(42)
      .when(
        n => n > 100,
        () => true
      )
      .unsafeGet()
  ).toThrow();
});

test('isTaggedWith', () => {
  expect(isTaggedWith('__tag__')('name')({ tag: 'name' } as any)).toBe(false);
  expect(isTaggedWith('tag')('name')(tagWith('tag')('name')())).toBe(true);
});

test('isTagged', () => {
  expect(isTagged('name')({ _tag: 'name' } as any)).toBe(false);
  expect(isTagged('name')(tag('name')())).toBe(true);
});

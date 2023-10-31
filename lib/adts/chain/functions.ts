import { Cons, List, Nil, isNil } from '../list/definitions';
import { Chain, Concat, Empty, NEChain, Single, isEmpty } from './definitions';
import * as W from './wrapped/functions';

const Si: typeof Symbol.iterator = Symbol.iterator;
export const empty = <a = never>(): Chain<a> => Empty;
export const of: <a>(value: a) => Chain<a> = Single;
export const concat: {
  <a>(left: NEChain<a>, right: Chain<a>): NEChain<a>;
  <a>(left: Chain<a>, right: NEChain<a>): NEChain<a>;
  <a>(left: Chain<a>, right: Chain<a>): Chain<a>;
} = <a>(left: Chain<a>, right: Chain<a>): any =>
  isEmpty(left) ? right : isEmpty(right) ? left : Concat(left, right);
export const foldLeft =
  <a, b>(seed: b, f: (b: b, a: a, i: number) => b) =>
  (fa: Chain<a>): b => {
    let acc = seed;
    let rights: List<NEChain<a>> = Nil;
    let left = fa;
    let i = 0;
    while (!isEmpty(left)) {
      switch (left._tag) {
        case 'Single': {
          acc = f(acc, left.value, i++);
          if (isNil(rights)) return acc;
          else {
            left = rights.head;
            rights = rights.tail;
            break;
          }
        }
        case 'Concat': {
          rights = Cons(left.right, rights);
          left = left.left;
          break;
        }
        case 'Wrap': {
          acc = W.foldLeft<a, b>(acc, (acc, x, _) => f(acc, x, i++))(left.values);
          if (isNil(rights)) return acc;
          else {
            left = rights.head;
            rights = rights.tail;
            break;
          }
        }
      }
    }
    return acc;
  };

export const flatMap = <a, b>(f: (a: a, i: number) => Chain<b>) =>
  foldLeft<a, Chain<b>>(Empty, (acc, x, i) => concat(acc, f(x, i)));

export const map = <a, b>(f: (a: a, i: number) => b) =>
  foldLeft<a, Chain<b>>(Empty, (acc, x, i) => concat(acc, Single(f(x, i))));

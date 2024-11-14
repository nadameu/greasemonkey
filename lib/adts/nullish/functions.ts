import { apply, identity } from '../function';
import { Nullish, nullish } from './definitions';

export const of: <a>(value: Nullish<a>) => a | nullish = identity;
export const map =
  <a, b>(f: (_: NonNullable<a>) => b) =>
  (value: Nullish<a>): b | nullish =>
    value == null ? value : f(value);

export const lift2 =
  <a, b, c>(f: (a: NonNullable<a>, b: NonNullable<b>) => c) =>
  (a: Nullish<a>, b: Nullish<b>): c | nullish =>
    a == null ? a : b == null ? b : f(a, b);

export const ap =
  <a>(fa: Nullish<a>) =>
  <b>(ff: Nullish<(_: NonNullable<a>) => b>): b | nullish =>
    lift2<(_: NonNullable<a>) => b, a, b>(apply)(ff, fa);

export const orElse =
  <b>(ifNullish: () => b) =>
  <a>(a: Nullish<a>): NonNullable<a> | b =>
    a == null ? ifNullish() : a;

export const orThrow = (message: string) =>
  orElse(() => {
    throw new Error(message);
  });

export const or = <b>(
  defaultValue: b
): (<a>(a: Nullish<a>) => NonNullable<a> | b) => orElse(() => defaultValue);

export const filter: {
  <a, b extends a>(pred: (a: a) => a is b): (fa: Nullish<a>) => b | nullish;
  <a>(pred: (_: a) => boolean): (fa: Nullish<a>) => a | nullish;
} =
  <a>(pred: (_: a) => boolean) =>
  (a: Nullish<a>) =>
    a == null ? a : pred(a) ? a : null;

export const mapProp =
  <T, K extends keyof T>(prop: K) =>
  (obj: Nullish<T>): T[K] | nullish =>
    obj?.[prop];

/**
 * @template {number} N Comprimento do array de resultado
 * @param {RegExp} re Expressão regular
 */
export const match =
  <N extends number = 1>(re: RegExp) =>
  (x: string) =>
    x.match(re) as CustomMatchArray<N> | null;

type CustomMatchArray<N extends number> = CustomMatchArrayHelper<N, []>;
type CustomMatchArrayHelper<
  N extends number,
  Acc extends string[] = [],
> = N extends Acc['length'] ? Acc : CustomMatchArrayHelper<N, [...Acc, string]>;

export const test = (re: RegExp) => filter((x: string) => re.test(x));

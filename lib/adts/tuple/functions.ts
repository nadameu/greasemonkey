import { I } from '../iterable';
import { Applicative, Kind, SequenceTuple, Type } from '../typeclasses';

export const sequence: <F extends Kind>(
  M: Applicative<F>
) => <T extends Type<F, unknown, unknown>[]>(
  tuple: [...T]
) => SequenceTuple<F, T> = I.sequence as any;

type Fanout<
  T,
  F extends Array<(_: T) => any>,
  R extends any[] = [],
> = F extends []
  ? R
  : F extends [(_: T) => infer U, ...infer G extends Array<(_: T) => any>]
    ? Fanout<T, G, [...R, U]>
    : never;
export const fanout: <T, F extends Array<(_: T) => any>>(
  ...fns: F & Array<(_: T) => any>
) => (value: T) => Fanout<T, F> =
  (...fns: Function[]) =>
  (value: unknown): any =>
    fns.map(f => f(value));

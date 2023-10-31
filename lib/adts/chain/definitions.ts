import { Wrapped } from './wrapped/definitions';

export type Chain<a> = Empty | NEChain<a>;
export type NEChain<a> = Single<a> | Wrap<a> | Concat<a>;
export interface Empty {
  _type: 'Chain';
  _tag: 'Empty';
}
export const Empty: Empty = { _type: 'Chain', _tag: 'Empty' };
export const isEmpty = <a>(chain: Chain<a>): chain is Empty => chain._tag === 'Empty';
export interface Single<a> {
  _type: 'Chain';
  _tag: 'Single';
  value: a;
}
export const Single = <a>(value: a): Single<a> => ({ _type: 'Chain', _tag: 'Single', value });
export const isSingle = <a>(chain: Chain<a>): chain is Single<a> => chain._tag === 'Single';
export interface Wrap<a> {
  _type: 'Chain';
  _tag: 'Wrap';
  values: Wrapped<a>;
}
export const Wrap = <a>(values: Wrapped<a>): Wrap<a> => ({ _type: 'Chain', _tag: 'Wrap', values });
export const isWrap = <a>(chain: Chain<a>): chain is Wrap<a> => chain._tag === 'Wrap';
export interface Concat<a> {
  _type: 'Chain';
  _tag: 'Concat';
  left: NEChain<a>;
  right: NEChain<a>;
}
export const Concat = <a>(left: NEChain<a>, right: NEChain<a>): Concat<a> => ({
  _type: 'Chain',
  _tag: 'Concat',
  left,
  right,
});
export const isConcat = <a>(chain: Chain<a>): chain is Concat<a> => chain._tag === 'Concat';

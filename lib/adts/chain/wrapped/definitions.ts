export type Wrapped<a> = WIter<a> | WArr<a>;
export interface WIter<a> {
  _type: 'Wrapped';
  _tag: 'WIter';
  values: Iterable<a>;
}
export const WIter = <a>(values: Iterable<a>): WIter<a> => ({
  _type: 'Wrapped',
  _tag: 'WIter',
  values,
});
export const isWIter = <a>(wrapped: Wrapped<a>): wrapped is WIter<a> => wrapped._tag === 'WIter';
export interface WArr<a> {
  _type: 'Wrapped';
  _tag: 'WArr';
  values: ArrayLike<a>;
}
export const WArr = <a>(values: ArrayLike<a>): WArr<a> => ({
  _type: 'Wrapped',
  _tag: 'WArr',
  values,
});
export const isWArr = <a>(wrapped: Wrapped<a>): wrapped is WArr<a> => wrapped._tag === 'WArr';

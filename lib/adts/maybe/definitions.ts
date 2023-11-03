export type Maybe<a> = Just<a> | Nothing;
export interface Just<a> {
  _type: 'Maybe';
  _tag: 'Just';
  value: a;
}
export const Just = <a>(value: a): Just<a> => ({
  _type: 'Maybe',
  _tag: 'Just',
  value,
});
export const isJust = <a>(maybe: Maybe<a>): maybe is Just<a> =>
  maybe._tag === 'Just';
export interface Nothing {
  _type: 'Maybe';
  _tag: 'Nothing';
}
export const Nothing: Nothing = { _type: 'Maybe', _tag: 'Nothing' };
export const isNothing = <a>(maybe: Maybe<a>): maybe is Nothing =>
  maybe._tag === 'Nothing';

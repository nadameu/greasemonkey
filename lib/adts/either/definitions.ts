export type Either<a, b> = Left<a> | Right<b>;
export interface Left<a> {
  _type: 'Either';
  _tag: 'Left';
  left: a;
}
export const Left = <a>(left: a): Left<a> => ({
  _type: 'Either',
  _tag: 'Left',
  left,
});
export const isLeft = <a, b>(either: Either<a, b>): either is Left<a> =>
  either._tag === 'Left';
export interface Right<b> {
  _type: 'Either';
  _tag: 'Right';
  right: b;
}
export const Right = <b>(right: b): Right<b> => ({
  _type: 'Either',
  _tag: 'Right',
  right,
});
export const isRight = <a, b>(either: Either<a, b>): either is Right<b> =>
  either._tag === 'Right';

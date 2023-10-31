export interface Monoid<a> {
  empty(): a;
  concat(left: a, right: a): a;
}

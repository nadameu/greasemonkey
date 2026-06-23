import {
  err,
  just,
  Maybe,
  nothing,
  ok,
  reader,
  Reader,
  Result,
} from './01_implementations';
import { ConsoleContext, DocumentContext } from './03_contexts';

export const maybeBool =
  <a>(pred: (_: a) => boolean) =>
  (a: a): Maybe<a> =>
    pred(a) ? just(a) : nothing();

export const eitherBool =
  <a, b extends a>(pred: (x: a) => x is b) =>
  (x: a): Result<b, Exclude<a, b>> =>
    pred(x) ? ok(x) : err(x as Exclude<a, b>);

export const asks = <a, b>(f: (_: a) => b): Reader<a, b> => reader(f);

export const askContext = <T extends {}>(key: keyof T) =>
  asks((env: T) => env[key]);

export const askDocument =
  /* #__PURE__ */ askContext<DocumentContext>('document');

export const askConsole = /* #__PURE__ */ askContext<ConsoleContext>('console');

export const iterate =
  <s, a>(f: (_: s) => [a, s] | null) =>
  (s: s): a[] => {
    const values: a[] = [];
    let value: a;
    let result = f(s);
    while (result) {
      [value, s] = result;
      values.push(value);
      result = f(s);
    }
    return values;
  };

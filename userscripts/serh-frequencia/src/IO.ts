export class IO<T> {
  constructor(public run: () => T) {}
  flatMap<U>(f: (_: T) => IO<U>): IO<U> {
    return new IO(() => f(this.run()).run());
  }
  map<U>(f: (_: T) => U): IO<U> {
    return new IO(() => f(this.run()));
  }
  static of<T>(value: T): IO<T> {
    return new IO(() => value);
  }
  static sequence<T extends IO<any>[]>(...values: T) {
    return new IO(() => values.map(x => x.run()) as GetIOsTypes<T>);
  }
}

type GetIOsTypes<T extends IO<any>[], Acc extends any[] = []> = T extends []
  ? Acc
  : T extends [IO<infer U>, ...infer Rest extends IO<any>[]]
    ? GetIOsTypes<Rest, [...Acc, U]>
    : T extends IO<infer U>[]
      ? [...Acc, ...U[]]
      : never;

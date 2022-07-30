export function validate<T, U>(promises: [Promise<T>, Promise<U>]): Promise<[T, U]>;
export function validate(promises: Promise<unknown>[]): Promise<unknown[]> {
  return Promise.allSettled(promises).then(results => {
    const errors = results.filter((x): x is PromiseRejectedResult => x.status === 'rejected');
    if (errors.length > 0) return Promise.reject(new AggregateError(errors));
    const values = results as PromiseFulfilledResult<unknown>[];
    return Promise.resolve(values.map(x => x.value));
  });
}

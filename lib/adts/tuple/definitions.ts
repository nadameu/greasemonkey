export const tuple = <T extends unknown[]>(...values: T): T => values;
export const fst = <a, b>(tuple: [a, b]): a => tuple[0];
export const snd = <a, b>(tuple: [a, b]): b => tuple[1];

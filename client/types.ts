type Tail<T extends any[]> = ((...t: T) => void) extends (
  _: any,
  ...tail: infer TT
) => void
  ? TT
  : [];

type PromisifyFunction<T extends (...args: any) => any> = (
  ...args: Tail<Parameters<T>>
) => Promise<ReturnType<T>>;

export type Promisify<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any
  ? PromisifyFunction<T[K]>
  : T[K] extends object
  ? Promisify<T[K]>
  : T[K];
};

type PromisifyFunction<T extends (...args: any) => any> = (
  ...args: Parameters<T>
) => void;

export type Promisify<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any
  ? PromisifyFunction<T[K]>
  : T[K] extends object
  ? Promisify<T[K]>
  : T[K];
};

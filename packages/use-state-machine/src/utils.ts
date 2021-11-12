import { Evt, EvtConfig } from './types';

export const normalizeEvt = <E extends string>(evt: E | Evt<E>) =>
  typeof evt === 'string' ? { type: evt } : evt;

export const normalizeEvtConfig = <S extends string, _E extends string, C>(
  config: S | EvtConfig<S, _E, C>,
) => (typeof config === 'string' ? { target: config } : config);

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
type Keys<T> = T extends Record<infer K, any> ? K : never;

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export const keys = <T>(obj: T): Keys<T>[] => Object.keys(obj) as any;

// eslint-disable-next-line  @typescript-eslint/no-empty-function
export const noop = () => {};

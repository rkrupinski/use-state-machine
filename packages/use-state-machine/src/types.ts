export type F0<R = void> = () => R;
export type F1<A1, R = void> = (a1: A1) => R;

export const $$INITIAL = '$$initial';

export type Initial = typeof $$INITIAL;

export type Evt<E extends string> = {
  type: E;
  payload?: unknown;
};

export type ContextUpdater<C> = F1<F1<C, C>>;

export type Effect<E extends string, C> = F1<
  {
    setContext: ContextUpdater<C>;
    context: C;
    event: Evt<Initial | E>;
    send: Sender<E>;
  },
  F0 | void
>;

export type Guard<_E extends string, C> = F1<
  {
    event: Evt<_E>;
    context: C;
  },
  boolean
>;

export type Sender<E extends string> = F1<E | Evt<E>>;

export type EvtConfig<S extends string, _E extends string, C> = {
  target: S;
  guard?: Guard<_E, C>;
};

export type Events<S extends string, E extends string, C> = {
  [_E in E]?: S | EvtConfig<S, _E, C>;
};

export type StateConfig<S extends string, E extends string, C> = {
  on?: Events<S, E, C>;
  effect?: Effect<E, C>;
};

export type States<S extends string, E extends string, C> = {
  [_S in S]: StateConfig<S, E, C>;
};

export type MachineOptions<S extends string, E extends string, C> = {
  initial: S;
  states: States<S, E, C>;
  context?: C;
};

export type State<S extends string, E extends string, C> = {
  value: S;
  nextEvents: E[];
  event: Evt<Initial | E>;
  context: C;
};

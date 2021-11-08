import * as React from 'react';

import {
  $$INITIAL,
  ContextUpdater,
  MachineOptions,
  State,
  Sender,
} from './types';
import { keys, normalizeEvt, normalizeEvtConfig } from './utils';

export const useStateMachine = <S extends string, E extends string, C>(
  options: MachineOptions<S, E, C>,
) => {
  const [effect, forceEffect] = React.useReducer((c: number) => c + 1, 0);

  const stateValueRef = React.useRef<S>(options.initial);

  const [state, setState] = React.useState<State<S, E, C>>({
    value: stateValueRef.current,
    nextEvents: keys(options.states[options.initial].on ?? {}),
    event: { type: $$INITIAL },
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    context: options.context as any,
  });

  const setContext = React.useCallback<ContextUpdater<C>>(
    updater => {
      setState(s => ({
        ...s,
        context: updater(s.context),
      }));
    },
    [setState],
  );

  const send = React.useCallback<Sender<E>>(
    evt => {
      const events = options.states[stateValueRef.current].on;

      if (!events) return;

      const normalizedEvent = normalizeEvt(evt);

      const eventConfig = events[normalizedEvent.type];

      if (!eventConfig) return;

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const normalizedEventConfig = normalizeEvtConfig(eventConfig!);

      const canTransition =
        normalizedEventConfig.guard?.({
          event: normalizedEvent,
          context: state.context,
        }) ?? true;

      if (!canTransition) return;

      stateValueRef.current = normalizedEventConfig.target;

      setState(s => ({
        ...s,
        value: stateValueRef.current,
        nextEvents: keys(options.states[stateValueRef.current].on ?? {}),
        event: normalizedEvent,
      }));

      forceEffect();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state],
  );

  React.useEffect(() => {
    const _state = options.states[state.value];

    const cleanup = _state.effect?.({
      context: state.context,
      event: state.event,
      setContext,
      send,
    });

    return typeof cleanup === 'function' ? cleanup : () => undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect]);

  return [state, send] as const;
};

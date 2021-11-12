import * as React from 'react';

import {
  $$INITIAL,
  ContextUpdater,
  MachineOptions,
  State,
  Sender,
} from './types';
import { keys, noop, normalizeEvt, normalizeEvtConfig } from './utils';

export const useStateMachine = <S extends string, E extends string, C>(
  options: MachineOptions<S, E, C>,
) => {
  const [render, forceRender] = React.useReducer((c: number) => c + 1, 0);

  const stateRef = React.useRef<State<S, E, C>>({
    value: options.initial,
    nextEvents: keys(options.states[options.initial].on ?? {}),
    event: { type: $$INITIAL },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: options.context as any,
  });

  const [state, setState] = React.useState(stateRef.current);

  const setContext = React.useCallback<ContextUpdater<C>>(updater => {
    stateRef.current = {
      ...stateRef.current,
      context: updater(stateRef.current.context),
    };

    setState(stateRef.current);
  }, []);

  const send = React.useCallback<Sender<E>>(evt => {
    const events = options.states[stateRef.current.value].on;

    if (!events) return;

    const normalizedEvent = normalizeEvt(evt);

    const eventConfig = events[normalizedEvent.type];

    if (!eventConfig) return;

    const { target: nextStateValue, guard } = normalizeEvtConfig(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      eventConfig!,
    );

    const canTransition =
      guard?.({
        event: normalizedEvent,
        context: stateRef.current.context,
      }) ?? true;

    if (!canTransition) return;

    stateRef.current = {
      ...stateRef.current,
      value: nextStateValue,
      nextEvents: keys(options.states[nextStateValue].on ?? {}),
      event: normalizedEvent,
    };

    setState(stateRef.current);

    forceRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const { effect } = options.states[stateRef.current.value];

    const cleanup = effect?.({
      context: stateRef.current.context,
      event: stateRef.current.event,
      setContext,
      send,
    });

    return typeof cleanup === 'function' ? cleanup : noop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [render, setContext, send]);

  return [state, send] as const;
};

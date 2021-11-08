import * as React from 'react';
import * as t from 'io-ts';
import { pipe } from 'fp-ts/function';
import { fold } from 'fp-ts/Either';
import { useStateMachine } from '@rkrupinski/use-state-machine';

const payload = t.number;

type ControlProps = { step: number };

const Control: React.FC<ControlProps> = ({ step }) => {
  const [state, send] = useStateMachine({
    initial: 'active',
    states: {
      active: {
        on: {
          inc: 'active',
        },
        effect({ event, setContext }) {
          if (event.type !== 'inc') return;

          const incBy = pipe(
            payload.decode(event.payload),
            fold(
              () => 0,
              p => p,
            ),
          );

          setContext(c => c + incBy);
        },
      },
    },
    context: 0,
  });

  return (
    <>
      <pre>Context: {state.context}</pre>
      <button onClick={() => send({ type: 'inc', payload: step })}>Inc</button>
    </>
  );
};

export const Payload: React.FC = () => <Control step={10} />;

import * as React from 'react';
import classNames from 'classnames';
import { useStateMachine } from '@rkrupinski/use-state-machine';

type ToggleProps = {
  onActivate: (times: number) => void;
  limit?: number;
  active?: boolean;
};

const Toggle: React.FC<ToggleProps> = ({
  onActivate,
  active,
  limit = Infinity,
}) => {
  const [state, send] = useStateMachine({
    initial: active ? 'active' : 'inactive',
    states: {
      active: {
        on: {
          toggle: 'inactive',
        },
        effect({ setContext }) {
          setContext(c => c + 1);
        },
      },
      inactive: {
        on: {
          toggle: {
            target: 'active',
            guard({ context }) {
              return context < limit;
            },
          },
        },
      },
    },
    context: 0,
  });

  const cn = classNames('toggle', {
    'toggle--active': state.value === 'active',
  });

  React.useEffect(() => {
    state.context && onActivate(state.context);
  }, [state.context]);

  return <div className={cn} onClick={() => send('toggle')} />;
};

const LIMIT = 3;

export const Basic: React.FC = () => {
  const [activations, setActivations] = React.useState(0);

  return (
    <>
      <Toggle limit={LIMIT} onActivate={setActivations} />
      <p>
        Times activated: {activations}.{' '}
        {activations >= LIMIT ? 'Limit reached.' : ''}
      </p>
    </>
  );
};

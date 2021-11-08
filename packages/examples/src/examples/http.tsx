import * as React from 'react';
import { useStateMachine } from '@rkrupinski/use-state-machine';

const RETRY_LIMIT = 3;

export const Http: React.FC = () => {
  const [state, send] = useStateMachine({
    initial: 'idle',
    states: {
      idle: {
        on: {
          fetch: 'loading',
        },
      },
      loading: {
        on: {
          success: 'done',
          error: 'failed',
        },
        effect({ send, setContext }) {
          (async () => {
            const res = await fetch(
              `https://swapi.dev/api/people/${
                Math.random() > 0.5 ? 1 : '__nope__'
              }`,
            );

            if (res.ok) {
              const data = JSON.stringify(await res.json(), null, 2);
              setContext(c => ({ ...c, data }));
              send('success');
            } else {
              send('error');
            }
          })();
        },
      },
      done: {},
      failed: {
        on: {
          retry: 'loading',
        },
        effect({ send, context, setContext }) {
          if (context.retry < RETRY_LIMIT) {
            setContext(c => ({ ...c, retry: c.retry + 1 }));
            send('retry');
          }
        },
      },
    },
    context: {
      retry: 0,
      data: '',
    },
  });

  return (
    <>
      <button onClick={() => send('fetch')} disabled={state.value !== 'idle'}>
        Fetch
      </button>{' '}
      {state.value === 'loading' && <span>Loading&hellip;</span>}
      {state.value === 'failed' && <span>Failed</span>}
      {state.value === 'done' && (
        <>
          <span>Done</span>
          <pre>{state.context.data}</pre>
        </>
      )}
    </>
  );
};

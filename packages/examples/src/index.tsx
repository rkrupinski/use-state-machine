import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { Basic } from './examples/basic';
import { Payload } from './examples/payload';
import { Http } from './examples/http';

const example = ['basic', 'payload', 'http'] as const;

type Example = typeof example[number];

function assertIsExample(val: any): asserts val is Example {
  if (!example.includes(val)) throw new Error('Nope');
}

const Examples: React.FC = () => {
  const [mode, setMode] = React.useState<Example>('basic');

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      assertIsExample(e.target.value);
      setMode(e.target.value);
    },
    [setMode],
  );

  return (
    <>
      <header>
        <h1>@rkrupinski/use-state-machine</h1>
        {example.map(e => (
          <label key={e} style={{ marginRight: 10 }}>
            <input
              type="radio"
              name="mode"
              value={e}
              checked={mode === e}
              onChange={onChange}
            />
            {e}
          </label>
        ))}
      </header>
      <hr />
      {mode === 'basic' && <Basic />}
      {mode === 'payload' && <Payload />}
      {mode === 'http' && <Http />}
      <hr />
      <footer>
        <a
          href={`https://github.com/rkrupinski/use-state-machine/blob/master/packages/examples/src/examples/${mode}.tsx`}
          rel="noopener noreferrer"
          target="_blank"
        >
          Source code
        </a>
      </footer>
    </>
  );
};

const root = createRoot(document.querySelector('#root')!);

root.render(<Examples />);

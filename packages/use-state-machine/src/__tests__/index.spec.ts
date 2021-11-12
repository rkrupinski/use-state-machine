import { renderHook, act } from '@testing-library/react-hooks';
import { useStateMachine, $$INITIAL } from '..';

describe('useStateMachine', () => {
  describe('State and transitions', () => {
    it('should initialize with minimal config', () => {
      const { result } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: { foo: {} },
        }),
      );

      expect(result.current).toStrictEqual([
        {
          value: 'foo',
          event: { type: $$INITIAL },
          nextEvents: [],
          context: undefined,
        },
        expect.any(Function),
      ]);
    });

    it('should initialize with complex config', () => {
      const { result } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: { on: { evt1: 'bar' } },
            bar: { on: { evt2: 'foo' } },
          },
          context: 'ctx',
        }),
      );

      expect(result.current).toStrictEqual([
        {
          value: 'foo',
          event: { type: $$INITIAL },
          nextEvents: ['evt1'],
          context: 'ctx',
        },
        expect.any(Function),
      ]);
    });

    it('should not allow impossible states', () => {
      renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {},
            // @ts-expect-error can't transition to bar
            bar: {},
          },
        }),
      );
    });

    it('should warn about missing states', () => {
      renderHook(() =>
        useStateMachine({
          initial: 'foo',
          // @ts-expect-error bar is missing
          states: {
            foo: {
              on: {
                evt1: 'bar',
              },
            },
          },
        }),
      );
    });

    it('should transition to a new state (shorthand)', () => {
      const { result } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              on: {
                evt1: 'bar',
              },
            },
            bar: {},
          },
        }),
      );

      const [, send] = result.current;

      act(() => {
        send('evt1');
      });

      const [state] = result.current;

      expect(state).toStrictEqual({
        value: 'bar',
        event: { type: 'evt1' },
        nextEvents: [],
        context: undefined,
      });
    });

    it('should transition to a new state (object)', () => {
      const { result } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              on: {
                evt1: 'bar',
              },
            },
            bar: {},
          },
        }),
      );

      const [, send] = result.current;

      act(() => {
        send({ type: 'evt1' });
      });

      const [state] = result.current;

      expect(state).toStrictEqual({
        value: 'bar',
        event: { type: 'evt1' },
        nextEvents: [],
        context: undefined,
      });
    });

    it('should transition to a new state (object with payload)', () => {
      const { result } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              on: {
                evt1: 'bar',
              },
            },
            bar: {
              on: {
                evt2: 'foo',
              },
            },
          },
        }),
      );

      const [, send] = result.current;

      act(() => {
        send({ type: 'evt1', payload: 1 });
      });

      const [state] = result.current;

      expect(state).toStrictEqual({
        value: 'bar',
        event: {
          type: 'evt1',
          payload: 1,
        },
        nextEvents: ['evt2'],
        context: undefined,
      });
    });

    it('should handle sending unknown events', () => {
      const { result } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              on: {
                evt1: 'bar',
              },
            },
            bar: {
              on: {
                evt2: 'foo',
              },
            },
          },
        }),
      );

      const [, send] = result.current;

      act(() => {
        // @ts-expect-error evt2 is unknown
        send('evt3');
      });

      const [state] = result.current;

      expect(state).toStrictEqual({
        value: 'foo',
        event: {
          type: $$INITIAL,
        },
        nextEvents: ['evt1'],
        context: undefined,
      });
    });

    it('should allow transition to the same state', () => {
      const effectSpy = jest.fn();

      const { result } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              on: {
                evt1: 'foo',
              },
              effect: effectSpy,
            },
          },
        }),
      );

      expect(effectSpy).toHaveBeenCalledTimes(1);

      const [, send] = result.current;

      act(() => {
        send('evt1');
      });

      expect(effectSpy).toHaveBeenCalledTimes(2);

      const [state] = result.current;

      expect(state).toStrictEqual({
        value: 'foo',
        event: { type: 'evt1' },
        nextEvents: ['evt1'],
        context: undefined,
      });
    });

    it('should handle synchronous send calls', () => {
      const effectSpy1 = jest.fn();
      const effectSpy2 = jest.fn();

      const { result } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              on: {
                evt1: 'bar',
              },
            },
            bar: {
              on: {
                evt2: 'baz',
              },
              effect: effectSpy1,
            },
            baz: {
              effect: effectSpy2,
            },
          },
        }),
      );

      const [, send] = result.current;

      act(() => {
        send('evt1');
        send('evt2');
      });

      const [state] = result.current;

      expect(effectSpy1).not.toHaveBeenCalled();
      expect(effectSpy2).toHaveBeenCalledTimes(1);

      expect(state).toStrictEqual({
        value: 'baz',
        event: { type: 'evt2' },
        nextEvents: [],
        context: undefined,
      });
    });

    it('should maintain "send" reference between renders', () => {
      const { result, rerender } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: { foo: {} },
        }),
      );

      rerender();

      const r1 = result.all[0];
      const r2 = result.all[1];

      if (r1 instanceof Error) throw r1;
      if (r2 instanceof Error) throw r2;

      expect(r1[1]).toBe(r2[1]);
    });
  });

  describe('Guards', () => {
    it('should allow transition', () => {
      const { result } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              on: {
                evt1: {
                  target: 'bar',
                  guard() {
                    return true;
                  },
                },
              },
            },
            bar: {},
          },
        }),
      );

      const [, send] = result.current;

      act(() => {
        send('evt1');
      });

      const [state] = result.current;

      expect(state).toStrictEqual({
        value: 'bar',
        event: { type: 'evt1' },
        nextEvents: [],
        context: undefined,
      });
    });

    it('should prevent transition', () => {
      const { result } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              on: {
                evt1: {
                  target: 'bar',
                  guard() {
                    return false;
                  },
                },
              },
            },
            bar: {},
          },
        }),
      );

      const [, send] = result.current;

      act(() => {
        send('evt1');
      });

      const [state] = result.current;

      expect(state).toStrictEqual({
        value: 'foo',
        event: { type: $$INITIAL },
        nextEvents: ['evt1'],
        context: undefined,
      });
    });

    it('should call guard with correct args', () => {
      const guardSpy = jest.fn(() => true);

      const { result } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              on: {
                evt1: {
                  target: 'bar',
                  guard: guardSpy,
                },
              },
            },
            bar: {},
          },
          context: 1,
        }),
      );

      const [, send] = result.current;

      act(() => {
        send({
          type: 'evt1',
          payload: 1,
        });
      });

      expect(guardSpy).toHaveBeenCalledTimes(1);

      expect(guardSpy).toHaveBeenCalledWith({
        context: 1,
        event: {
          type: 'evt1',
          payload: 1,
        },
      });
    });
  });

  describe('Effects', () => {
    it('should call effect when entering initial state', () => {
      const effectSpy = jest.fn();

      renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              effect: effectSpy,
            },
          },
        }),
      );

      expect(effectSpy).toHaveBeenCalledTimes(1);
    });

    it('should call effect when transitioning to a new state', () => {
      const effectSpy = jest.fn();

      const { result } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              on: {
                evt1: 'bar',
              },
            },
            bar: {
              effect: effectSpy,
            },
          },
        }),
      );

      expect(effectSpy).not.toHaveBeenCalled();

      const [, send] = result.current;

      act(() => {
        send('evt1');
      });

      expect(effectSpy).toHaveBeenCalledTimes(1);
    });

    it('should call cleanup fn when exiting a state', () => {
      const spy = jest.fn<void, [string]>();

      const { result } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              on: {
                evt1: 'bar',
              },
              effect() {
                spy('foo effect');

                return () => spy('foo cleanup');
              },
            },
            bar: {
              effect() {
                spy('bar effect');
              },
            },
          },
        }),
      );

      const [, send] = result.current;

      act(() => {
        send('evt1');
      });

      expect(spy.mock.calls).toEqual([
        ['foo effect'],
        ['foo cleanup'],
        ['bar effect'],
      ]);
    });

    it('should call effect with correct args', () => {
      const effectSpy = jest.fn();

      renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              effect: effectSpy,
            },
          },
          context: 1,
        }),
      );

      expect(effectSpy).toHaveBeenCalledWith({
        event: { type: $$INITIAL },
        send: expect.any(Function),
        context: 1,
        setContext: expect.any(Function),
      });
    });

    it('should send events from effects', () => {
      const { result } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              on: {
                evt1: 'bar',
              },
              effect({ send }) {
                send({ type: 'evt1', payload: 1 });
              },
            },
            bar: {},
          },
        }),
      );

      const [state] = result.current;

      expect(state).toStrictEqual({
        value: 'bar',
        event: { payload: 1, type: 'evt1' },
        nextEvents: [],
        context: undefined,
      });
    });
  });

  describe('Context', () => {
    it('should infer context type', () => {
      renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              effect({ setContext }) {
                setContext(() => 'bar');

                // @ts-expect-error 'baz' does not match
                setContext(() => 'baz');
              },
            },
          },
          context: 'foo' as 'foo' | 'bar',
        }),
      );
    });

    it('should set context from effects', () => {
      const { result } = renderHook(() =>
        useStateMachine({
          initial: 'foo',
          states: {
            foo: {
              effect({ setContext }) {
                setContext(c => c + 1);
              },
            },
          },
          context: 1,
        }),
      );

      const [state] = result.current;

      expect(state).toStrictEqual({
        value: 'foo',
        event: { type: $$INITIAL },
        nextEvents: [],
        context: 2,
      });
    });
  });
});

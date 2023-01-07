# @rkrupinski/use-state-machine

A simple yet powerful finite state machine [React](https://reactjs.org/) hook.

![Build status](https://github.com/rkrupinski/use-state-machine/workflows/CI/badge.svg)
![minified + gzip](https://badgen.net/bundlephobia/minzip/@rkrupinski/use-state-machine)

```ts
const [state, send] = useStateMachine({
  initial: "enabled",
  states: {
    enabled: {
      on: { TOGGLE: "disabled" },
    },
    disabled: {
      on: { TOGGLE: "enabled" },
    },
  },
});
```

<br />

Comes packed with features like:

- effects (state entry/exit)
- guards (allow/prevent state transitions)
- extended state (context)
- good to very good TypeScript experience (see [History](#history))

<br />

Table of contents:

- [History](#history)
- [Installation](#installation)
- [Examples](#examples)
- [API](#api)
  - [State](#state)
  - [Events](#events)
  - [Machine options](#machine-options)
  - [Configuring states](#configuring-states)
  - [Effects](#effects)
  - [Configuring state transitions](#configuring-state-transitions)
  - [Guards](#guards)
- [Event payload](#event-payload)
- [Context](#context)
- [Further reading](#further-reading)

## History

This project was born as an attempt to reimplement [@cassiozen/usestatemachine](https://github.com/cassiozen/useStateMachine) in a more "friendly" way. Despite only weighing <1kB, I found the reference project being slightly overly complex, especially on the type system side of things.

ℹ️ Note: This is based on version [1.0.0-beta.4](https://github.com/cassiozen/useStateMachine/releases/tag/1.0.0-beta.4) ([source code](https://github.com/cassiozen/useStateMachine/tree/ced39beb8a119a1acb264d62f522cfa419f9e85b))

Differences compared to the reference project:

- simpler implementation
- simpler types (with added benefit of making invalid/orphan states impossible)
- manual payload typing/decoding (in place of "[schema](https://github.com/cassiozen/useStateMachine/tree/ced39beb8a119a1acb264d62f522cfa419f9e85b#schema-context--event-typing)"; see [Event payload](#event-payload) for details)
- manual context typing (in place of "[schema](https://github.com/cassiozen/useStateMachine/tree/ced39beb8a119a1acb264d62f522cfa419f9e85b#schema-context--event-typing)"; see [Context](#context) for details)

## Installation

```
npm install @rkrupinski/use-state-machine
```

## Examples

View [source code](packages/examples) or [live](https://use-state-machine.netlify.app).

Examples cover:

- a basic machine with context and guards
- sending events with payload
- http with error recovery

## API

### State

```ts
const [
  state, // <--- this guy
  send,
] = useStateMachine(/* ... */);
```

`state` is an object of the following shape:

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>
      <code>value</code>
    </td>
    <td>
      <code>string</code>
    </td>
    <td>
      The name of the current state.
    </td>
  </tr>
  <tr>
    <td>
      <code>nextEvents</code>
    </td>
    <td>
      <code>string[]</code>
    </td>
    <td>
      The names of possible events.
      <br />
      <br />
      (see <a href="#events">Events</a>)
    </td>
  </tr>
  <tr>
    <td>
      <code>event</code>
    </td>
    <td>
      <code>Event</code>
    </td>
    <td>
      The event that led to the current state.
      <br />
      <br />
      (see <a href="#events">Events</a>)
    </td>
  </tr>
  <tr>
    <td>
      <code>context</code>
    </td>
    <td>
      <code>C</code> (inferred)
    </td>
    <td>
      Machine's extended state. Think of it as a place to store additional, machine-related data throughout its whole lifecycle.
      <br />
      <br />
      (see <a href="#context">Context</a>)
    </td>
  </tr>
</table>

### Events

```ts
const [
  state,
  send, // <--- this guy
] = useStateMachine(/* ... */);
```

Once initialized, events can be sent to the machine using the `send` function.

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>
      <code>send</code>
    </td>
    <td>
      <code>(event: string | Event) => void</code>
    </td>
    <td>
      Sends events to the machine
    </td>
  </tr>
</table>

When sending events you can either use a shorthand (`string`) syntax:

```ts
send("START");
```

or the object (`Event`) syntax:

```ts
send({ type: "START" });
```

Under the hood, all sent events are normalized to objects (`Event`).

ℹ️ Note: The reason behind having 2 formats is that events, apart from being of certain `type`, can also carry `payload`.

(see [Event payload](#event-payload))

### Machine options

```ts
const [state, send] = useStateMachine({
  initial: "idle",
  states: {
    /* ... */
  },
  context: 42,
});
```

Machine can be configured with the following options:

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>
      <code>initial</code> (required)
    </td>
    <td>
      <code>string</code>
    </td>
    <td>
      The initial machine state value.
      <br />
      <br />
      ℹ️ Note: Must be a key of <code>states</code>
    </td>
  </tr>
  <tr>
    <td>
      <code>states</code> (required)
    </td>
    <td>
      <code>{ [key: string]: StateConfig }</code>
    </td>
    <td>
      An object with configuration for all the states.
      <br />
      <br />
      (see <a href="#configuring-states">Configuring states</a>)
    </td>
  </tr>
  <tr>
    <td>
      <code>context</code>
    </td>
    <td>
      <code>C</code> (inferred)
    </td>
    <td>
      Initial context value.
      <br />
      <br />
      (see <a href="#context">Context</a>)
    </td>
  </tr>
</table>

### Configuring states

You can configure individual states using the `states` field of the machine options.

```ts
const [state, send] = useStateMachine({
  /* ... */
  states: {
    idle: {
      on: {
        START: "running",
      },
      effect() {
        console.log("idling");
      },
    },
    /* ... */
  },
});
```

Keys of the `states` object are state names, values are `StateConfig` object of the following shape:

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>
      <code>on</code>
    </td>
    <td>
      <code>{ [key: string]: string | EvtConfig }</code>
    </td>
    <td>
      An object with configuration for all the transitions supported by this particular state.
      <br />
      <br />
      (see <a href="#configuring-state-transitions">Configuring state transitions</a>)
    </td>
  </tr>
  <tr>
    <td>
      <code>effect</code>
    </td>
    <td>
      <code>Effect</code>
    </td>
    <td>
      A callback fired once the machine has transitioned to a particular state.
      <br />
      <br />
      (see <a href="#effects">Effects</a>)
    </td>
  </tr>
</table>

ℹ️ Note: There can't be a state that's neither initial, nor can be transitioned to.

### Effects

You can define a callback to fire once the machine has transitioned to a particular state using the `effect` field.

```ts
const [state, send] = useStateMachine({
  /* ... */
  states: {
    idle: {
      effect({ context, setContext, event, send }) {
        console.log("idling due to", event.type);

        return () => {
          console.log("idling no more");
        };
      },
    },
    /* ... */
  },
});
```

The `effect` callback will receive an object of the following shape:

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>
      <code>context</code>
    </td>
    <td>
      <code>C</code> (inferred)
    </td>
    <td>
      The current value of the machine context.
      <br />
      <br />
      (see <a href="#context">Context</a>)
    </td>
  </tr>
  <tr>
    <td>
      <code>setContext</code>
    </td>
    <td>
      <code>(updater: (context: C) => C) => void</code>
    </td>
    <td>
      A function to update the value of <code>context</code>.
      <br />
      <br />
      (see <a href="#context">Context</a>)
    </td>
  </tr>
  <tr>
    <td>
      <code>event</code>
    </td>
    <td>
      <code>Event</code>
    </td>
    <td>
      The event that triggered the current machine state.
      <br />
      <br />
      (see <a href="#events">Events</a>)
    </td>
  </tr>
  <tr>
    <td>
      <code>send</code>
    </td>
    <td>
      <code>(event: string | Event) => void</code>
    </td>
    <td>
      A function to send events to the machine.
      <br />
      <br />
      (see <a href="#events">Events</a>)
    </td>
  </tr>
</table>

If the return value from `effect` is of type `function`, that function will be executed when the machine transitions away from the current state (exit/cleanup effect):

```ts
effect() {
  console.log('entered a state');

  return () => {
    console.log('exited a state');
  };
},
```

ℹ️ Note: Events are processed synchronously while effects are asynchronous. In other words, if several events are sent synchronously, e.g.:

```ts
send("ONE");
send("TWO");
send("THREE");
```

state transitions will be performed accordingly, yet only the effect for state triggered by `THREE` (if defined) will be executed.

### Configuring state transitions

For every state you can configure when and if a transition to a different state should be performed. This is done via the `on` property of `StateConfig`.

```ts
const [state, send] = useStateMachine({
  /* ... */
  states: {
    idle: {
      on: {
        START: "running",
        FUEL_CHECK: {
          target: "off",
          guard() {
            return isOutOfFuel();
          },
        },
      },
    },
    off: {},
  },
});
```

Transition config can either be a `string` (denoting the target state value) or an object of the following shape:

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>
      <code>target</code> (required)
    </td>
    <td>
      <code>string</code>
    </td>
    <td>
      Target state value.
      <br />
      <br />
      ℹ️ Note: Must be a key of <code>states</code>.
      <br />
      <br />
      (see <a href="#configuring-states">Configuring states</a>)
    </td>
  </tr>
  <tr>
    <td>
      <code>guard</code>
    </td>
    <td>
      <code>Guard</code>
    </td>
    <td>
      A <code>boolean</code>-returning function to determine whether state transition is allowed.
      <br />
      <br />
      (see <a href="#guards">Guards</a>)
    </td>
  </tr>
</table>

### Guards

The purpose of guards is to determine whether state transition is allowed. A `guard` function is invoked before performing state transition and depending on its return value:

- `true` ➡️ transition is performed
- `false` ➡️ transition is prevented

A `guard` function will receive an object of the following shape:

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>
      <code>event</code> 
    </td>
    <td>
      <code>Event</code>
    </td>
    <td>
      The event that triggered state transition.
      <br />
      <br />
      (see <a href="#events">Events</a>)
    </td>
  </tr>
  <tr>
    <td>
      <code>context</code>
    </td>
    <td>
      <code>C</code> (inferred)
    </td>
    <td>
      The current value of the machine context.
      <br />
      <br />
      (see <a href="#context">Context</a>)
    </td>
  </tr>
</table>

## Event payload

When using the object (`Event`) syntax, you can send events with payload like so:

```ts
send({
  type: "REFUEL",
  payload: { gallons: 5 },
});
```

The payload can be then consumed from:

- the `state` object (see [State](#state))
- `effect` functions (see [Effects](#effects))
- `guard` functions (see [Guards](#guards))

How is it typed though? Is the type of `payload` inferred correctly?

For several reasons, the most important of which is simplicity (see [History](#history)), this library does neither aim at inferring, nor allows providing detailed event types. Instead, it encourages using other techniques, like:

- Duck typing
- Type guards
- Decoders

The payload (`event.payload`) is always typed as `unknown` and it's up to the consumer to extract all the required information from it.

Here's an example of a `guard` function that only allows refueling if the number of gallons is at least `5`, using [io-ts](https://github.com/gcanti/io-ts) to decode the `payload`:

```ts
import * as t from "io-ts";
import { pipe } from 'fp-ts/function';
import { fold } from 'fp-ts/Either';

const RefuelPayload = t.type({
  gallons: t.number,
});

/* ... */

guard({ event }) {
  const gallons = pipe(
    RefuelPayload.decode(event.payload),
    fold(
      () => 0,
      p => p.gallons,
    ),
  );

  return gallons >= 5;
}
```

## Context

As mentioned above, the type of `context` is inferred from the initial value (see [Machine options](#machine-options)).

Type inference is straightforward for basic types like:

- `42` ➡️ `number`
- `'context'` ➡️ `string`
- `[1, 2, 3]` ➡️ `number[]`

It gets tricky though if you need more complex constructs like:

- type narrowing (`'foo'` vs `string`)
- optionality (`{ foo?: string }`)
- unions (`'foo' | 'bar'`)

Again, complex inference and annotating all the things through generic parameters is beyond the scope of this library (see [History](#history)). What it encourages instead is "hinting" TypeScript on the actual type of `context`.

This can be done via type assertions:

```ts
type ContextType = "foo" | "bar";

const [state, send] = useStateMachine({
  /* ... */
  context: "foo" as ContextType,
});

state.context; // 'foo' | 'bar'
```

## Further reading

- [State machines](https://en.wikipedia.org/wiki/Finite-state_machine) on Wikipedia
- [@cassiozen/usestatemachine](https://github.com/cassiozen/useStateMachine)
- [XState](https://xstate.js.org/)

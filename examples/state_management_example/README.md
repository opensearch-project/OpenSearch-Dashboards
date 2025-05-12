# State Management Example Plugin

This plugin demonstrates the usage of state management utilities in OpenSearch Dashboards, including `BaseActions`, `BaseSelectors`, `usePluginKeys`, `useSelector`, and `useActions`.

## Overview

The `state_management_example` plugin showcases how to manage state effectively using:

- **BaseActions**: Encapsulates state-changing logic.
- **BaseSelectors**: Provides read-only access to specific parts of the state.
- **usePluginKeys**: Retrieves all registered plugin keys.
- **useSelector**: Subscribes to specific parts of the state.
- **useActions**: Accesses actions for a specific plugin.

## Utilities Used

### 1. BaseActions

`BaseActions` is used to encapsulate state-changing logic. In this example, `CounterActions` extends `BaseActions` to provide methods for incrementing, decrementing, and resetting the counter.

#### Example:
```typescript
import { BehaviorSubject } from 'rxjs';
import { BaseActions } from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { CounterState } from './counter_state';

export class CounterActions extends BaseActions<CounterState> {
  constructor(state$: BehaviorSubject<CounterState>) {
    super(state$);
  }

  public increment(): void {
    this.updateState((state) => ({
      ...state,
      count: state.count + 1,
    }));
  }

  public decrement(): void {
    this.updateState((state) => ({
      ...state,
      count: state.count - 1,
    }));
  }

  public reset(): void {
    this.updateState((state) => ({
      ...state,
      count: 0,
    }));
  }
}
```

### 2. BaseSelectors

`BaseSelectors` provides read-only access to specific parts of the state. It ensures that components only re-render when the selected state changes.

#### Example:
```typescript
import { BaseSelectors } from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { CounterState } from './counter_state';

export class CounterSelectors extends BaseSelectors<CounterState> {
  public getCount(): number {
    return this.getState().count;
  }
}
```

### 3. usePluginKeys

`usePluginKeys` retrieves all registered plugin keys. This is useful for dynamically listing available plugins.

#### Example:
```typescript
import { usePluginKeys } from '../../../../src/plugins/opensearch_dashboards_react/public';

const PluginList = () => {
  const pluginKeys = usePluginKeys();

  return (
    <ul>
      {pluginKeys.map((key) => (
        <li key={key}>{key}</li>
      ))}
    </ul>
  );
};
```

### 4. useSelector

`useSelector` subscribes to specific parts of the state and re-renders the component only when the selected state changes.

#### Example:
```typescript
import { useSelector } from '../../../../src/plugins/opensearch_dashboards_react/public';

const CounterDisplay = () => {
  const count = useSelector('counterPlugin', (state) => state.count);

  return <div>Count: {count}</div>;
};
```

### 5. useActions

`useActions` provides access to actions for a specific plugin.

#### Example:
```typescript
import { useActions } from '../../../../src/plugins/opensearch_dashboards_react/public';

const CounterControls = () => {
  const actions = useActions('counterPlugin');

  return (
    <div>
      <button onClick={actions.increment}>Increment</button>
      <button onClick={actions.decrement}>Decrement</button>
      <button onClick={actions.reset}>Reset</button>
    </div>
  );
};
```

## Plugin Structure

The plugin is structured as follows:

- **State**: Defines the state shape and initial values.
- **Actions**: Encapsulates state-changing logic.
- **Selectors**: Provides read-only access to state.
- **Components**: Demonstrates how to use hooks like `useSelector` and `useActions`.

## Running the Example

1. Start OpenSearch Dashboards with the `--run-examples` flag:
   ```bash
   yarn start --run-examples
   ```
2. Navigate to the `State Management Example` plugin in the UI.

## Learn More

- [useSelector Documentation](../../docs/state_containers/react/use_selector.md)
- [BaseActions Documentation](../../docs/state_containers/base_actions.md)
- [BaseSelectors Documentation](../../docs/state_containers/base_selectors.md)

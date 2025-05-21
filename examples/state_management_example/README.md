# State Management Example Plugin

This plugin demonstrates the flexible state management system in OpenSearch Dashboards that supports both Observable-based and Redux-based state backends with a consistent API.

## Overview

The state management system provides:

- Support for multiple state backends (Observable/Redux)
- Type-safe state management
- Efficient component re-rendering
- Consistent API through hooks

## Core Components

### StateAdapter

The adapter pattern provides a unified interface for different state backends:

```typescript
// For RxJS Observables
const observableAdapter = new BehaviorSubjectAdapter(subject);

// For Redux stores
const reduxAdapter = new ReduxStateAdapter(store, state => state.mySlice);
```

### BaseActions

Define state-changing logic that works with any state backend:

```typescript
class CounterActions extends BaseActions<CounterState> {
  // Works with both Observable and Redux backends
  constructor(adapterOrObservable: StateAdapter<CounterState> | ObservableLike<CounterState>) {
    super(adapterOrObservable);
  }

  increment() {
    this.updateState(state => ({
      ...state,
      count: state.count + 1
    }));
  }
}
```

### BaseSelectors

Access state in a read-only manner:

```typescript
class CounterSelectors extends BaseSelectors<CounterState> {
  // Works with both Observable and Redux backends
  constructor(adapterOrObservable: StateAdapter<CounterState> | ObservableLike<CounterState>) {
    super(adapterOrObservable);
  }
  
  // The base class provides getState() by default
  isPositive() {
    return this.getState().count > 0;
  }
}
```

## React Hooks

### useAction

Access actions from a registered service:

```typescript
// In a React component
const actions = useAction<CounterState>('counterService');
// Then use actions
<button onClick={() => actions.increment()}>+</button>
```

### useSelector

Subscribe to state changes:

```typescript
// Only re-renders when the selected value changes
const count = useSelector<CounterState, number>(
  'counterService',
  state => state.count
);
```

## Example Implementations

### Observable-Based Counter

```typescript
// Create with Observable pattern
const state$ = new BehaviorSubject<CounterState>({ count: 0 });
const actions = new CounterActions(state$);
const selectors = new CounterSelectors(state$);

// Register with global store
globalStoreServiceRegister('observableCounter', selectors, actions);
```

### Redux-Based Counter

```typescript
// Create with Redux pattern
const store = configureStore({
  reducer: { counter: counterReducer }
});
const adapter = new ReduxStateAdapter<CounterState>(store, state => state.counter);
const actions = new CounterActions(adapter);
const selectors = new CounterSelectors(adapter);

// Register with global store
globalStoreServiceRegister('reduxCounter', selectors, actions);
```

### Component Usage

```tsx
// The same component works with both backends
function CounterDisplay({ serviceKey }) {
  const count = useSelector(serviceKey, state => state.count);
  const actions = useAction(serviceKey);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => actions.increment()}>Increment</button>
    </div>
  );
}

// Use it with either backend
<CounterDisplay serviceKey="observableCounter" />
<CounterDisplay serviceKey="reduxCounter" />
```

## Key Benefits

1. **Backend Flexibility**: Choose the state management pattern that best fits your needs
2. **Consistent API**: Components use the same hooks regardless of backend
3. **Easy Migration**: Switch backends without changing component code
4. **Type Safety**: Full TypeScript support throughout

## Running the Example

1. Start OpenSearch Dashboards with the development flag:
   ```bash
   yarn start --run-examples
   ```
2. Navigate to the State Management Example plugin in the UI

## Learn More

- [BaseActions Documentation](../../src/plugins/opensearch_dashboards_utils/common/state_management/base_action.ts)
- [BaseSelectors Documentation](../../src/plugins/opensearch_dashboards_utils/common/state_management/base_selector.ts)
- [State Adapters Documentation](../../src/plugins/opensearch_dashboards_utils/common/state_management/state_adapter.ts)

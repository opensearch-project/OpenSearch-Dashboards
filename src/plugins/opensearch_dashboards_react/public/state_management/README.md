# State Management Utilities

This folder contains utilities and abstractions for managing state in OpenSearch Dashboards. These utilities are designed to provide a consistent and efficient way to manage state across plugins and components.

## Overview

The state management utilities in this folder include:

### 1. Store
The `Store` class provides a centralized way to manage state for multiple plugins. It allows you to register selectors and actions for each plugin and provides methods to access and update the state.

#### Key Features:
- Centralized state management
- Plugin-specific selectors and actions
- Subscription to plugin key changes

#### Example:
```typescript
const store = new Store();

store.registerService('myPlugin', mySelectors, myActions);

const actions = store.getAction('myPlugin');
actions.someAction();

const selector = store.getSelector('myPlugin');
const value = selector.someSelector();
```

### 2. BaseActions
The `BaseActions` class encapsulates state-changing logic. It provides a base implementation for defining actions that modify the state.

#### Example:
```typescript
class MyActions extends BaseActions<MyState> {
  increment() {
    this.updateState(state => ({ count: state.count + 1 }));
  }
}
```

### 3. BaseSelectors
The `BaseSelectors` class provides read-only access to specific parts of the state. It ensures that components only re-render when the selected state changes.

#### Example:
```typescript
class MySelectors extends BaseSelectors<MyState> {
  getCount() {
    return this.getState().count;
  }
}
```

### 4. PluginStoreContext
The `PluginStoreContext` provides a React context for accessing the `Store` instance. It includes a `PluginStoreProvider` component and a `useStore` hook.

#### Example:
```tsx
<PluginStoreProvider store={store}>
  <MyComponent />
</PluginStoreProvider>

const store = useStore();
```

### 5. Hooks
This folder also includes React hooks for interacting with the state management utilities:
- `useAction`: Access actions for a specific plugin.
- `useSelector`: Subscribe to specific parts of the state.
- `usePluginKeys`: Retrieve all registered plugin keys.

#### Example:
```tsx
const actions = useAction('myPlugin');
const value = useSelector('myPlugin', state => state.value);
const pluginKeys = usePluginKeys();
```

## Best Practices

1. **Centralize State Management**: Use the `Store` class to manage state for multiple plugins.
2. **Encapsulate Logic**: Define actions and selectors using `BaseActions` and `BaseSelectors`.
3. **Use React Context**: Use the `PluginStoreContext` to provide access to the store in React components.
4. **Optimize Performance**: Use `useSelector` to subscribe to specific parts of the state and avoid unnecessary re-renders.

## Learn More

- [useSelector Documentation](../../docs/state_containers/react/use_selector.md)
- [BaseActions Documentation](../../docs/state_containers/base_actions.md)
- [BaseSelectors Documentation](../../docs/state_containers/base_selectors.md)
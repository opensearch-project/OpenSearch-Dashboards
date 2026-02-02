# State Management Utilities

This folder provides a set of utilities and abstractions for managing state in OpenSearch Dashboards plugins and applications. These utilities are designed to offer a consistent, efficient, and type-safe approach to state management, supporting both plugin-level and global state.

---

## Overview

The state management system here is built around a central `Store` class, a set of base abstractions for actions and selectors, React context integration, and a suite of React hooks for easy consumption in components.

---

## Utilities

### 1. Store

**File:** `store/global_store.ts`, `store/index.ts`

The `Store` class is a central registry for plugin state. It allows you to:

- Register selectors and actions for each plugin.
- Retrieve selectors and actions by plugin key.
- Subscribe to changes in the set of registered plugins.

**Example:**
```typescript
const store = new Store();
store.registerService('myPlugin', mySelectors, myActions);

const actions = store.getAction('myPlugin');
actions.someAction();

const selector = store.getSelector('myPlugin');
const value = selector.someSelector();
```

A global instance, `globalStore`, is provided for convenience.

---

### 2. BaseActions

**File:** (from utils package, re-exported)

The `BaseActions` class encapsulates state-changing logic. Extend this class to define your plugin's actions.

**Example:**
```typescript
class MyActions extends BaseActions<MyState> {
  increment() {
    this.updateState(state => ({ count: state.count + 1 }));
  }
}
```

---

### 3. BaseSelectors

**File:** (from utils package, re-exported)

The `BaseSelectors` class provides read-only access to state and manages subscriptions for efficient re-rendering.

**Example:**
```typescript
class MySelectors extends BaseSelectors<MyState> {
  getCount() {
    return this.getState().count;
  }
}
```

---

### 4. PluginStoreContext

**File:** `context/plugin_store_context.tsx`

Provides a React context for accessing the `Store` instance. Includes:

- `PluginStoreProvider`: Context provider for the store.
`PluginStoreProvider`'s store property is optional in nature in case no store is passed the global Store is passed by default. If you want to restrict the scope of the states to a particular plugin, initialize a new store scoped to the plugin and pass it within the provider. All the utility within the Provider will be using the 
scoped store defined within the plugin. 

- `useStore`: Hook to access the current store.


**Example:**
```tsx
<PluginStoreProvider store={store}>
  <MyComponent />
</PluginStoreProvider>

const store = useStore();
```

---

### 5. React Hooks

**Folder:** `hooks/`

A set of hooks for interacting with the state management system:

- **`useAction`**: Access actions for a specific plugin.
  ```typescript
  const actions = useAction('myPlugin');
  actions.increment();
  ```

- **`useSelector`**: Subscribe to a specific part of a plugin's state.
  ```typescript
  const value = useSelector('myPlugin', state => state.value);
  ```

- **`usePluginKeys`**: Get all registered plugin keys.
  ```typescript
  const pluginKeys = usePluginKeys();
  ```

---

## Best Practices

1. **Centralize State Management**: Use the `Store` class to manage state for multiple plugins.
2. **Encapsulate Logic**: Define actions and selectors using `BaseActions` and `BaseSelectors`.
3. **Use React Context**: Use `PluginStoreProvider` and `useStore` to provide and access the store in React components.
4. **Optimize Performance**: Use `useSelector` to subscribe to specific parts of the state and avoid unnecessary re-renders.

---

## Example Usage

```tsx
import { PluginStoreProvider, useAction, useSelector, usePluginKeys } from './state_management';

const Counter = () => {
  const actions = useAction('counterPlugin');
  const count = useSelector('counterPlugin', state => state.count);

  return (
    <div>
      <div>Count: {count}</div>
      <button onClick={actions.increment}>Increment</button>
    </div>
  );
};

const PluginList = () => {
  const pluginKeys = usePluginKeys();
  return <ul>{pluginKeys.map(key => <li key={key}>{key}</li>)}</ul>;
};

// In your app root:
<PluginStoreProvider>
  <Counter />
  <PluginList />
</PluginStoreProvider>
```

---

## Learn More

- [useSelector Documentation](../../docs/state_containers/react/use_selector.md)
- [BaseActions Documentation](../../docs/state_containers/base_actions.md)
- [BaseSelectors Documentation](../../docs/state_containers/base_selectors.md)

---
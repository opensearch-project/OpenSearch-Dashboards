# OpenSearch Dashboards UI Framework and Component System

## Overview

OpenSearch Dashboards provides a comprehensive UI framework built on React and the OUI (OpenSearch UI) component library. This guide covers the essential patterns, components, and practices for building user interfaces within the OpenSearch Dashboards ecosystem.

## Table of Contents
- [Core Technologies](#core-technologies)
- [React Integration and Component Patterns](#react-integration-and-component-patterns)
- [UI Framework Components](#ui-framework-components)
- [State Management](#state-management)
- [Routing and Navigation](#routing-and-navigation)
- [Theme System and Styling](#theme-system-and-styling)
- [Accessibility Patterns](#accessibility-patterns)
- [Best Practices](#best-practices)

## Core Technologies

### OUI (OpenSearch UI)
OpenSearch Dashboards uses OUI, a React component library that provides:
- Comprehensive set of UI components
- Design tokens and theming system
- Accessibility features built-in
- TypeScript support

```typescript
import {
  EuiButton,
  EuiPage,
  EuiPageContent,
  EuiTitle
} from '@elastic/eui'; // Aliased to @opensearch-project/oui
```

### React 17
All UI components are built using React with hooks and function components as the preferred pattern.

## React Integration and Component Patterns

### Application Mounting

Applications in OpenSearch Dashboards are mounted through the core application service:

```typescript
// plugin.tsx
export class MyPlugin implements Plugin {
  public setup(core: CoreSetup): void {
    core.application.register({
      id: 'my-app',
      title: 'My Application',
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./application');
        return renderApp(params);
      }
    });
  }
}

// application.tsx
import ReactDOM from 'react-dom';
import { AppMountParameters } from 'src/core/public';

export const renderApp = ({ element, history }: AppMountParameters) => {
  ReactDOM.render(
    <Router history={history}>
      <MyApp />
    </Router>,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
```

### Context Pattern

OpenSearch Dashboards provides a React context system for accessing core services:

```typescript
import {
  createOpenSearchDashboardsReactContext,
  OpenSearchDashboardsContextProvider,
  useOpenSearchDashboards
} from 'opensearch-dashboards-react';

// Create context with services
const context = createOpenSearchDashboardsReactContext({
  ...core,
  ...plugins
});

// Use in component tree
<OpenSearchDashboardsContextProvider services={services}>
  <MyApplication />
</OpenSearchDashboardsContextProvider>

// Access services in components
const MyComponent = () => {
  const { services } = useOpenSearchDashboards();
  const { notifications, http, uiSettings } = services;

  return <div>...</div>;
};
```

### Component Patterns

#### Container/Presentational Pattern
```typescript
// Container component (handles logic)
const TodoListContainer: React.FC = () => {
  const { services } = useOpenSearchDashboards();
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    services.http.get('/api/todos').then(setTodos);
  }, [services.http]);

  return <TodoList todos={todos} onComplete={handleComplete} />;
};

// Presentational component (pure UI)
const TodoList: React.FC<{ todos: Todo[], onComplete: (id: string) => void }> = ({
  todos,
  onComplete
}) => (
  <EuiListGroup>
    {todos.map(todo => (
      <EuiListGroupItem
        key={todo.id}
        label={todo.text}
        onClick={() => onComplete(todo.id)}
      />
    ))}
  </EuiListGroup>
);
```

## UI Framework Components

### Layout Components

```typescript
import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiPageHeader,
  EuiPageSideBar
} from '@elastic/eui';

const MyPage = () => (
  <EuiPage restrictWidth="1200px">
    <EuiPageSideBar>
      {/* Navigation */}
    </EuiPageSideBar>
    <EuiPageBody>
      <EuiPageHeader>
        <EuiTitle size="l">
          <h1>Page Title</h1>
        </EuiTitle>
      </EuiPageHeader>
      <EuiPageContent>
        <EuiPageContentHeader>
          <EuiPageContentHeaderSection>
            <EuiTitle>
              <h2>Content Title</h2>
            </EuiTitle>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
        <EuiPageContentBody>
          {/* Main content */}
        </EuiPageContentBody>
      </EuiPageContent>
    </EuiPageBody>
  </EuiPage>
);
```

### Form Components

```typescript
import {
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiSelect,
  EuiSwitch,
  EuiButton
} from '@elastic/eui';

const MyForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'default',
    enabled: false
  });

  return (
    <EuiForm>
      <EuiFormRow label="Name" helpText="Enter a unique name">
        <EuiFieldText
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </EuiFormRow>

      <EuiFormRow label="Type">
        <EuiSelect
          options={[
            { value: 'default', text: 'Default' },
            { value: 'custom', text: 'Custom' }
          ]}
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        />
      </EuiFormRow>

      <EuiFormRow>
        <EuiSwitch
          label="Enable feature"
          checked={formData.enabled}
          onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
        />
      </EuiFormRow>

      <EuiButton type="submit" fill>
        Save
      </EuiButton>
    </EuiForm>
  );
};
```

### Data Display Components

```typescript
import {
  EuiBasicTable,
  EuiHealth,
  EuiButton,
  EuiLink
} from '@elastic/eui';

const DataTable = ({ items }) => {
  const columns = [
    {
      field: 'name',
      name: 'Name',
      sortable: true,
      render: (name: string) => <EuiLink href="#">{name}</EuiLink>
    },
    {
      field: 'status',
      name: 'Status',
      render: (status: string) => {
        const color = status === 'active' ? 'success' : 'danger';
        return <EuiHealth color={color}>{status}</EuiHealth>;
      }
    },
    {
      name: 'Actions',
      actions: [
        {
          name: 'Edit',
          onClick: (item) => console.log('Edit', item)
        }
      ]
    }
  ];

  return (
    <EuiBasicTable
      items={items}
      columns={columns}
      pagination={{
        pageSize: 10,
        totalItemCount: items.length
      }}
    />
  );
};
```

## State Management

### Plugin Store Pattern

OpenSearch Dashboards provides a centralized state management system:

```typescript
import {
  BaseActions,
  BaseSelectors,
  Store,
  PluginStoreProvider,
  useAction,
  useSelector
} from 'opensearch-dashboards-react/state_management';

// Define state
interface CounterState {
  count: number;
}

// Define actions
class CounterActions extends BaseActions<CounterState> {
  increment() {
    this.updateState(state => ({ count: state.count + 1 }));
  }

  decrement() {
    this.updateState(state => ({ count: state.count - 1 }));
  }
}

// Define selectors
class CounterSelectors extends BaseSelectors<CounterState> {
  getCount() {
    return this.getState().count;
  }
}

// Register with store
const store = new Store();
store.registerService('counter',
  new CounterSelectors({ count: 0 }),
  new CounterActions({ count: 0 })
);

// Use in components
const Counter = () => {
  const actions = useAction('counter');
  const count = useSelector('counter', state => state.count);

  return (
    <div>
      <span>Count: {count}</span>
      <EuiButton onClick={() => actions.increment()}>+</EuiButton>
      <EuiButton onClick={() => actions.decrement()}>-</EuiButton>
    </div>
  );
};

// Wrap app with provider
<PluginStoreProvider store={store}>
  <Counter />
</PluginStoreProvider>
```

### State Synchronization

Sync state with URL for shareable views:

```typescript
import { syncState } from 'opensearch_dashboards_utils/public';
import { createOsdUrlStateStorage } from 'opensearch_dashboards_utils/public/state_sync';

const stateStorage = createOsdUrlStateStorage({
  history,
  useHash: false
});

const stateContainer = createStateContainer({
  query: '',
  filters: []
});

// Sync state with URL
const { start, stop } = syncState({
  storageKey: '_a',
  stateContainer,
  stateStorage
});

// Start syncing
start();

// Clean up
stop();
```

## Routing and Navigation

### Scoped History

Each application receives a scoped history instance:

```typescript
import { ScopedHistory } from 'src/core/public';
import { Router, Route, Switch } from 'react-router-dom';

interface AppProps {
  history: ScopedHistory;
}

const App: React.FC<AppProps> = ({ history }) => (
  <Router history={history}>
    <Switch>
      <Route path="/details/:id">
        <DetailsPage />
      </Route>
      <Route path="/">
        <HomePage />
      </Route>
    </Switch>
  </Router>
);

// Navigation
const navigateToDetails = (id: string) => {
  history.push(`/details/${id}`);
};
```

### Chrome Navigation

Configure application navigation through Chrome service:

```typescript
// Register nav links
core.chrome.navLinks.update('my-app', {
  title: 'My Application',
  icon: 'gear',
  order: 100,
  category: {
    id: 'opensearch',
    label: 'OpenSearch'
  }
});

// Nav groups for better organization
core.chrome.navGroup.addNavLinksToGroup({
  id: 'analytics',
  title: 'Analytics',
  description: 'Analytics tools'
}, [
  { id: 'my-analytics-app' }
]);
```

### Breadcrumbs

```typescript
const setBreadcrumbs = (chrome: ChromeStart) => {
  chrome.setBreadcrumbs([
    {
      text: 'Home',
      href: '/'
    },
    {
      text: 'Analytics',
      href: '/app/analytics'
    },
    {
      text: 'Dashboard'
    }
  ]);
};
```

## Theme System and Styling

### Theme Variables

Access theme variables in components:

```typescript
import { useUiSetting } from 'opensearch-dashboards-react';

const ThemedComponent = () => {
  const isDarkMode = useUiSetting<boolean>('theme:darkMode');

  return (
    <div className={isDarkMode ? 'dark-theme' : 'light-theme'}>
      {/* Component content */}
    </div>
  );
};
```

### Custom Styles

Use SCSS modules for component-specific styles:

```scss
// my_component.scss
@import '@elastic/eui/src/global_styling/variables/index';
@import '@elastic/eui/src/global_styling/mixins/index';

.myComponent {
  padding: $euiSize;
  background: $euiColorEmptyShade;

  @include euiBreakpoint('xs', 's') {
    padding: $euiSizeS;
  }
}

.myComponent__title {
  @include euiTitle('m');
  color: $euiTitleColor;
}
```

```typescript
// Import styles
import './my_component.scss';

const MyComponent = () => (
  <div className="myComponent">
    <h2 className="myComponent__title">Title</h2>
  </div>
);
```

### Responsive Design

```typescript
import { EuiHideFor, EuiShowFor } from '@elastic/eui';

const ResponsiveComponent = () => (
  <>
    <EuiHideFor sizes={['xs', 's']}>
      <DesktopView />
    </EuiHideFor>
    <EuiShowFor sizes={['xs', 's']}>
      <MobileView />
    </EuiShowFor>
  </>
);
```

## Accessibility Patterns

### ARIA Labels and Roles

```typescript
const AccessibleForm = () => (
  <form role="form" aria-label="User settings">
    <EuiFormRow label="Email" labelType="legend">
      <EuiFieldText
        aria-label="Email address"
        aria-required="true"
        required
      />
    </EuiFormRow>

    <EuiButton
      type="submit"
      aria-label="Save user settings"
    >
      Save
    </EuiButton>
  </form>
);
```

### Keyboard Navigation

```typescript
const KeyboardNavigableList = ({ items }) => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        handleSelect(items[focusedIndex]);
        break;
    }
  };

  return (
    <ul role="listbox" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <li
          key={item.id}
          role="option"
          tabIndex={index === focusedIndex ? 0 : -1}
          aria-selected={index === focusedIndex}
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
};
```

### Screen Reader Support

```typescript
const LoadingState = ({ isLoading, children }) => (
  <div aria-busy={isLoading} aria-live="polite">
    {isLoading ? (
      <EuiLoadingSpinner aria-label="Loading content" />
    ) : (
      children
    )}
  </div>
);

// Announce dynamic changes
const Notification = ({ message }) => (
  <div role="alert" aria-live="assertive">
    {message}
  </div>
);
```

### Focus Management

```typescript
const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus modal
      modalRef.current?.focus();
    } else {
      // Restore focus
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  return isOpen ? (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      {children}
    </div>
  ) : null;
};
```

## Best Practices

### 1. Component Organization

```
src/plugins/my_plugin/
├── public/
│   ├── components/
│   │   ├── common/           # Shared components
│   │   ├── forms/           # Form components
│   │   └── visualizations/  # Visualization components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # Service layer
│   └── application.tsx      # Main app component
```

### 2. Error Handling

```typescript
import { EuiErrorBoundary } from '@elastic/eui';

const AppWithErrorBoundary = () => (
  <EuiErrorBoundary>
    <App />
  </EuiErrorBoundary>
);

// Component-level error handling
const DataFetcher = () => {
  const { services } = useOpenSearchDashboards();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    services.http.get('/api/data')
      .catch(err => {
        setError(err);
        services.notifications.toasts.addDanger({
          title: 'Failed to fetch data',
          text: err.message
        });
      });
  }, [services]);

  if (error) {
    return <EuiCallOut title="Error" color="danger">{error.message}</EuiCallOut>;
  }

  return <DataDisplay />;
};
```

### 3. Performance Optimization

```typescript
// Memoization
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() =>
    expensiveProcessing(data), [data]
  );

  return <DataVisualization data={processedData} />;
});

// Lazy loading
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

const App = () => (
  <React.Suspense fallback={<EuiLoadingSpinner />}>
    <HeavyComponent />
  </React.Suspense>
);

// Debounced search
const SearchInput = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const debouncedSearch = useMemo(
    () => debounce(onSearch, 300),
    [onSearch]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return (
    <EuiFieldSearch
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
};
```

### 4. Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { OpenSearchDashboardsContextProvider } from 'opensearch-dashboards-react';

const mockServices = {
  http: { get: jest.fn() },
  notifications: { toasts: { addSuccess: jest.fn() } }
};

describe('MyComponent', () => {
  it('renders and handles interaction', async () => {
    const { getByText, getByRole } = render(
      <OpenSearchDashboardsContextProvider services={mockServices}>
        <MyComponent />
      </OpenSearchDashboardsContextProvider>
    );

    fireEvent.click(getByRole('button', { name: /save/i }));

    expect(mockServices.notifications.toasts.addSuccess)
      .toHaveBeenCalledWith('Saved successfully');
  });
});
```

## Integration Examples

### Complete Application Example

```typescript
// plugin.ts
export class MyPlugin implements Plugin {
  public setup(core: CoreSetup, deps: PluginDeps) {
    // Register application
    core.application.register({
      id: 'my-app',
      title: 'My Application',
      order: 1000,
      mount: async (params) => {
        const [coreStart, depsStart] = await core.getStartServices();
        const { renderApp } = await import('./application');

        return renderApp(coreStart, depsStart, params);
      }
    });

    // Register nav link
    core.chrome.navLinks.update('my-app', {
      category: {
        id: 'opensearch',
        label: 'OpenSearch'
      }
    });
  }
}

// application.tsx
export const renderApp = (
  core: CoreStart,
  deps: PluginDepsStart,
  { element, history }: AppMountParameters
) => {
  // Create service context
  const services = {
    ...core,
    ...deps
  };

  ReactDOM.render(
    <OpenSearchDashboardsContextProvider services={services}>
      <Router history={history}>
        <AppWithProviders />
      </Router>
    </OpenSearchDashboardsContextProvider>,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};

// App.tsx
const App: React.FC = () => {
  const { services } = useOpenSearchDashboards();
  const [data, setData] = useState([]);

  useEffect(() => {
    // Set breadcrumbs
    services.chrome.setBreadcrumbs([
      { text: 'My App', href: '/' }
    ]);

    // Fetch initial data
    services.http.get('/api/my-data').then(setData);
  }, [services]);

  return (
    <EuiPage restrictWidth="1200px">
      <EuiPageBody>
        <EuiPageHeader>
          <EuiTitle size="l">
            <h1>My Application</h1>
          </EuiTitle>
        </EuiPageHeader>
        <EuiPageContent>
          <DataTable data={data} />
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
```

## Resources

- [OUI Component Documentation](https://oui.opensearch.org/)
- [React Documentation](https://reactjs.org/docs)
- [OpenSearch Dashboards Plugin Development](plugins/README.md)
- [Chrome Service Documentation](../src/core/public/chrome/README.md)
- [State Management Patterns](../src/plugins/opensearch_dashboards_react/public/state_management/README.md)

## Next Steps

- Explore the [Plugin Development Guide](plugins/README.md) for creating full plugins
- Review [Data Services](onboarding/data_services_api_patterns.md) for data fetching and manipulation
- Learn about [Saved Objects](saved_objects/README.md) for persistent storage
- Understand Security and Authentication patterns (covered in [Advanced Topics](onboarding/advanced_topics.md))
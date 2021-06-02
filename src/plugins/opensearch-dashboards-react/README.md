# `opensearch-dashboards-react`

Tools for building React applications in OpenSearch Dashboards.

## Context

You can create React context that holds Core or plugin services that your plugin depends on.

```ts
import { createOpenSearchDashboardsReactContext } from 'opensearch-dashboards-react';

class MyPlugin {
  start(core, plugins) {
    const context = createOpenSearchDashboardsReactContext({ ...core, ...plugins });
  }
}
```

You may also want to be explicit about services you depend on.

```ts
import { createOpenSearchDashboardsReactContext } from 'opensearch-dashboards-react';

class MyPlugin {
  start({ notifications, overlays }, { embeddable }) {
    const context = createOpenSearchDashboardsReactContext({ notifications, overlays, embeddable });
  }
}
```

Wrap your React application in the created context.

```jsx
<context.Provider>
  <OpenSearchDashboardsApplication />
</context.Provider>
```

Or use already pre-created `<OpenSearchDashboardsContextProvider>` component.

```jsx
import { OpenSearchDashboardsContextProvider } from 'opensearch-dashboards-react';

<OpenSearchDashboardsContextProvider services={{ ...core, ...plugins }}>
  <OpenSearchDashboardsApplication />
</OpenSearchDashboardsContextProvider>

<OpenSearchDashboardsContextProvider services={{ notifications, overlays, embeddable }}>
  <OpenSearchDashboardsApplication />
</OpenSearchDashboardsContextProvider>
```

## Accessing context

Using `useOpenSearchDashboards` hook.

```tsx
import { useOpenSearchDashboards } from 'opensearch-dashboards-react';

const Demo = () => {
  const opensearchDashboards = useOpenSearchDashboards();
  return <div>{opensearchDashboards.services.uiSettings.get('theme:darkMode') ? 'dark' : 'light'}</div>;
};
```

Using `withOpenSearchDashboards()` higher order component.

```tsx
import { withOpenSearchDashboards } from 'opensearch-dashboards-react';

const Demo = ({ opensearchDashboards }) => {
  return <div>{opensearchDashboards.services.uiSettings.get('theme:darkMode') ? 'dark' : 'light'}</div>;
};

export default withOpenSearchDashboards(Demo);
```

Using `<UseOpenSearchDashboards>` render prop.

```tsx
import { UseOpenSearchDashboards } from 'opensearch-dashboards-react';

const Demo = () => {
  return (
    <UseOpenSearchDashboards>
      {(opensearchDashboards) => <div>{opensearchDashboards.services.uiSettings.get('theme:darkMode') ? 'dark' : 'light'}</div>}
    </UseOpenSearchDashboards>
  );
};
```

## `uiSettings` service

Wrappers around Core's `uiSettings` service.

### `useUiSetting` hook

`useUiSetting` synchronously returns the latest setting from `CoreStart['uiSettings']` service.

```tsx
import { useUiSetting } from 'opensearch-dashboards-react';

const Demo = () => {
  const darkMode = useUiSetting<boolean>('theme:darkMode');
  return <div>{darkMode ? 'dark' : 'light'}</div>;
};
```

#### Reference

```tsx
useUiSetting<T>(key: string, defaultValue: T): T;
```

### `useUiSetting$` hook

`useUiSetting$` synchronously returns the latest setting from `CoreStart['uiSettings']` service and
subscribes to changes, re-rendering your component with latest values.

```tsx
import { useUiSetting$ } from 'opensearch-dashboards-react';

const Demo = () => {
  const [darkMode] = useUiSetting$<boolean>('theme:darkMode');
  return <div>{darkMode ? 'dark' : 'light'}</div>;
};
```

#### Reference

```tsx
useUiSetting$<T>(key: string, defaultValue: T): [T, (newValue: T) => void];
```

## `overlays` service

Wrapper around Core's `overlays` service, allows you to display React modals and flyouts
directly without having to use `react-dom` library to mount to DOM nodes.

```tsx
import { createOpenSearchDashboardsReactContext } from 'opensearch-dashboards-react';

class MyPlugin {
  start(core) {
    const {
      value: { overlays },
    } = createOpenSearchDashboardsReactContext(core);

    overlays.openModal(<div>Hello world!</div>);
  }
}
```

- `overlays.openModal` &mdash; opens modal window.
- `overlays.openFlyout` &mdash; opens right side panel.

You can access `overlays` service through React context.

```tsx
const Demo = () => {
  const { overlays } = useOpenSearchDashboards();
  useEffect(() => {
    overlays.openModal(<div>Oooops! {errorMessage}</div>);
  }, [errorMessage]);
};
```

## `notifications` service

Wrapper around Core's `notifications` service, allows you to render React elements
directly without having to use `react-dom` library to mount to DOM nodes.

```tsx
import { createOpenSearchDashboardsReactContext } from 'opensearch-dashboards-react';

class MyPlugin {
  start(core) {
    const {
      value: { notifications },
    } = createOpenSearchDashboardsReactContext(core);

    notifications.toasts.show({
      title: <div>Hello</div>,
      body: <div>world!</div>,
    });
  }
}
```

- `notifications.toasts.show()` &mdash; show generic toast message.
- `notifications.toasts.success()` &mdash; show positive toast message.
- `notifications.toasts.warning()` &mdash; show warning toast message.
- `notifications.toasts.danger()` &mdash; show error toast message.

You can access `notifications` service through React context.

```tsx
const Demo = () => {
  const { notifications } = useOpenSearchDashboards();
  useEffect(() => {
    notifications.toasts.danger({
      title: 'Oooops!',
      body: errorMessage,
    });
  }, [errorMessage]);
};
```

## RedirectAppLinks

Utility component that will intercept click events on children anchor (`<a>`) elements to call
`application.navigateToUrl` with the link's href. This will trigger SPA friendly navigation
when the link points to a valid OpenSearch Dashboards app.

```tsx
<RedirectAppLinks application={application}>
  <a href="/base-path/app/another-app/some-path">Go to another-app</a>
</RedirectAppLinks>
```

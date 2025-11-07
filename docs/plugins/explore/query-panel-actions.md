# Query Panel Actions Registry

# 1. Introduction

There is a way to enhance the explore's query panel by adding custom buttons (which we are calling "actions"). This doc will go into details into how to use that feature.

**Note:** this is an experimental feature, and is subject to change at any time in the future.

# 2. Data Plugin Setup API

Within the [Explore Plugin's setup method](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/plugins/explore/public/types.ts) we expose a property called `queryPanelActionsRegistry`. This exposes a `register()` method that has the following interface:

# 3. Query Panel Actions Registry Setup Interface

```ts
export interface QueryPanelActionsRegistryServiceSetup {
  /**
   * Register an action or a list of actions
   * Supports both button actions and flyout actions
   * @param actionConfig
   */
  register: (actionConfig: QueryPanelActionConfig | QueryPanelActionConfig[]) => void;
}

/**
 * Button action configuration (simple onClick behavior)
 */
export interface ButtonActionConfig {
  id: string;
  actionType: 'button';
  order: number;
  getIsEnabled?(deps: QueryPanelActionDependencies): boolean;
  getLabel(deps: QueryPanelActionDependencies): string;
  getIcon?(deps: QueryPanelActionDependencies): IconType;
  onClick(deps: QueryPanelActionDependencies): void;
}

/**
 * Flyout action configuration (renders React component in flyout)
 */
export interface FlyoutActionConfig {
  id: string;
  actionType: 'flyout';
  order: number;
  getIsEnabled?(deps: QueryPanelActionDependencies): boolean;
  getLabel(deps: QueryPanelActionDependencies): string;
  getIcon?(deps: QueryPanelActionDependencies): IconType;
  component: React.ComponentType<FlyoutComponentProps>;
  onFlyoutOpen?(deps: QueryPanelActionDependencies): void;
}

type QueryPanelActionConfig = ButtonActionConfig | FlyoutActionConfig;
```

The `register()` method either accepts a single `actionConfig` or an array of `actionConfig`. Actions can be either:
- **Button actions**: Execute an onClick callback (e.g., navigate to another page)
- **Flyout actions**: Render a React component in an inline flyout panel

Within each config, there are several methods that give you the `QueryPanelActionDependencies`, which you can use to conditionally render specific things:

```ts
export interface QueryPanelActionDependencies {
  /**
   * Last executed query (includes query string, language, and dataset)
   */
  query: QueryWithQueryAsString;
  /**
   * Query execution status (loading, success, error, etc.)
   */
  resultStatus: QueryResultStatus;
  /**
   * Current query string in the editor (may differ from executed query)
   */
  queryInEditor: string;
}
```

**Important:** Both `query.query` and `queryInEditor` are **already transformed** with the `source = <dataset>` clause added by the explore plugin. External plugins receive ready-to-execute queries and do NOT need to perform any transformation.

**Note:** The `query` object includes:
- `query.query`: The query string (pre-transformed with source clause)
- `query.language`: The query language (PPL, SQL, etc.)
- `query.dataset`: The selected dataset/index pattern (includes title, dataSource, signalType, etc.)

# 4. Examples

## Button Action Example

Here is an example of a button action that navigates to another page:

```tsx
export class ExamplePlugin {
  public setup(
    core: CoreSetup,
    { explore }: ExamplePluginSetupDependencies
  ) {
    explore.queryPanelActionsRegistry.register({
      id: 'create-monitor',
      actionType: 'button', // Specify button action
      order: 1,
      getIsEnabled: (deps) => deps.resultStatus.status === QueryExecutionStatus.READY,
      getLabel: () => 'Create monitor',
      getIcon: () => 'bell',
      onClick: (deps) => {
        // Navigate to monitor page with query
        application.navigateToApp('monitor', {
          path: `/create?query=${encodeURIComponent(deps.queryInEditor)}`
        });
      }
    });
  }
}
```

## Flyout Action Example

Here is an example of a flyout action that renders an inline form:

```tsx
import React from 'react';
import { EuiFlyout, EuiFlyoutHeader, EuiFlyoutBody, EuiTitle } from '@elastic/eui';

// Define your flyout component
const CreateMonitorFlyout: React.FC<FlyoutComponentProps> = ({
  closeFlyout,
  dependencies,
  services,
}) => {
  return (
    <EuiFlyout onClose={closeFlyout} size="m">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2>Create Monitor</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        {/* queryInEditor already includes source clause, ready to execute */}
        <p>Query: {dependencies.queryInEditor}</p>
        <p>Dataset: {dependencies.query.dataset?.title}</p>
        <p>Language: {dependencies.query.language}</p>
        {/* Your form components here */}
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};

export class ExamplePlugin {
  public setup(
    core: CoreSetup,
    { explore }: ExamplePluginSetupDependencies
  ) {
    explore.queryPanelActionsRegistry.register({
      id: 'create-monitor-flyout',
      actionType: 'flyout', // Specify flyout action
      order: 2,
      getIsEnabled: (deps) => deps.resultStatus.status === QueryExecutionStatus.READY,
      getLabel: () => 'Create monitor (flyout)',
      getIcon: () => 'bell',
      component: CreateMonitorFlyout, // Pass your flyout component
      onFlyoutOpen: (deps) => {
        // Optional: Log or perform actions when flyout opens
        console.log('Opening create monitor flyout');
      }
    });
  }
}

export const createQueryEditorExtensionConfig = (): QueryEditorExtensionConfig => {
  return {
    id: 'example-plugin-extension',
    order: 1,
    isEnabled$: (dependencies: QueryEditorExtensionDependencies) => {
      // render only for SQL language
      return new BehaviorSubject(dependencies.language === 'SQL');
    },
    getBanner: (dependencies: QueryEditorExtensionDependencies) => {
      return (
        <EuiCallOut
          title="This is such a cool feature"
          iconType={'iInCircle'}
        >
          What a cool way to enhance the user experience
        </EuiCallOut>
      )
    },
    getActionBarButtons: (dependencies: QueryEditorExtensionDependencies) => {
      return (
        <EuiFlexGroup direction="row" justifyContent="flexStart">
          <EuiFlexItem grow={false}>
            <EuiSmallButton>Btn 1</EuiSmallButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSmallButton>Btn 2</EuiSmallButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      )
    }
  }
}
```

![Alt text](./resources/query_panel_actions.png)

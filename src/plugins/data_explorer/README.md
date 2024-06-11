# Data Explorer

## Overview

Data Explorer is an integral enhancement of the OpenSearch Dashboards that seeks to consolidate various data exploration facets into a unified platform. Built to provide an efficient data exploration experience, Data Explorer merges capabilities of different applications like Discover, Visbuilder, and Event Analytics into a singular platform.

## Key Features

1. **Unified Data Exploration**: Data Explorer acts as a consolidated platform for all data exploration tasks, aiming to provide users with a seamless and efficient environment.
2. **Extensibility**: Provides an architecture that allows existing exploration apps to migrate with minimal changes.
3. **Shared Utilities**: Offers components and utilities that can be shared across different views.

## Architecture and Integration

Data Explorer, at its core, is a shell for data exploration views. Here's a breakdown of the architecture and how it manages responsibilities:

### Data Explorer Responsibilities:

1. **Data Source**: Acts as the central point for the data source being explored.
2. **View Registry**: Allows apps to register themselves as views and manages their display based on user selection.
3. **State Management**: Provides shared state management and hooks for underlying apps to register their state reducers.
4. **Shared Utilities**: Contains components and utilities that can be reused by various views. 

### View Responsibilities:

1. **Metadata Storage**: Handles the logic for storing metadata and its retrieval (Saved objects).
2. **Data Fetching**: Manages the logic for fetching data from the data source.
3. **View specific state management**: Handles view-specific state management and hooks into Data Explorer's state management.
4. **Nav Options & Search/Query Bar**: Manages the navigation options, time filter, and search bar.
5. **View Specific Logic**: Contains view-specific rendering and application logic.
6. **Embeddables**: Responsible for registering their embeddables.

### Migrating Existing Applications:

Existing applications can migrate their data exploration views to Data Explorer. Such migrations involve:

1. Registering the application as a view.
2. Using Data Explorer's state management and data source.
3. Modifying routes to utilize Data Explorer's routes.
4. Adapting the UI to match Data Explorer's panel and canvas components.

#### Routing:

Existing routes for each view are expected to redirect to new routes prefixed with `/data_explorer`. E.g., existing Discover route will redirect to `/data_explorer/discover`.

### View Registry:

For an application to be registered as a view within Data Explorer, it needs to adhere to the following data model:

```ts
interface ViewDefinition<T = any> {
  readonly id: string;
  readonly title: string;
  readonly ui?: {
    defaults: DefaultViewState | (() => DefaultViewState) | (() => Promise<DefaultViewState>);
    slice: Slice<T>;
  };
  readonly Canvas: LazyExoticComponent<(props: ViewProps) => React.ReactElement>;
  readonly Panel: LazyExoticComponent<(props: ViewProps) => React.ReactElement>;
  readonly Context: LazyExoticComponent<
    (props: React.PropsWithChildren<ViewProps>) => React.ReactElement
  >;
  readonly defaultPath: string;
  readonly appExtentions: {
    savedObject: {
      docTypes: [string];
      toListItem: (obj: { id: string; title: string }) => ViewListItem;
    };
  };
  readonly shouldShow?: (state: any) => boolean;
}
```

---

Original proposal: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4165

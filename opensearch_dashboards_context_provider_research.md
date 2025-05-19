# OpenSearchDashboardsContextProvider Research Summary

## Overview
The OpenSearchDashboardsContextProvider is a React context provider that enables components to access services without using Redux. This pattern is used consistently across vis_builder and data_explorer plugins.

## Architecture Pattern

### 1. Provider Setup (Application Level)
Both vis_builder and data_explorer follow the same pattern:

```tsx
// Application entry point
<Router history={history}>
  <OpenSearchDashboardsContextProvider services={services}>
    <ReduxProvider store={store}>
      {/* App components */}
    </ReduxProvider>
  </OpenSearchDashboardsContextProvider>
</Router>
```

**Key Points:**
- OpenSearchDashboardsContextProvider wraps the entire application
- Services are passed as props to the provider
- Redux store is nested inside the context provider
- This allows any component to access services via useOpenSearchDashboards hook

### 2. Service Access in Components
Components access services using the `useOpenSearchDashboards` hook:

```tsx
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { VisBuilderServices } from '../../types';

const MyComponent = () => {
  const { services } = useOpenSearchDashboards<VisBuilderServices>();
  const { data, uiSettings, overlays } = services;
  
  // Use services directly without Redux
};
```

**Key Points:**
- No Redux selectors needed for services
- Type-safe access with service interface generics
- Direct access to all services (data, uiSettings, overlays, etc.)
- Services are available throughout the component tree

### 3. Current Explore Plugin Status
The explore plugin already has the provider setup correctly:

```tsx
// src/plugins/explore/public/application/index.tsx (lines 40-41)
<OpenSearchDashboardsContextProvider services={services}>
  <ReduxProvider store={store}>
```

However, 18 components are still accessing `state.services` which no longer exists in Redux.

## Problem Analysis

### Current Issue
Components are using Redux selectors to access services:
```tsx
const services = useSelector((state: any) => state.services); // ❌ Undefined
```

### Solution
Replace with context hook:
```tsx
const { services } = useOpenSearchDashboards<ExploreServices>(); // ✅ Works
```

## Implementation Strategy

### 1. Replace Redux Service Access
For each of the 18 components accessing `state.services`:

**Before:**
```tsx
import { useSelector } from 'react-redux';

const MyComponent = () => {
  const services = useSelector((state: any) => state.services);
  // ...
};
```

**After:**
```tsx
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';

const MyComponent = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  // ...
};
```

### 2. Benefits of This Approach
- **Consistent with other plugins**: vis_builder and data_explorer use this pattern
- **Type safety**: Generic type parameter provides proper TypeScript support
- **Performance**: No Redux re-renders for service access
- **Cleaner architecture**: Services separate from application state
- **Future-proof**: Aligns with OpenSearch Dashboards patterns

### 3. Files Requiring Updates
Based on search results, these files access `state.services`:

1. `src/plugins/explore/public/application/components/tab_content.tsx`
2. `src/plugins/explore/public/application/components/logs_tab/index.tsx`
3. `src/plugins/explore/public/application/utils/hooks/use_tab_data.ts`
4. `src/plugins/explore/public/application/components/sidebar_wrapper.tsx`
5. `src/plugins/explore/public/application/components/explore_canvas.tsx`
6. `src/plugins/explore/public/application/components/query_panel.tsx`
7. `src/plugins/explore/public/application/legacy/discover/application/view_components/context/index.tsx`
8. `src/plugins/explore/public/application/legacy/discover/application/view_components/canvas/discover_chart_container.tsx`
9. `src/plugins/explore/public/application/legacy/discover/application/view_components/canvas/discover_table.tsx`
10. `src/plugins/explore/public/application/legacy/discover/application/view_components/canvas/index.tsx`
11. Plus 8 more in actions and selectors

## Next Steps
1. Update all components to use `useOpenSearchDashboards` hook instead of Redux selectors
2. Remove `selectServicesState` from selectors
3. Clean up unused imports across the plugin
4. Test that all functionality works with context-based service access
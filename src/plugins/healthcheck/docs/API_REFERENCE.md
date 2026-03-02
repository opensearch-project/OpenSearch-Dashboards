# API Reference - Health Check Plugin

## Overview

This documentation describes the APIs and interfaces available in the Health Check plugin for developers who need to integrate with or extend the functionality.

## Client APIs (Frontend)

### Core Services

#### getHealthCheck()

Gets the main health check service.

```typescript
import { getHealthCheck } from '../dashboards_services';

const { status$, client, getConfig } = getHealthCheck();
```

**Returns:**

- `status$`: Current status observable
- `client`: HTTP client for backend communication
- `getConfig`: Function to get configuration

#### getCore()

Access to OpenSearch Dashboards core services.

```typescript
import { getCore } from '../dashboards_services';

const core = getCore();
core.chrome.setBreadcrumbs([...]);
```

### State Management

#### Status Observable

```typescript
import { useObservable } from 'react-use';

const { status, checks } = useObservable(status$, status$.getValue());
```

**State Structure:**

```typescript
interface HealthStatus {
  status: 'green' | 'yellow' | 'red' | 'gray';
  checks: CheckInfo[];
  timestamp: number;
}

interface CheckInfo {
  id: string;
  name: string;
  status: 'success' | 'warning' | 'danger' | 'subdued';
  message?: string;
  details?: any;
  timestamp: number;
}
```

### Utility Functions

#### mapTaskStatusToHealthColor()

Maps health status to UI color.

```typescript
import { mapTaskStatusToHealthColor } from './services/health';

const healthColor = mapTaskStatusToHealthColor('green'); // returns 'success'
```

**Status Mapping:**

- `green` → `success`
- `yellow` → `warning`
- `red` → `danger`
- `gray` → `subdued`

## Reusable Components

### HealthIcon

Component for displaying status icons.

```typescript
import { HealthIcon } from './components/health_icon';

<HealthIcon status="success" size="m" />;
```

**Props:**

- `status`: `'success' | 'warning' | 'danger' | 'subdued'`
- `size`: `'s' | 'm' | 'l'`
- `className?`: optional string

### ChecksTable

Table for displaying health checks.

```typescript
import { ChecksTable } from './components/table/checks_table';

<ChecksTable checks={checks} onRowClick={(check) => console.log(check)} />;
```

**Props:**

- `checks`: Array of `CheckInfo`
- `onRowClick?`: Callback for row clicks
- `loading?`: Loading state
- `className?`: Optional CSS class

### ButtonExportHealthCheck

Button for exporting health data.

```typescript
import { ButtonExportHealthCheck } from './components/export_checks';

<ButtonExportHealthCheck data={{ status, checks }} filename="health-check-export" />;
```

**Props:**

- `data`: Object with status and checks

## Custom Hooks

### useAsyncAction

Hook for handling asynchronous actions.

```typescript
import { useAsyncAction } from './components/hook/use_async_action';

const { run, running, error, data } = useAsyncAction(run);
```

**Returns:**

- `runAction`: Function to execute the action
- `loading`: Loading state
- `error`: Error if it occurs
- `data`: Returned data

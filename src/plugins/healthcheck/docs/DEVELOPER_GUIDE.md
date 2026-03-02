# Developer Guide - Health Check Plugin

## Technical Description

The Health Check Plugin is a Wazuh dashboard plugin that implements an interface for monitoring system health. It's built using the OpenSearch Dashboards plugin architecture and follows React and TypeScript development best practices.

## Plugin Architecture

### Project Structure

```
healthcheck/
├── common/                    # Shared code between client and server
│   └── index.ts              # Common constants and types
├── public/                    # Client-side code
│   ├── application.tsx       # Application entry point
│   ├── plugin.ts            # Client plugin definition
│   ├── types.ts             # TypeScript types
│   ├── constants.ts         # Client constants
│   ├── dashboards_services.ts # Dashboard services
│   ├── components/          # React components
├── server/                   # Server-side code
│   ├── plugin.ts           # Server plugin definition
│   ├── types.ts            # Server types
│   └── routes/             # API routes
```

### Main Components

#### Client Plugin (public/plugin.ts)

- **Purpose**: Registers the application in the dashboard
- **Responsibilities**:
  - Register application in navigation menu
  - Configure dependencies
  - Initialize services

#### Server Plugin (server/plugin.ts)

- **Purpose**: Configures server-side APIs
- **Responsibilities**:
  - Define HTTP routes
  - Configure logging
  - Handle server logic

#### Main Component (components/healthcheck.tsx)

- **Purpose**: Root application component
- **Responsibilities**:
  - Render main interface
  - Manage application state
  - Coordinate between subcomponents

## Project Setup

### Dependencies

#### Required Dependencies

- `navigation`: For navigation menu integration
- `opensearchDashboardsUtils`: Framework utilities

## Development

### Component Structure

#### HealthCheck (Main Component)

```typescript
export const HealthCheck = () => {
  // Breadcrumbs and title configuration
  // Observable state management
  // Subcomponent rendering
};
```

#### ChecksTable

- Renders the checks table
- Handles user interaction
- Implements filtering

#### TitleView

- Shows overall system status
- Renders status icons
- Provides checks summary

#### ButtonExportHealthCheck

- Implements export functionality
- Handles JSON file downloads
- Formats data for export

### Services

#### Health Service (services/health.ts)

```typescript
const taskStatusColorMapping = {
  green: 'success',
  yellow: 'warning',
  red: 'danger',
  gray: 'subdued',
};

export function mapTaskStatusToHealthColor(status: TaskInfo['result']) {
  return (status && taskStatusColorMapping[status]) || taskStatusColorMapping.gray;
}
```

#### Time Service (services/time.ts)

- Timestamp formatting
- Relative time calculations
- Date and time utilities

### State Management

The plugin uses RxJS Observables for reactive state management:

```typescript
const { status$, client, getConfig } = getHealthCheck();
const { status, checks } = useObservable(status$, status$.getValue());
```

#### Main State

- `status`: Overall system status
- `checks`: Array of individual checks
- `client`: Client for backend communication

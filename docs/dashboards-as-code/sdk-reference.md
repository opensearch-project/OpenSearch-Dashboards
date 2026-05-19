# SDK Reference

The `@osd/dashboards-sdk` package provides a fluent TypeScript builder API for constructing dashboard resources programmatically.

## Installation

```bash
npm install @osd/dashboards-sdk
# or
yarn add @osd/dashboards-sdk
```

## Exports

```typescript
// Builders
import { Dashboard, Panel, Query, DataSource, Variable } from '@osd/dashboards-sdk';

// Output
import { Serializer, Validator } from '@osd/dashboards-sdk';

// Types
import type {
  DashboardDefinition,
  PanelDefinition,
  QueryDefinition,
  GridPosition,
  VisualizationType,
  QueryLanguage,
} from '@osd/dashboards-sdk';
```

---

## Dashboard

Create and configure dashboard resources.

```typescript
const dashboard = Dashboard.create('my-dashboard')
  .title('My Dashboard')
  .description('A monitoring dashboard')
  .labels({ team: 'platform', env: 'production' })
  .annotation('source', 'osdctl')
  .timeRange('now-24h', 'now')
  .refreshInterval('30s')
  .addPanel(panel)
  .addDataSource(dataSource)
  .addVariable(variable);
```

| Method | Parameters | Description |
|--------|-----------|-------------|
| `Dashboard.create(name)` | `name: string` | Static factory, returns a new builder |
| `.title(title)` | `title: string` | Set display title |
| `.description(desc)` | `desc: string` | Set description |
| `.labels(labels)` | `Record<string, string>` | Merge metadata labels |
| `.annotation(key, value)` | `key: string, value: string` | Add a single annotation |
| `.timeRange(from, to)` | `from: string, to: string` | Set default time range |
| `.refreshInterval(interval)` | `interval: string` | Set auto-refresh interval |
| `.addPanel(panel)` | `Panel` | Add a panel |
| `.addDataSource(ds)` | `DataSource` | Add a data source |
| `.addVariable(variable)` | `Variable` | Add a template variable |
| `.build()` | | Returns `DashboardDefinition` |
| `.toJSON(filepath?)` | `filepath?: string` | Serialize to JSON string (optionally write to file) |
| `.toYAML(filepath?)` | `filepath?: string` | Serialize to YAML string (optionally write to file) |

---

## Panel

Create visualization panels within a dashboard.

```typescript
const panel = Panel.create('error-rate')
  .title('Error Rate')
  .visualization('line')
  .gridPosition({ x: 0, y: 0, w: 24, h: 12 })
  .query(Query.dql('level: error'));
```

| Method | Parameters | Description |
|--------|-----------|-------------|
| `Panel.create(name)` | `name: string` | Static factory |
| `.title(title)` | `title: string` | Panel display title |
| `.visualization(type)` | `VisualizationType` | Visualization type (`line`, `bar`, `metric`, `pie`, `area`, `table`, `markdown`, `vega`) |
| `.gridPosition(pos)` | `GridPosition` | Position and size: `{ x, y, w, h }` |
| `.query(query)` | `QueryDefinition` | Data query for this panel |
| `.build()` | | Returns `PanelDefinition` |

---

## Query

Build data queries in different languages.

```typescript
// DQL (Dashboards Query Language)
const q1 = Query.dql('status >= 500');

// PPL (Piped Processing Language)
const q2 = Query.ppl('source = logs | stats count() by host');

// SQL
const q3 = Query.sql('SELECT host, count(*) FROM logs GROUP BY host');

// Custom
const q4 = Query.create('lucene', 'level:error AND service:api');
```

| Method | Parameters | Description |
|--------|-----------|-------------|
| `Query.dql(query)` | `query: string` | Create a DQL query |
| `Query.ppl(query)` | `query: string` | Create a PPL query |
| `Query.sql(query)` | `query: string` | Create a SQL query |
| `Query.create(language, query)` | `language: string, query: string` | Custom query language |

---

## DataSource

Configure data source connections.

```typescript
const ds = DataSource.create('my-opensearch')
  .title('Production OpenSearch')
  .endpoint('https://opensearch.example.com:9200');
```

---

## Variable

Define template variables for dashboard input controls.

```typescript
const variable = Variable.create('environment')
  .label('Environment')
  .type('custom')
  .options(['development', 'staging', 'production'])
  .defaultValue('production');
```

---

## Serializer

Convert definitions to JSON or YAML.

```typescript
import { Serializer } from '@osd/dashboards-sdk';

const definition = dashboard.build();

// To string
const json = Serializer.toJSON(definition);
const yaml = Serializer.toYAML(definition);

// To file
Serializer.toJSON(definition, './output/dashboard.json');
Serializer.toYAML(definition, './output/dashboard.yaml');
```

---

## Validator

Client-side schema validation (no server required).

```typescript
import { Validator } from '@osd/dashboards-sdk';

const definition = dashboard.build();
const errors = Validator.validate(definition);

if (errors.length > 0) {
  errors.forEach(err => console.error(`${err.path}: ${err.message}`));
}
```

---

## Generated API Types

The SDK also exports typed interfaces generated from the OpenAPI spec:

```typescript
import type {
  BulkApplyRequest,
  BulkApplyResponse,
  DiffRequest,
  DiffResponse,
  ValidateRequest,
  ValidateResponse,
  SavedObject,
} from '@osd/dashboards-sdk';
```

These types match the server-side API contracts exactly. See the [API Reference](api-reference.md) for endpoint details.

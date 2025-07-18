# Data Views API Contract

## Overview

This document describes the API contract and relationships between Index Patterns, Data Views, and Datasets in OpenSearch Dashboards. These concepts represent the evolution of data source abstraction, with each serving specific roles in the system architecture while maintaining backward compatibility with existing OpenSearch Dashboards installations.

## Conceptual Hierarchy

```
DataView (Superclass - Future Architecture)
├── Index Pattern (Current Implementation using 'index-pattern' saved objects)
└── Dataset (Serialized Form for BWC and Query State)
```

### Terminology Evolution and BWC Strategy

- **Index Pattern**: Original concept for defining data source patterns, currently implemented as the DataView class but stored as `'index-pattern'` saved objects for backward compatibility
- **Data View**: Intended superclass architecture that will encompass Index Patterns and extend to support multiple data source types. Currently implemented as a single class that handles index patterns but designed for future extension
- **Dataset**: Lightweight, serializable representation of a Data View used in query objects and URL state for backward compatibility

### Backward Compatibility Considerations

The current implementation maintains full backward compatibility by:

1. **Saved Object Type**: Data Views continue to use `'index-pattern'` as the saved object type, ensuring compatibility with existing OSD installations
2. **API Surface**: All existing Index Pattern APIs remain functional through the DataView class
3. **Query Integration**: Dataset serialization preserves existing query object structure
4. **Migration Path**: Future DataView extensions can be added without breaking existing functionality

## Core Interfaces

### DataView Interface

The `DataView` class serves as the superclass for all data source representations:

```typescript
interface IDataView {
  id?: string;
  title: string;
  displayName?: string;
  description?: string;
  type?: string;
  timeFieldName?: string;
  fields: IDataViewFieldList;
  dataSourceRef?: DataViewSavedObjectReference;
  
  /**
   * Converts a DataView to a serializable Dataset object suitable for storage in Redux
   * Maps dataSourceRef and includes only essential properties for backward compatibility
   */
  toDataset?(): Dataset;
}

class DataView implements IDataView {
  // Full implementation with field management, formatting, etc.
  public async toDataset(): Promise<Dataset>;
}
```

### Dataset Interface (Serialized Form)

The `Dataset` interface represents the serialized form of a DataView, used in query objects:

```typescript
interface Dataset extends BaseDataset {
  /** Unique identifier for the dataset */
  id: string;
  /** Human-readable name of the dataset that is used to query */
  title: string;
  /** The type of the dataset (INDEX_PATTERN, S3, etc.) */
  type: string;
  /** Optional name of the field used for time-based operations */
  timeFieldName?: string;
  /** Optional language to default to from the language selector */
  language?: string;
  /** Optional reference to the data source */
  dataSource?: DataSource;
  /** Optional parameter to indicate if the dataset is from a remote cluster */
  isRemoteDataset?: boolean;
}
```

### DataSource Interface

Represents external data sources (clusters, S3, etc.):

```typescript
interface DataSource {
  /** Unique identifier for the data source */
  id?: string;
  /** Human-readable name of the data source */
  title: string;
  /** The engine type of the data source (OpenSearch, S3_GLUE, etc.) */
  type: string;
  /** Optional metadata for the data source */
  meta?: DataSourceMeta;
}
```

### DataViewSavedObjectReference

References to saved data source objects:

```typescript
interface DataViewSavedObjectReference {
  id: string;
  type: string;  // Always 'data-source' for saved object references
  name?: string; // Title of the data source
}
```

## Relationship Mapping

### Index Pattern → Data View Evolution

Index Patterns were the original implementation, now subsumed under the Data View superclass:

```typescript
// Legacy Index Pattern (now part of DataView)
interface IndexPattern {
  id: string;
  title: string;
  timeFieldName?: string;
  fields: FieldList;
  // Limited to OpenSearch indices only
}

// Modern Data View (superclass)
interface DataView extends IndexPattern {
  type: string;  // INDEX_PATTERN, S3, etc.
  dataSourceRef?: DataViewSavedObjectReference;  // Multi-data source support
  // Extended functionality for multiple data source types
}
```

### Data View → Dataset Serialization

The `toDataset()` method converts a full DataView to a lightweight Dataset:

```typescript
class DataView {
  public async toDataset(): Promise<Dataset> {
    const defaultType = DEFAULT_DATA.SET_TYPES.INDEX_PATTERN;
    const dataSourceReference = this.dataSourceRef || (this as any).dataSource;

    let dataSource;
    if (dataSourceReference?.id) {
      // Fetch actual data source details
      const dataSourceSavedObject = await this.savedObjectsClient.get(
        dataSourceReference.type,
        dataSourceReference.id
      );
      const attributes = dataSourceSavedObject.attributes as any;
      dataSource = {
        id: dataSourceReference.id,
        title: attributes.title || dataSourceReference.id,
        type: attributes.dataSourceEngineType || 'OpenSearch',
      };
    }

    return {
      id: this.id || '',
      title: this.title,
      type: this.type || defaultType,
      timeFieldName: this.timeFieldName,
      dataSource,
    };
  }
}
```

## Field Mapping Examples

### OpenSearch Index Pattern

```typescript
// DataView (Full Object)
const dataView: DataView = {
  id: "aaf88e10-5e86-11f0-a5d2-cdd32f30059b",
  title: "opensearch_dashboards_sample_data_logs",
  type: "INDEX_PATTERN",
  timeFieldName: "timestamp",
  fields: [
    {
      name: "@timestamp",
      type: "date",
      searchable: true,
      aggregatable: true
    },
    {
      name: "clientip",
      type: "ip",
      searchable: true,
      aggregatable: true
    }
    // ... more fields
  ],
  dataSourceRef: {
    id: "73edf070-abd2-11ef-b7d4-f7ea19f347ff",
    type: "data-source",
    name: "cypress-test-os"
  }
};

// Dataset (Serialized Form)
const dataset: Dataset = {
  id: "aaf88e10-5e86-11f0-a5d2-cdd32f30059b",
  title: "opensearch_dashboards_sample_data_logs",
  type: "INDEX_PATTERN",
  timeFieldName: "timestamp",
  dataSource: {
    id: "73edf070-abd2-11ef-b7d4-f7ea19f347ff",
    title: "cypress-test-os",
    type: "OpenSearch"
  }
};
```

### S3 Data Source

```typescript
// DataView (Full Object)
const s3DataView: DataView = {
  id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003::mys3.defaultDb.table1",
  title: "mys3.defaultDb.table1",
  type: "S3",
  timeFieldName: "order_date",
  fields: [
    {
      name: "order_date",
      type: "date",
      searchable: true,
      aggregatable: true
    },
    {
      name: "customer_id",
      type: "string",
      searchable: true,
      aggregatable: true
    }
  ],
  dataSourceRef: {
    id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003",
    type: "S3_GLUE",
    name: "My S3 Connect"
  }
};

// Dataset (Serialized Form)
const s3Dataset: Dataset = {
  id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003::mys3.defaultDb.table1",
  title: "mys3.defaultDb.table1",
  type: "S3",
  timeFieldName: "order_date",
  isRemoteDataset: true,
  dataSource: {
    id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003",
    title: "My S3 Connect",
    type: "S3_GLUE"
  }
};
```

### Local Index Pattern (No Data Source)

```typescript
// DataView (Full Object)
const localDataView: DataView = {
  id: "local-pattern-456",
  title: "local_logs-*",
  type: "INDEX_PATTERN",
  timeFieldName: "@timestamp",
  fields: [...],
  dataSourceRef: undefined  // No external data source
};

// Dataset (Serialized Form)
const localDataset: Dataset = {
  id: "local-pattern-456",
  title: "local_logs-*",
  type: "INDEX_PATTERN",
  timeFieldName: "@timestamp",
  dataSource: undefined  // Local/default OpenSearch
};
```

## Backward Compatibility (BWC)

### Query Object Integration

The Dataset interface maintains backward compatibility in query objects:

```typescript
interface Query {
  query: string;
  language: string;
  dataset?: Dataset;  // Serialized DataView for BWC
}

// Usage in query state
const queryState = {
  query: "source = logs",
  language: "PPL",
  dataset: {
    id: "pattern-123",
    title: "logs-*",
    type: "INDEX_PATTERN",
    timeFieldName: "@timestamp"
  }
};
```

### Saved Object Structure and BWC

Data Views are stored as saved objects with type `'index-pattern'` to maintain backward compatibility with existing OpenSearch Dashboards installations:

```json
{
  "type": "index-pattern",
  "id": "aaf88e10-5e86-11f0-a5d2-cdd32f30059b",
  "attributes": {
    "title": "opensearch_dashboards_sample_data_logs",
    "timeFieldName": "timestamp",
    "fields": "[{\"name\":\"@timestamp\",\"type\":\"date\",...}]",
    "type": "INDEX_PATTERN"
  },
  "references": [
    {
      "id": "73edf070-abd2-11ef-b7d4-f7ea19f347ff",
      "name": "dataSource",
      "type": "data-source"
    }
  ]
}
```

**Key BWC Points:**

- Saved object type remains `'index-pattern'` (not `'data-view'`)
- Existing saved objects load seamlessly into the DataView class
- All legacy Index Pattern functionality preserved
- New multi-data source features added without breaking changes

## Data Source Resolution

### Reference Resolution Process

The DataView class resolves data source references at two key points:

1. **Constructor Initialization**: When a DataView is created with a `dataSourceRef`, it immediately attempts to resolve the reference
2. **Dataset Serialization**: The `toDataset()` method performs additional resolution for query state

```typescript
// Constructor resolution (happens during DataView creation)
constructor({ spec, savedObjectsClient, ... }: DataViewDeps) {
  // ... other initialization
  this.dataSourceRef = spec.dataSourceRef;
  
  // Immediately resolve data source reference if provided
  if (this.dataSourceRef?.id) {
    this.initializeDataSourceRef();  // Fetches data source saved object
  }
}

// Additional resolution during serialization
public async toDataset(): Promise<Dataset> {
  const dataSourceReference = this.dataSourceRef || (this as any).dataSource;
  
  if (dataSourceReference?.id) {
    // Re-fetch to ensure latest data source details
    const dataSourceSavedObject = await this.savedObjectsClient.get(
      dataSourceReference.type,
      dataSourceReference.id
    );
    // ... process attributes
  }
}
```

### Data Source Reference Lifecycle

1. **Saved Object Loading**: DataView loads with `dataSourceRef` from saved object references
2. **Constructor Resolution**: `initializeDataSourceRef()` fetches data source details and updates the reference
3. **Runtime Usage**: DataView uses resolved reference for display and operations
4. **Dataset Serialization**: `toDataset()` performs fresh resolution for query state consistency

### Multi-Data Source Support

Data Views support multiple data source types through the dataset type registration API provided by the query string manager's dataset service.

This means we cannot assume we know the type of the dataset being used.

## API Methods

### Core DataView Methods

```typescript
class DataView {
  // Convert to serializable form
  async toDataset(): Promise<Dataset>;
  
  // Get saved object representation
  getAsSavedObjectBody(): SavedObjectBody;
  
  // Get saved object references
  getSaveObjectReference(): DataViewSavedObjectReference[];
  
  // Field management
  getFieldByName(name: string): DataViewField | undefined;
  addScriptedField(name: string, script: string, fieldType?: string): Promise<void>;
  removeScriptedField(fieldName: string): void;
}
```

### Dataset Service Methods

```typescript
interface DatasetService {
  // Cache dataset as temporary index pattern
  cacheDataset(dataset: Dataset, services: IDataPluginServices): Promise<void>;
  
  // Get registered dataset types
  getType(type: string): DatasetTypeConfig | undefined;
  
  // Register new dataset type
  registerType(type: DatasetTypeConfig): void;
}
```

## Usage Patterns

### Component Integration

```typescript
// In React components
const handleDatasetSelect = async (dataView: DataView) => {
  const dataset = await dataView.toDataset();
  dispatch(setQueryState({
    ...currentQuery,
    dataset
  }));
};

// In query execution
const executeQuery = async (query: Query) => {
  if (query.dataset) {
    await datasetService.cacheDataset(query.dataset, services);
    // Query execution proceeds with cached index pattern
  }
};
```

### URL Serialization

Datasets are serialized in URLs for sharing and bookmarking:

```
_q=(dataset:(dataSource:(id:'73edf070-abd2-11ef-b7d4-f7ea19f347ff',title:'cypress-test-os',type:OpenSearch),id:'aaf88e10-5e86-11f0-a5d2-cdd32f30059b',timeFieldName:timestamp,title:'opensearch_dashboards_sample_data_logs',type:INDEX_PATTERN),language:PPL,query:'source = logs')
```

## Dataset Type Registration and Integration

### Pre-registered Dataset Types

The system comes with several dataset types already registered (as documented in [Understanding and Extending Discover](../discover/understand_and_extend_discover.md)):

```typescript
// Core dataset types registered by default
enum DatasetTypes {
  INDEX_PATTERN = 'INDEX_PATTERN',  // Traditional OpenSearch indices
  INDEX = 'INDEX',                  // Direct index access
  S3 = 'S3',                       // S3 data sources
  SQL_TABLE = 'SQL_TABLE'          // SQL-accessible tables
}
```

### Dataset Service Integration

The Dataset Service manages type registration and temporary index pattern creation:

```typescript
interface DatasetService {
  // Register new dataset types
  registerType(config: DatasetTypeConfig): void;
  
  // Cache dataset as temporary index pattern for BWC
  cacheDataset(dataset: Dataset, services: IDataPluginServices): Promise<void>;
  
  // Get registered type configuration
  getType(type: string): DatasetTypeConfig | undefined;
}
```

### Temporary Index Pattern Strategy

As detailed in the Discover documentation, the system uses temporary index patterns to maintain BWC:

1. **Dataset Selection**: User selects a dataset through the Dataset Explorer
2. **Temporary Pattern Creation**: System creates an in-memory index pattern from the dataset
3. **Caching**: Pattern is cached by dataset ID for session duration
4. **Query Execution**: Existing search infrastructure uses the temporary pattern seamlessly

This approach ensures that:

- No saved object write permissions are required
- Existing query and visualization components work unchanged
- Multi-data source support is transparent to legacy code

### Extension Points for New Data Sources

When adding new data sources, developers must:

1. **Register Dataset Type**: Define how the data source appears in the Dataset Explorer
2. **Implement Field Discovery**: Provide field mapping from external schemas to OpenSearch field types
3. **Configure Search Strategy**: Define how queries are executed against the data source
4. **Handle BWC**: Ensure temporary index patterns work correctly with existing UI components

## Future Architecture Considerations

### Planned DataView Refactoring

The current implementation creates multiple files and complexity that should be cleaned up:

1. **Consolidation**: Reduce file proliferation while maintaining API compatibility
2. **True Superclass**: Evolve DataView into a proper superclass with Index Pattern as a subclass
3. **BWC Preservation**: Ensure all changes maintain compatibility with existing OSD installations
4. **Saved Object Strategy**: Continue using `'index-pattern'` saved objects to avoid migration requirements

### Migration Strategy

Future refactoring should:

- Preserve all existing APIs and behaviors
- Maintain `'index-pattern'` saved object type
- Ensure seamless operation with both old and new OSD versions
- Provide clear extension points for new data source types

## Summary

The Data Views system provides a unified abstraction layer over Index Patterns while maintaining strict backward compatibility. This architecture supports:

- **Legacy Index Patterns**: Fully preserved functionality using `'index-pattern'` saved objects
- **Multi-Data Source**: Support for OpenSearch, S3, CloudWatch, and other data sources through dataset type registration
- **Backward Compatibility**: Dataset format and temporary index patterns preserve existing query object structure and UI behavior
- **Extensibility**: Plugin architecture for registering new dataset types without breaking existing functionality
- **Field Management**: Rich field metadata and formatting capabilities across all data source types
- **BWC Guarantee**: Full compatibility with existing OpenSearch Dashboards installations

The current implementation serves as both a working system and a foundation for future architectural improvements, ensuring that extensions can be made without disrupting existing deployments or requiring complex migrations.

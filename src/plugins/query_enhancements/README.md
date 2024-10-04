# Query Enhancements Plugin

The Query Enhancements plugin extends OpenSearch Dashboards' query capabilities by adding support for additional query languages and improving the search experience.

## Features

### Server-side Features

1. **Custom Search Strategies**: Adds support for PPL (Piped Processing Language) and SQL search strategies.
2. **Custom API Routes**: Defines new routes for query-related operations.
3. **OpenSearch Client Enhancement**: Creates a custom OpenSearch client with additional plugins.

### Client-side Features

1. **Language Support**: Adds support for PPL and SQL languages in the query editor.
2. **Query Assist**: Implements a query assist feature to help users construct queries.
3. **S3 Integration**: Adds support for querying S3 data sources.
4. **Enhanced Query Editor**: Provides an improved query editor with language-specific features.

## Setup

### Server-side Setup

The plugin sets up several components during the `setup` phase:

1. Registers PPL and SQL search strategies.
2. Sets up custom route handler contexts.
3. Defines plugin-specific routes.

Example usage in a plugin:

```typescript
class MyServerPlugin {
  setup(core, plugins) {
    // Access query enhancements features
    const { search } = plugins.data;
    // Use PPL or SQL search strategies
    const results = await search.search(request, { strategy: 'ppl' });
  }
}
```

### Client-side Setup
The plugin sets up several components during the setup phase:

1. Registers PPL and SQL language configurations.
2. Sets up query assist extension.
3. Registers S3 dataset type.

Example usage in a plugin:
```typescript
class MyClientPlugin {
  setup(core, plugins) {
    // Access query string manager
    const { queryString } = plugins.data.query;
    
    // Use PPL or SQL languages
    queryString.setQuery({
      language: 'PPL',
      query: 'source = my_index | where count > 100'
    });
  }
}
```

### Services
#### Query String Manager
The Query String Manager provides methods to manage and interact with queries:

- `setQuery(query: Query)`: Set the current query.
- `getQuery()`: Query: Get the current query.
- `getLanguageService()`: Access language-specific services.

#### Dataset Service
The Dataset Service allows interaction with different data sources:

- `registerType(typeConfig: DatasetTypeConfig)`: Register a new dataset type.
- `getType(type: string)`: DatasetTypeConfig: Get a registered dataset type.

#### Query Languages
##### PPL (Piped Processing Language)
PPL is a query language that uses a series of commands separated by pipes (|) to process and transform data.
Example PPL query:
```
source = my_index | where count > 100 | stats sum(price) by category
```

##### SQL
SQL support allows users to query data using standard SQL syntax.
Example SQL query:
```sql
SELECT category, SUM(price) FROM my_index WHERE count > 100 GROUP BY category
```
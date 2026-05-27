# Experimental: SQL Support in Explore

⚠️ **This feature is currently experimental and hidden behind a feature flag.**

## Enabling SQL Support

To enable SQL query support in Explore, add the following to your `opensearch_dashboards.yml`:

```yaml
explore.sqlSupport.enabled: true
```

## Usage

Once enabled, SQL will appear as a language option in the Explore query editor for logs datasets. You can use standard SQL syntax to query your data:

```sql
SELECT * FROM your_index WHERE status = 200 LIMIT 10
```

### Features

- **Language Toggle**: Switch between PPL and SQL in the query editor
- **Time Filtering**: Date picker automatically applies time range filters to SQL queries
- **Filter Buttons**: Click on field values to add SQL WHERE clauses
- **Multiple Tabs**: SQL support available in Logs, Visualization, and Statistics tabs

### Example Queries

```sql
-- Basic selection with filtering
SELECT timestamp, message, level FROM logs WHERE level = 'ERROR'

-- Aggregation queries
SELECT COUNT(*) as error_count FROM logs WHERE level = 'ERROR' GROUP BY host

-- Time-based queries (time filtering is applied automatically)
SELECT * FROM logs WHERE status >= 400 ORDER BY timestamp DESC LIMIT 100
```

## Current Limitations

- Only available in Explore for logs datasets
- This is an experimental feature and may change in future releases

## Troubleshooting

If SQL queries are not working as expected:

1. Verify the feature flag is enabled in your configuration
2. Ensure you're using a logs dataset in Explore
3. Check that your SQL syntax is valid for OpenSearch SQL
4. Review the OpenSearch logs for any query execution errors
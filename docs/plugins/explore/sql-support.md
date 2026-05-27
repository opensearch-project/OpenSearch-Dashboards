# Experimental: SQL Support in Explore

⚠️ **This feature is currently experimental and hidden behind a feature flag.**

## Prerequisites

**SQL in Explore requires an Analytics Engine (V3) data source.** When a
date picker range is active (the default), Explore wraps SQL queries in a
CTE for time filtering. This wrap relies on the Calcite-based unified query
pipeline available on Analytics Engine; the legacy V2 SQL plugin on standard
OpenSearch domains does not parse this construct, and SQL queries against
those domains will fail at execution time.

The SQL language toggle itself is exposed whenever the feature flag is enabled,
regardless of the dataset's engine type. Selecting SQL on a non-Analytics
Engine dataset will result in query failures.

## Enabling SQL Support

To enable SQL query support in Explore, add the following to your
`opensearch_dashboards.yml`:

```yaml
explore.sqlSupport.enabled: true
```

## Usage

Once enabled, SQL appears as a language option in the Explore query editor for
logs datasets. You can use standard SQL syntax to query your data:

```sql
SELECT * FROM your_index WHERE status = 200 LIMIT 10
```

### Features

- **Language Toggle**: Switch between PPL and SQL in the query editor
- **Time Filtering** (Analytics Engine only): Date picker automatically applies
  a time-range filter to SQL queries via a CTE that wraps the dataset's source
  table at scan time. This works for arbitrary SQL shapes including JOINs,
  UNIONs, and subqueries.
- **Multiple Tabs**: SQL support available in Logs, Visualization, and
  Statistics tabs

### Example Queries

```sql
-- Basic selection with filtering
SELECT timestamp, message, level FROM logs WHERE level = 'ERROR'

-- Aggregation queries
SELECT COUNT(*) as error_count FROM logs WHERE level = 'ERROR' GROUP BY host

-- Time-based queries (time filtering is applied automatically on AnalyticEngine)
SELECT * FROM logs WHERE status >= 400 ORDER BY timestamp DESC LIMIT 100

-- JOIN — on AnalyticEngine, the time filter applies to the dataset's table
-- only, not the joined one
SELECT a.message, b.code FROM logs a JOIN errors b ON a.id = b.log_id LIMIT 10
```

## Current Limitations

- The time-filter CTE wrap requires Analytics Engine (V3). On standard
  OpenSearch domains the wrapped query will not parse and execution will
  fail. Use Analytics Engine domains for SQL queries.
- Time-range filter injection is skipped when the user query already defines
  a CTE with the same name as the dataset's table (collision avoidance).
- Fully-qualified table references (e.g. `FROM "catalog"."schema"."logs"`)
  bypass the time-range CTE shadow; include time predicates manually for those
  queries.
- Filter pill buttons (click-to-filter on table values) are not enabled for
  SQL.
- Experimental feature; behavior and configuration may change in future
  releases.

## Troubleshooting

If SQL queries are not working as expected:

1. Verify the feature flag is enabled in your configuration:
   `explore.sqlSupport.enabled: true`
2. Verify the data source is tagged Analytics Engine. From the data source
   management UI, the engine type should display as `AnalyticEngine`. If it
   shows as `OpenSearch` or any other type, SQL queries will fail; switch
   to an Analytics Engine data source.
3. Ensure you're using a logs dataset in Explore.
4. Check that your SQL syntax is valid for the target engine. On Analytics
   Engine the parser is Calcite Babel with `Lex.BIG_QUERY`; backticks and
   hyphenated identifiers are supported.
5. Review the OpenSearch logs for any query execution errors.

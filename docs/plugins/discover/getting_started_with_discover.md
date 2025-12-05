# Getting Started with Discover 2.0 in OpenSearch Dashboards

## Introduction

Discover 2.0 transforms how you explore data in OpenSearch Dashboards by introducing multi-data type support. This powerful enhancement lets you search across different data sources without pre-defined index patterns, making data exploration more flexible and intuitive. You can now seamlessly switch between OpenSearch indices, S3 data, and other sources while maintaining a consistent search experience.

## Try it out

This hands-on guide will help you set up and explore Discover 2.0's multi-data type capabilities.

### Set up the development environment

1. Clone the OpenSearch Dashboards repository and navigate to it:

```bash
git clone https://github.com/opensearch-project/OpenSearch-Dashboards.git
cd OpenSearch-Dashboards
```

2. Install dependencies using yarn:

```bash
yarn osd bootstrap --single-version=loose
```

3. Start OpenSearch Dashboards with Discover 2.0 features enabled:

```bash
yarn start:enhancements
```

If you're using the release distribution of OpenSearch Dashboards instead of building from source, you can enable the same features using:

```bash
./bin/opensearch-dashboards \
  --uiSettings.overrides['query:enhancements:enabled']=true \ 
  --uiSettings.overrides['home:useNewHomePage']=true
```

For a more complete development environment with additional features like workspaces and multi-data source:

```bash
yarn start:enhancements \
  --data_source.enabled=true \
  --workspace.enabled=true \
  --home.disableNewThemeModal=false \
  --uiSettings.overrides['theme:version']=v9
```

4. Configure your OpenSearch connection by adding these settings to your `opensearch_dashboards.yml` file:

```yaml
opensearch.hosts: ["${OPENSEARCH_URL}"]  # Your OpenSearch cluster URL
opensearch.username: '${USERNAME}'       # Username for authentication
opensearch.password: '${PASSWORD}'       # Password for authentication
opensearch.ignoreVersionMismatch: true   # Ignore version mismatches between OSD and OpenSearch
opensearchDashboards.branding.useExpandedHeader: false  # Use compact header design
opensearch.ssl.verificationMode: none    # Disable SSL verification (use 'full' in production)
opensearch.requestHeadersWhitelist: [authorization]  # Allow authorization headers
opensearch_security.multitenancy.enabled: false  # Disable multi-tenancy features
opensearch_security.readonly_mode.roles: [kibana_read_only]  # Define read-only roles
```

> Note: The configuration above is a sample. You should customize it based on your environment's specific requirements.

### What's in the environment?

When you start OpenSearch Dashboards with enhancements enabled, several key components work together to provide the Discover 2.0 experience:

- **Multiple data dources**: Connect to various data sources like different OpenSearch clusters or connections from a single OpenSearch Dashboards instance. This allows you to query data across diverse storage locations.
- **Workspaces**: Logical containers that help organize related data sources and visualizations. Workspaces provide a way to group related data exploration activities.
- **Advanced data selection**: Browse data sources hierarchically through an intuitive interface without requiring pre-defined index patterns. This makes data discovery more natural and accessible.
- **Multiple query languages**: Support for different ways to express your queries, including DQL, Lucene, SQL, and PPL (Pipe Processing Language), giving you flexibility in how you search.
- **Query Editor**: Adapts to your selected language and data type with appropriate features and assistance, making it easier to write effective queries.
- **Discover**: The core exploration interface that displays matching documents and visualizations, helping you understand your data better.

### Setting up your data environment

Since you're starting with data sources and workspaces enabled, you'll need to set up a few components before you can start exploring data:

#### 1. Add a data source

First, you'll need to add a data source that connects to your OpenSearch cluster:

1. Navigate to **Stack Management** from the left sidebar.
2. Select **Data Sources** under the Data section.
3. Click **Create data source**.
4. Fill in the required information:
   - **Name**: A descriptive name for your data source (e.g., "Local OpenSearch")
   - **Endpoint**: The URL of your OpenSearch cluster (e.g., "https://localhost:9200")
   - **Authentication**: Choose the appropriate method and provide credentials
5. Click **Create** to save your data source.

#### 2. Create a workspace

Next, create a workspace to organize your data exploration:

1. Navigate to **Workspaces** from the left sidebar.
2. Click **Create workspace**.
3. Provide a name and description for your workspace (e.g., "Log Analysis").
4. Click **Create** to save the workspace.

#### 3. Associate the data source with your workspace

Now connect your data source to the workspace:
1. Go to your newly created workspace.
2. Click **Settings** in the workspace navigation.
3. Select the **Data Sources** tab.
4. Click **Add data source**.
5. Select the data source you created earlier.
6. Click **Add** to associate the data source with your workspace.

Once these steps are complete, your environment is ready for data exploration!

### Explore data with Discover 2.0

Now that your environment is set up, you can start exploring data across different sources.

1. Open OpenSearch Dashboards in your browser.
2. Select your workspace
3. Navigate to **Discover** from the left sidebar.
4. Use the data selector to choose your data source:
   a. Click on the data selector from the sidebar
   b. Choose "View all available data" to open the advanced selector.
   c. Browse through available data sources, which might include:
      - Index Patterns: Configured patterns that match multiple indices
      - Indexes: Direct access to specific indices
      - S3: If you've configured S3 connections
   d. After selecting a data source, you'll be prompted to configure:
      - Time field: Which field to use for time-based operations (if no time field is selected, the histogram visualization will not appear)
      - Query language: Your preferred language for this data type
5. Write a query using PPL (Pipe Processing Language):
   ```
   source = my_logs | where status = "404"
   ```
   - This query:
     - Sets the source to your logs index
     - Filters for status code `404`
     - Will apply the time filter if a time field was selected
6. Set your time range using the date picker in the search bar
7. Press **COMMAND + ENTER** (Mac) or **CTRL + ENTER** (Windows/Linux) to execute your PPL query.
8. Examine your results in the data table and histogram view (if a time field was selected).

### Understanding the Discover interface

Once your search results appear, Discover provides several ways to interact with your data:

1. **Time Chart**: For time-based data, a histogram shows the distribution of results over time. Note that if you didn't select a time field during data configuration, this chart won't appear.
2. **Available Fields**: The left sidebar shows all fields available in your data. You can:
   - Click a field name to see its top values
   - Add fields to your search results by clicking the "Add" button
   - Use the filter box to find specific fields
3. **Documents Table**: The main section displays matching documents with:
   - A timestamp (if using time-based data)
   - Document fields as columns
   - Expand/collapse buttons to view complete documents
4. **Field Actions**: (Features vary by language) Click the dropdown next to any field value to:
   - Add it as a filter 
   - Remove it from the results
   - Create a filter that excludes it
   - View field statistics
5. **Table Controls**: Use the gear icon above the table to:
   - Choose which columns to display
   - Change column order
   - Adjust time format settings
6. **Collapse Features**: You can collapse both the query editor and the histogram to maximize screen space for viewing results. This is particularly useful when working with large documents or when you need more room to analyze the data table.
7. **Query Assist**: When using PPL, the editor provides intelligent query assistance to help you write correct queries faster. As you type, you'll see suggestions and syntax help to guide your query construction.

### Save your search

1. Click the Save button in the top navigation.
2. Enter a name for your saved search.
4. Click "Save" to store your search.
5. You can now access this saved search for later access

Note: Saved searches using languages other than DQL or Lucene cannot be added to a Dashboard. If you plan to use your search as the basis for a dashboard panel, make sure to use DQL or Lucene as your query language.

## Known issues

We're actively working to improve Discover 2.0. Here are some known issues we're addressing:

- When loading saved search from a different language or different data source than the one in the saved search might require selecting the saved search twice.

## Next steps

Now that you've explored Discover 2.0's multi-data type capabilities, you might want to:
- Connect additional data sources like S3
- Explore query assist features for more efficient data exploration
- Learn different query languages (SQL, DQL, Lucene) for various data exploration needs

To dive deeper into PPL, explore the [PPL documentation](https://opensearch.org/docs/latest/search-plugins/sql/ppl/index/) which covers all available commands and functions.
# Legacy Export Plugin for OpenSearch Dashboards

## Table of Contents

1. [Introduction](#introduction)
2. [Plugin Structure](#plugin-structure)
3. [Main Components](#main-components)
   3.1. [Export Functionality](#export-functionality)
   3.2. [Import Functionality](#import-functionality)
4. [API Endpoints](#api-endpoints)
   4.1. [Export API](#export-api)
   4.2. [Import API](#import-api)
5. [Usage](#usage)
6. [Internal Workings](#internal-workings)
7. [Configuration](#configuration)

## 1. Introduction

The Legacy Export plugin for OpenSearch Dashboards provides functionality to export and import dashboards and their related objects. This plugin allows users to share dashboards across different OpenSearch Dashboards instances or to back up their configurations.

## 2. Plugin Structure

The plugin is structured as follows:

- `server/index.ts`: Entry point for the plugin
- `server/plugin.ts`: Main plugin class
- `server/routes/`: API route definitions
- `server/lib/`: Core functionality for export and import operations

## 3. Main Components

### 3.1. Export Functionality

The export functionality is primarily handled by the `exportDashboards` function in `server/lib/export/export_dashboards.ts`. This function:

1. Takes an array of dashboard IDs
2. Collects all related objects (visualizations, searches, index patterns) using `collectReferencesDeep`
3. Returns an object containing the OpenSearch Dashboards version and all collected objects

### 3.2. Import Functionality

The import functionality is managed by the `importDashboards` function in `server/lib/import/import_dashboards.ts`. This function:

1. Accepts an array of saved objects to import
2. Filters out excluded object types
3. Sets the `migrationVersion` for each object
4. Uses the `bulkCreate` method of the SavedObjectsClient to import the objects

## 4. API Endpoints

### 4.1. Export API

- **Endpoint**: `GET /api/opensearch-dashboards/dashboards/export`
- **Query Parameters**:
  - `dashboard`: string or array of strings (dashboard IDs to export)
- **Response**: JSON file containing exported dashboards and related objects

### 4.2. Import API

- **Endpoint**: `POST /api/opensearch-dashboards/dashboards/import`
- **Request Body**:
  - `objects`: array of saved objects to import
  - `version`: (optional) version of OpenSearch Dashboards
- **Query Parameters**:
  - `force`: boolean (default: false) - whether to overwrite existing objects
  - `exclude`: string or array of strings (object types to exclude from import)
- **Response**: JSON object with the result of the import operation

## 5. Usage

To use the Legacy Export plugin:

1. **Exporting Dashboards**:
   Make a GET request to `/api/opensearch-dashboards/dashboards/export?dashboard=dashboard-id-1,dashboard-id-2`

2. **Importing Dashboards**:
   Make a POST request to `/api/opensearch-dashboards/dashboards/import` with the body containing the objects to import and any query parameters for customization.

## 6. Internal Workings

### Exporting Process:

1. The `exportDashboards` function is called with dashboard IDs.
2. It uses `collectReferencesDeep` to gather all related objects recursively.
3. The collected objects are formatted into a JSON structure with the OpenSearch Dashboards version.
4. The JSON is sent as a downloadable file in the API response.

### Importing Process:

1. The `importDashboards` function receives the objects to import.
2. It filters out any excluded object types.
3. Each object's `migrationVersion` is set to ensure proper handling by OpenSearch Dashboards.
4. The `bulkCreate` method of the SavedObjectsClient is used to create or update the objects in the system.

### Reference Collection:

The `collectReferencesDeep` function in `server/lib/export/collect_references_deep.ts` is a crucial part of the export process:

1. It starts with the given objects (e.g., dashboards).
2. It recursively collects all referenced objects (visualizations, searches, index patterns).
3. It uses a queue system to handle large numbers of references efficiently.
4. It avoids duplicate objects in the collection.

## 7. Configuration

The plugin uses the following configuration:

- `maxImportPayloadBytes`: Defines the maximum size of the import payload. This is set in the OpenSearch Dashboards configuration under `savedObjects.maxImportPayloadBytes`.

To modify this configuration, update your `opensearch_dashboards.yml` file:

```yaml
opensearch_dashboards.savedObjects.maxImportPayloadBytes: 26214400 # Example: 25MB
```

Note: The actual value may vary based on your OpenSearch Dashboards version and specific needs.

---

This documentation provides a comprehensive overview of the Legacy Export plugin for OpenSearch Dashboards. For more detailed information about specific functions or components, refer to the corresponding source files in the plugin directory.

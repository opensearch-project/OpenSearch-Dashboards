# Workspace
The workspace feature allows users to customize their OpenSearch-Dashboards experience with curated use cases, for example, user can create a workspace particularly for observability use case so that they can concentrate on observability related functionaties. Also, workspace helps users organize visual assets, such as dashboards and visualizations, such assets are isolated by workspace. This makes it a valuable tool for OpenSearch-Dashboards users who want a more precise and flexible workflow.

## Scopes
The workspace only cares about data stored via saved objects(OSD metadata). The management of data stored by plugins that maintain their independent data stores within their own OpenSearch indexes is OUT OF THE SCOPE.

## Workspace data model
The Workspace data model defines the fundamental structure for managing isolated environments dedicated to metadata management within OpenSearch Dashboards.

```typescript
interface Workspace {
  id: string
  name: string
  description?: string
  features?: string[]
}
```

1. `id`: A unique identifier that distinguishes each workspace.
2. `name`: The name of the workspace.
3. `description`: A description providing context for the workspace.
4. `features`: An array of application IDs associated with the workspace, derived from the plugins registered. These application IDs
    are used to filter and display the relevant plugins in the left navigation menu when accessing the workspace. It serves as a visual
    mechanism for organizing and presenting features.


**Workspace object example**
```typescript
{
  id: "M5NqCu",
  name: "Observability team",
  description: "Observability team workspace",
  features: ["use-case-observability"],
}
```

The above object defines a workspace with name `Observability team` that's create with `observability` features by specifying an use case `use-case-observability`. An use case maps to multiple predefined OSD features, only the defined features will be available within the workspace. Use case strings are predefined, there are five types of use cases, except `use-case-all` which all features are available, the other four types of use cases have curated features defined:
1. `use-case-observability`
2. `use-case-security-analytics`
3. `use-case-search`
4. `use-case-essentials`
5. `use-case-all`

## Associate saved objects with workspaces
Saved objects, such as dashboards, visualizations, and index patterns, form the backbone of data visualization and analysis in OpenSearch Dashboards.
However, as the volume of saved objects grows, keeping them organized becomes increasingly challenging. Grouping saved objects into distinct workspaces,
each serving a specific purpose or team. This association not only simplifies the process of finding and accessing relevant saved objects but also
enhances security and access control (Please ref to this [DOC](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4633) for more details
about access control).

A new attribute, `workspaces`, is being added to saved objects which type is an array of string. A saved object can be associated with one or multiple workspaces. The saved objects(dashboards, visualizations, etc) will only be showed up in the associated workspaces.

The follow example shows the dashboard object is associated with workspace which id is `M5NqCu`
```typescript
{
  type: "dashboard",
  id: "da123f20-6680-11ee-93fa-df944ec23359",
  workspaces: ["M5NqCu"]
}
```

Saved object can also be associated with multiple workspaces, this is useful in scenarios where a saved object is relevant to multiple teams, projects, or use cases.

Consider the following example, where a data source is associated with multiple workspaces:
```typescript
{
  type: "data-source",
  id: "da123f20-6680-11ee-93fa-df944ec23359",
  workspaces: ["M5NqCu", "<TeamA-workspace-id>", "<Analytics-workspace-id>"]
}
```
By allowing saved objects to be linked with multiple workspaces, this enables users to share and collaborate on resources across various workspaces(teams).

## Non-workspace saved objects
While the introduction of workspaces in OSD provides a powerful framework for organizing and managing saved objects, it's important to note that not all saved objects are necessarily associated with workspaces. Some saved objects, by nature or purpose, may exist independently of workspaces.

For example, the global UI settings object. This object contains configurations and settings that apply globally across OSD, affecting the overall user interface and user experience. These settings are not tied to any specific workspace because they are intended to impact the entire OSD. Such objects won't have `workspaces` attribute.

The coexistence of workspace-associated saved objects and those without workspace association ensures that OSD strikes a balance between context-specific customization and system-wide consistency.

## Duplicate saved objects among workspaces
When duplicating objects, it creates hard copies of the objects in the target workspace, regardless of their original workspaces.

For example, if duplicate the following object to `<target-workspace>`
```typescript
{
  type: "visualization",
  id: "da123f20-6680-11ee-93fa-df944ec23359",
  workspaces: ["M5NqCu", "<TeamA-workspace-id>", "<Analytics-workspace-id>"]
}
```

Then a new object will be created with new `id` and associated with `<target-workspace>`
```typescript
{
  type: "visualization",
  id: "<new-object-id>",
  workspaces: ["<target-workspace>"]
}
```

### Handling Dependencies
A significant aspect of duplicating saved objects is the handling of dependencies. Many saved objects, particularly visual objects like dashboards and visualizations, often have a hierarchical structure with dependencies. For example, a dashboard may depend on multiple visualizations, and each visualization may rely on specific index pattern objects.

The duplicating process is not limited to the saved object itself. The user has the flexibility to choose whether or not to duplicate the entire dependency tree. If duplicating the entire dependency hierarchy, all dependencies will be duplicated. For example:
1. If the visualization depends on specific index pattern objects, these index pattern objects will also be duplicated in `<target-workspace>`.
2. If the dashboard depends on multiple visualizations, those visualizations and their associated index patterns will be copied as well.

This ensures that the copied saved object in <target-workspace> retains its functionality and context, with all necessary dependencies in place.

Please note that when multiple data source is enabled, duplicating saved objects to another workspace will not take the data source into consideration. Data source is a special type of object that cannot be duplicated but can only be manually assigned to a workspace.

## Server APIs

### List workspaces API

List workspaces.

* Path and HTTP methods

```json
POST <osd host>:<port>/api/workspaces/_list
```

* Request body

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `search` | String | NO | A `simple_query_string` query DSL used to search the workspaces. |
| `searchFields` | Array | NO  |  The fields to perform the `simple_query_string` parsed query against. |
| `sortField` | String | NO  | The fields used for sorting the response. |
| `sortOrder` | String | NO  | The order used for sorting the response. |
| `perPage` | String | NO  | The number of workspaces to return in each page. |
| `page` | String | NO  | The page of workspaces to return. |
| `permissionModes` | Array | NO  | The permission mode list. |

* Example request

```json
POST api/workspaces/_list
```

* Example response

```json
{
    "success": true,
    "result": {
        "page": 1,
        "per_page": 20,
        "total": 3,
        "workspaces": [
            {
                "name": "test1",
                "features": [
                    "workspace_update",
                    "workspace_overview",
                    "dashboards",
                    "visualize",
                    "opensearchDashboardsOverview",
                    "indexPatterns",
                    "discover",
                    "objects",
                    "objects_searches",
                    "objects_query",
                    "dev_tools"
                ],
                "id": "hWNZls"
            },
            {
                "name": "test2",
                "features": [
                    "workspace_update",
                    "workspace_overview",
                    "dashboards",
                    "visualize",
                    "opensearchDashboardsOverview",
                    "indexPatterns",
                    "discover",
                    "objects",
                    "objects_searches",
                    "objects_query"
                ],
                "id": "SnkOPt"
            },
            {
                "name": "Global workspace",
                "features": [
                    "*",
                    "!@management"
                ],
                "reserved": true,
                "id": "public"
            }
        ]
    }
}
```


### Get workspace API

Retrieve a single workspace.

* Path and HTTP methods

```json
GET <osd host>:<port>/api/workspaces/<id>
```

* Path parameters

The following table lists the available path parameters. All path parameters are required.

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `<id>` | String | YES | The ID of the workspace. |

* Example request

```json
GET api/workspaces/SnkOPt
```

* Example response

```json
{
    "success": true,
    "result": {
        "name": "test2",
        "features": [
            "workspace_update",
            "workspace_overview",
            "dashboards",
            "visualize",
            "opensearchDashboardsOverview",
            "indexPatterns",
            "discover",
            "objects",
            "objects_searches",
            "objects_query"
        ],
        "id": "SnkOPt"
    }
}
```

### Create workspace API

Create a workspace.

* Path and HTTP methods

```json
POST <osd host>:<port>/api/workspaces
```

* Request body

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `attributes` | Object | YES | The attributes of the workspace. |
| `permissions` | Object | NO  |  The permission info of the workspace. |


* Example request

```json
POST api/workspaces
{
    "attributes": {
        "name": "test4",
        "description": "test4"
    }
}
```

* Example response

```json
{
    "success": true,
    "result": {
        "id": "eHVoCJ"
    }
}
```

### Update workspace API

Update the attributes and permissions of a workspace.

* Path and HTTP methods

```json
PUT <osd host>:<port>/api/workspaces/<id>
```

* Path parameters

The following table lists the available path parameters. All path parameters are required.

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `<id>` | String | YES | The ID of the workspace. |

* Request body

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `attributes` | Object | YES | The attributes of the workspace. |
| `permissions` | Object | NO  |  The permission info of the workspace. |


* Example request

```json
PUT api/workspaces/eHVoCJ
{
    "attributes": {
        "name": "test4",
        "description": "test update"
    }
}
```

* Example response

```json
{
    "success": true,
    "result": true
}
```

### Delete workspace API

Delete a workspace.

* Path and HTTP methods

```json
DELETE <osd host>:<port>/api/workspaces/<id>
```

* Path parameters

The following table lists the available path parameters. All path parameters are required.

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `<id>` | String | YES | The ID of the workspace. |


* Example request

```json
DELETE api/workspaces/eHVoCJ
```

* Example response

```json
{
    "success": true,
    "result": true
}
```

### Duplicate saved objects API

Duplicate saved objects among workspaces.

* Path and HTTP methods

```json
POST <osd host>:<port>/api/workspaces/_duplicate_saved_objects
```

* Request body

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `objects` | Array | YES | A list of saved objects to copy. |
| `targetWorkspace` | String | YES  | The ID of the workspace to copy to. |
| `includeReferencesDeep` | Boolean | NO | Copy all of the referenced objects of the specified objects to the target workspace . Defaults to `true`.|

The attrbutes of the object in the `objects` parameter are as follows:
| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `type` | String | YES | The type of the saved object, such as `index-pattern`, `config` and `dashboard`. |
| `id` | String | YES | The ID of the saved object. |

* Example request

```json
POST api/workspaces/_duplicate_saved_objects
{
    "objects": [
        {
            "type": "index-pattern",
            "id": "619cc200-ecd0-11ee-95b1-e7363f9e289d"
        }
    ],
    "targetWorkspace": "9gt4lB"
}
```

* Example response

```json
{
    "successCount": 1,
    "success": true,
    "successResults": [
        {
            "type": "index-pattern",
            "id": "619cc200-ecd0-11ee-95b1-e7363f9e289d",
            "meta": {
                "title": "test*",
                "icon": "indexPatternApp"
            },
            "destinationId": "f4b724fd-9647-4bbf-bf59-610b43a62c75"
        }
    ]
}
```

## Appendix
1. The PR the introduce [object access control](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/5083)
2. The [PR](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4633/files) of the design doc for saved object access control
3. Future Vision for Dashboards: [Issue](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4298)

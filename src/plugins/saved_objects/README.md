# Saved object

The saved object plugin provides all the core services and functionalities of saved objects. It is utilized by many core plugins such as [`visualization`](../visualizations/), [`dashboard`](../dashboard/) and [`visBuilder`](../vis_builder/), as well as external plugins. Saved object is the primary way to store app and plugin data in a standardized form in OpenSearch Dashboards. They allow plugin developers to manage creating, saving, editing and retrieving data for the application. They can also make reference to other saved objects and have useful features out of the box, such as migrations and strict typings. The saved objects can be managed by the Saved Object Management UI.

### Relationships

Saved objects can persist parent/child relationships to other saved objects via `references`. These relationships can be viewed on the UI in the [saved objects management plugin](src/core/server/saved_objects_management/README.md). Relationships can be useful to combine existing saved objects to produce new ones, such as using an index pattern as the source for a visualization, or a dashboard consisting of many visualizations.

Some saved object fields have pre-defined logic. For example, if a saved object type has a `searchSource` field indicating an index pattern relationship, a reference will automatically be created using the [`kibanaSavedObjectMeta`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/4a06f5a6fe404a65b11775d292afaff4b8677c33/src/plugins/saved_objects/public/saved_object/helpers/serialize_saved_object.ts#L59) attribute and the [`references`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/4a06f5a6fe404a65b11775d292afaff4b8677c33/src/plugins/saved_objects/public/saved_object/helpers/serialize_saved_object.ts#L60) array structure. Functions from the data plugin are used by the saved object plugin to manage this index pattern relationship.

An example of a visualization saved object and its index pattern relationship:

```ts

"kibanaSavedObjectMeta" : {
    "searchSourceJSON" : """{"filter":[],"query":{"query":"","language":"kuery"},"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}"""
}
"type" : "visualization",
"references" : [
  {
    "name" : "kibanaSavedObjectMeta.searchSourceJSON.index",
    "type" : "index-pattern",
    "id" : "90943e30-9a47-11e8-b64d-95841ca0b247"
  }
],

```

### Saving a saved object

When saving a saved object and its relationship to the index pattern:

1. A saved object will be built using [`buildSavedObject`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/4a06f5a6fe404a65b11775d292afaff4b8677c33/src/plugins/saved_objects/public/saved_object/helpers/build_saved_object.ts#L46) function. Services such as hydrating index pattern, initializing and serializing the saved object are set, and configs such as saved object id, migration version are defined.
2. The saved object will then be serialized by three steps:

   a. By using [`extractReferences`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/4a06f5a6fe404a65b11775d292afaff4b8677c33/src/plugins/data/common/search/search_source/extract_references.ts#L35) function from the data plugin, the index pattern information will be extracted using the index pattern id within the `kibanaSavedObjectMeta`, and the id will be replaced by a reference name, such as `indexRefName`. A corresponding index pattern object will then be created to include more detailed information of the index pattern: name (`kibanaSavedObjectMeta.searchSourceJSON.index`), type, and id.

   ```ts
   let searchSourceFields = { ...state };
   const references = [];

   if (searchSourceFields.index) {
     const indexId = searchSourceFields.index.id || searchSourceFields.index;
     const refName = 'kibanaSavedObjectMeta.searchSourceJSON.index';
     references.push({
       name: refName,
       type: 'index-pattern',
       id: indexId,
     });
     searchSourceFields = { ...searchSourceFields, indexRefName: refName, index: undefined };
   }
   ```

   b. The `indexRefName` along with other information will be stringified and saved into `kibanaSavedObjectMeta.searchSourceJSON`.

   c. Saved object client will create the reference array attribute, and the index pattern object will be pushed into the reference array.

### Loading an existing or creating a new saved object

1. When loading an existing object or creating a new saved object, [`initializeSavedObject`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/4a06f5a6fe404a65b11775d292afaff4b8677c33/src/plugins/saved_objects/public/saved_object/helpers/initialize_saved_object.ts#L38) function will be called.
2. The saved object will be deserialized in the [`applyOpenSearchResp`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/4a06f5a6fe404a65b11775d292afaff4b8677c33/src/plugins/saved_objects/public/saved_object/helpers/apply_opensearch_resp.ts#L50) function.

   a. Using [`injectReferences`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/4a06f5a6fe404a65b11775d292afaff4b8677c33/src/plugins/data/common/search/search_source/inject_references.ts#L34) function from the data plugin, the index pattern reference name within the `kibanaSavedObject` will be substituted by the index pattern id and the corresponding index pattern reference object will be deleted if filters are applied.

   ```ts
   searchSourceReturnFields.index = reference.id;
   delete searchSourceReturnFields.indexRefName;
   ```

### Creating a new saved object type

Steps need to be done on both the public/client-side & the server-side for creating a new saved object type.

Client-side:

1. Define a class that extends `SavedObjectClass`. This is where custom functionalities, such as extracting/injecting references, or overriding `afterOpenSearchResp` can be set in the constructor. For example, visualization plugin's [`SavedVis`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/4a06f5a6fe404a65b11775d292afaff4b8677c33/src/plugins/visualizations/public/saved_visualizations/_saved_vis.ts#L91) class has additional `extractReferences`, `injectReferences` and `afterOpenSearchResp` functions defined in [`_saved_vis.ts`](../visualizations/public/saved_visualizations/_saved_vis.ts), and set in the `SavedVis` constructor.

```ts
class SavedVis extends SavedObjectClass {
    constructor(opts: Record<string, unknown> | string = {}) {
      super({
        ... ...
        extractReferences,
        injectReferences,
        ... ...
        afterOpenSearchResp: async (savedObject: SavedObject) => {
          const savedVis = (savedObject as any) as ISavedVis;
          ... ...

          return (savedVis as any) as SavedObject;
        },
```

2. Optionally create a loader class that extends `SavedObjectLoader`. This can be useful for performing default CRUD operations on this particular saved object type, as well as overriding default utility functions like `find`. For example, the `visualization` saved object overrides `mapHitSource` (used in `find` & `findAll`) to do additional checking on the returned source object, such as if the returned type is valid:

```ts
class SavedObjectLoaderVisualize extends SavedObjectLoader {
  mapHitSource = (source: Record<string, any>, id: string) => {
    const visTypes = visualizationTypes;
    ... ...
    let typeName = source.typeName;
    if (source.visState) {
      try {
        typeName = JSON.parse(String(source.visState)).type;
      } catch (e) {
        /* missing typename handled below */
      }
    }

    if (!typeName || !visTypes.get(typeName)) {
      source.error = 'Unknown visualization type';
      return source;
    }
    ... ...
    return source;
  };
```

The loader can then be instantiated once and referenced when needed. For example, the `visualizations` plugin creates and sets it in its `services` in the plugin's start lifecycle:

```ts
public start(
  core: CoreStart,
  { data, expressions, uiActions, embeddable, dashboard }: VisualizationsStartDeps
): VisualizationsStart {
  ... ...
  const savedVisualizationsLoader = createSavedVisLoader({
    savedObjectsClient: core.savedObjects.client,
    indexPatterns: data.indexPatterns,
    search: data.search,
    chrome: core.chrome,
    overlays: core.overlays,
    visualizationTypes: types,
  });
  setSavedVisualizationsLoader(savedVisualizationsLoader);
  ... ...
}
```

Server-side:

1. Define the new type that is of type `SavedObjectsType`, which is where various settings can be configured, including the index mappings when the object is stored in the system index. To see an example type definition, you can refer to the [visualization saved object type](src/plugins/visualizations/server/saved_objects/visualization.ts).
2. Register the new type in the respective plugin's setup lifecycle function. For example, the `visualizations` plugin registers the `visualization` saved object type like below:

```ts
core.savedObjects.registerType(visualizationSavedObjectType);
```

To make the new type manageable in the `saved_objects_management` plugin, refer to the [plugin README](src/plugins/saved_objects_management/README.md)

## Migration

When a saved object is created using a previous version, the migration will trigger if there is a new way of saving the saved object and the migration functions alter the structure of the old saved object to follow the new structure. Migrations can be defined in the specific saved object type in the plugin's server folder. For example,

```ts
export const visualizationSavedObjectType: SavedObjectsType = {
  name: 'visualization',
  management: {},
  mappings: {},
  migrations: visualizationSavedObjectTypeMigrations,
};
```

```ts
const visualizationSavedObjectTypeMigrations = {
  '1.0.0': flow(migrateIndexPattern),
```

The migraton version will be saved as a `migrationVersion` attribute in the saved object, not to be confused with the other `verson` attribute.

```ts
"migrationVersion" : {
    "visualization" : "1.0.0"
},
```

For a more detailed explanation on the migration, refer to [`saved objects management`](src/core/server/saved_objects/migrations/README.md).

## Server APIs

### Get saved objects API

Retrieve a single saved object by its ID.

* Path and HTTP methods

```json
GET <osd host>:<port>/api/saved_objects/<type>/<id>
```

* Path parameters

The following table lists the available path parameters. All path parameters are required.

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `<type>` | String | YES | The type of the saved object, such as `index-pattern`, `config` and `dashboard`. |
| `<id>` | String | YES | The ID of the saved object. |

* Example request

```json
GET api/saved_objects/index-pattern/619cc200-ecd0-11ee-95b1-e7363f9e289d
```

* Example response

```json
{
    "id": "619cc200-ecd0-11ee-95b1-e7363f9e289d",
    "type": "index-pattern",
    "namespaces": [
        "default"
    ],
    "updated_at": "2024-03-28T06:57:03.008Z",
    "version": "WzksMl0=",
    "attributes": {
        "title": "test*",
        "fields": "[{\"count\":0,\"name\":\"_id\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_index\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_score\",\"type\":\"number\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_source\",\"type\":\"_source\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_type\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false}]"
    },
    "references": [

    ],
    "migrationVersion": {
        "index-pattern": "7.6.0"
    }
}
```

### Bulk get saved objects API

Retrieve mutiple saved objects.

* Path and HTTP methods

```json
POST <osd host>:<port>/api/saved_objects/_bulk_get
```

* Request body

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `type` | String | YES | The type of the saved object, such as `index-pattern`, `config` and `dashboard`. |
| `id` | String | YES | The ID of the saved object. |
| `fields` | Array | NO | The fields of the saved obejct need to be returned in the response. |

* Example request

```json
POST api/saved_objects/_bulk_get
[
  {
    "type": "index-pattern",
    "id": "619cc200-ecd0-11ee-95b1-e7363f9e289d"
  },
  {
    "type": "config",
    "id": "3.0.0"
  }
]
```

* Example response

```json
{
    "saved_objects": [
        {
            "id": "619cc200-ecd0-11ee-95b1-e7363f9e289d",
            "type": "index-pattern",
            "namespaces": [
                "default"
            ],
            "updated_at": "2024-03-28T06:57:03.008Z",
            "version": "WzksMl0=",
            "attributes": {
                "title": "test*",
                "fields": "[{\"count\":0,\"name\":\"_id\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_index\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_score\",\"type\":\"number\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_source\",\"type\":\"_source\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_type\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false}]"
            },
            "references": [

            ],
            "migrationVersion": {
                "index-pattern": "7.6.0"
            }
        },
        {
            "id": "3.0.0",
            "type": "config",
            "namespaces": [
                "default"
            ],
            "updated_at": "2024-03-19T06:11:41.608Z",
            "version": "WzAsMV0=",
            "attributes": {
                "buildNum": 9007199254740991
            },
            "references": [

            ],
            "migrationVersion": {
                "config": "7.9.0"
            }
        }
    ]
}
```

### Find saved objects API

Retrieve a paginated set of saved objects by mulitple conditions.

* Path and HTTP methods

```json
GET <osd host>:<port>/api/saved_objects/_find
```

* Query parameters

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `type` | String | YES | The type of the saved object, such as `index-pattern`, `config` and `dashboard`. |
| `per_page` | Number | NO | The number of saved objects to return in each page. |
| `page` | Number | NO  |  The page of saved objects to return. |
| `search` | String | NO  |  A `simple_query_string` query DSL that used to filter the saved objects. |
| `default_search_operator` | String | NO  |  The default operator to use for the `simple_query_string` query. |
| `search_fields` | Array | NO  |  The fields to perform the `simple_query_string` parsed query against. |
| `fields` | Array | NO  | The fields of the saved obejct need to be returned in the response. |
| `sort_field` | String | NO  | The field used for sorting the response. |
| `has_reference` | Object | NO  | Filters to objects that have a relationship with the type and ID combination. |
| `filter` | String | NO  | The query string used to filter the attribute of the saved object. |
| `workspaces` | String\|Array | NO  | The ID of the workspace which the saved objects exist in. |

* Example request

```json
GET api/saved_objects/_find?type=index-pattern&search_fields=title
```

* Example response

```json
{
    "page": 1,
    "per_page": 20,
    "total": 2,
    "saved_objects": [
        {
            "type": "index-pattern",
            "id": "619cc200-ecd0-11ee-95b1-e7363f9e289d",
            "attributes": {
                "title": "test*",
                "fields": "[{\"count\":0,\"name\":\"_id\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_index\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_score\",\"type\":\"number\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_source\",\"type\":\"_source\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_type\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false}]"
            },
            "references": [

            ],
            "migrationVersion": {
                "index-pattern": "7.6.0"
            },
            "updated_at": "2024-03-28T06:57:03.008Z",
            "version": "WzksMl0=",
            "namespaces": [
                "default"
            ],
            "score": 0
        },
        {
            "type": "index-pattern",
            "id": "2ffee5da-55b3-49b4-b9e1-c3af5d1adbd3",
            "attributes": {
                "title": "test*",
                "fields": "[{\"count\":0,\"name\":\"_id\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_index\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_score\",\"type\":\"number\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_source\",\"type\":\"_source\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_type\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false}]"
            },
            "references": [

            ],
            "migrationVersion": {
                "index-pattern": "7.6.0"
            },
            "updated_at": "2024-03-28T07:10:13.513Z",
            "version": "WzEwLDJd",
            "workspaces": [
                "9gt4lB"
            ],
            "namespaces": [
                "default"
            ],
            "score": 0
        }
    ]
}
```

### Create saved objects API

Create saved objects.

* Path and HTTP methods

```json
POST <osd host>:<port>/api/saved_objects/<type>/<id>
```

* Path parameters

The following table lists the available path parameters.

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `<type>` | String | YES | The type of the saved object, such as `index-pattern`, `config` and `dashboard`. |
| `<id>` | String | NO |The ID of the saved object. |

* Query parameters

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `overwrite` | Boolean | NO | If `true`, overwrite the saved object with the same ID, defaults to `false`. |

* Request body

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `attributes` | Object | YES | The attributes of the saved object. |
| `references` | Array | NO | The attributes of the referenced objects. |
| `workspaces` | String\|Array | NO  | The ID of the workspace which the saved objects exist in. |

* Example request

```json
POST api/saved_objects/index-pattern/test-pattern
{
  "attributes": {
    "title": "test-pattern-*"
  }
}
```

* Example response

```json
{
    "type": "index-pattern",
    "id": "test-pattern",
    "attributes": {
        "title": "test-pattern-*"
    },
    "references": [

    ],
    "migrationVersion": {
        "index-pattern": "7.6.0"
    },
    "updated_at": "2024-03-29T05:55:09.270Z",
    "version": "WzExLDJd",
    "namespaces": [
        "default"
    ]
}
```

### Bulk create saved objects API

Bulk create saved objects.

* Path and HTTP methods

```json
POST <osd host>:<port>/api/saved_objects/_bulk_create
```

* Query parameters

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `overwrite` | Boolean | NO | If `true`, overwrite the saved object with the same ID, defaults to `false`. |

* Request body

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `type` | String | YES | The type of the saved object, such as `index-pattern`, `config` and `dashboard`. |
| `id` | String | NO |The ID of the saved object. |
| `attributes` | Object | YES | The attributes of the saved object. |
| `references` | Array | NO | The attributes of the referenced objects. |
| `version` | String | NO | The version of the saved object. |
| `workspaces` | String\|Array | NO  | The ID of the workspace which the saved objects exist in. |

* Example request

```json
POST api/saved_objects/_bulk_create
[
    {
        "type": "index-pattern",
        "id": "test-pattern1",
        "attributes": {
            "title": "test-pattern1-*"
        }
    }
]
```

* Example response

```json
{
    "saved_objects": [
        {
            "type": "index-pattern",
            "id": "test-pattern1",
            "attributes": {
                "title": "test-pattern1-*"
            },
            "references": [

            ],
            "migrationVersion": {
                "index-pattern": "7.6.0"
            },
            "updated_at": "2024-03-29T06:01:59.453Z",
            "version": "WzEyLDJd",
            "namespaces": [
                "default"
            ]
        }
    ]
}
```
### Upate saved objects API

Update saved objects.

* Path and HTTP methods

```json
PUT <osd host>:<port>/api/saved_objects/<type>/<id>
```

* Path parameters

The following table lists the available path parameters.

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `<type>` | String | YES | The type of the saved object, such as `index-pattern`, `config` and `dashboard`. |
| `<id>` | String | NO |The ID of the saved object. |

* Request body

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `attributes` | Object | YES | The attributes of the saved object. |
| `references` | Array | NO | The attributes of the referenced objects. |

* Example request

```json
PUT api/saved_objects/index-pattern/test-pattern
{
  "attributes": {
    "title": "test-pattern-update-*"
  }
}
```

* Example response

```json
{
    "id": "test-pattern",
    "type": "index-pattern",
    "updated_at": "2024-03-29T06:04:32.743Z",
    "version": "WzEzLDJd",
    "namespaces": [
        "default"
    ],
    "attributes": {
        "title": "test-pattern-update-*"
    }
}
```
### Delete saved objects API

Delete saved objects.

* Path and HTTP methods

```json
DELETE <osd host>:<port>/api/saved_objects/<type>/<id>
```

* Path parameters

The following table lists the available path parameters.

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `<type>` | String | YES | The type of the saved object, such as `index-pattern`, `config` and `dashboard`. |
| `<id>` | String | NO | The ID of the saved object. |

* Example request

```json
DELETE api/saved_objects/index-pattern/test-pattern
```

* Example response

```json
{}
```
### Export saved object API

Export saved objects.

* Path and HTTP methods

```json
POST <osd host>:<port>/api/saved_objects/_export
```

* Request body

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `type` | String|Array | NO | The types of the saved object to be included in the export. |
| `objects` | Array | NO | A list of saved objects to export. |
| `includeReferencesDeep` | Boolean | NO | Includes all of the referenced objects in the export. |
| `excludeExportDetails` | Boolean | NO  | Exclude the export summary in the export. |
| `workspaces` | String\|Array | NO  | The ID of the workspace which the saved objects exist in. |

* Example request

```json
POST api/saved_objects/_export
{
  "type": "index-pattern"
}
```

* Example response

```json
{"attributes":{"fields":"[{\"count\":0,\"name\":\"_id\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_index\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_score\",\"type\":\"number\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_source\",\"type\":\"_source\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_type\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false}]","title":"test*"},"id":"2ffee5da-55b3-49b4-b9e1-c3af5d1adbd3","migrationVersion":{"index-pattern":"7.6.0"},"references":[],"type":"index-pattern","updated_at":"2024-03-28T07:10:13.513Z","version":"WzEwLDJd","workspaces":["9gt4lB"]}
{"attributes":{"fields":"[{\"count\":0,\"name\":\"_id\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_index\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_score\",\"type\":\"number\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_source\",\"type\":\"_source\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"count\":0,\"name\":\"_type\",\"type\":\"string\",\"scripted\":false,\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false}]","title":"test*"},"id":"619cc200-ecd0-11ee-95b1-e7363f9e289d","migrationVersion":{"index-pattern":"7.6.0"},"references":[],"type":"index-pattern","updated_at":"2024-03-28T06:57:03.008Z","version":"WzksMl0="}
{"attributes":{"title":"test-pattern1-*"},"id":"test-pattern1","migrationVersion":{"index-pattern":"7.6.0"},"references":[],"type":"index-pattern","updated_at":"2024-03-29T06:01:59.453Z","version":"WzEyLDJd"}
{"exportedCount":3,"missingRefCount":0,"missingReferences":[]}
```

### Import saved object API

Import saved objects from the file generated by the export API.

* Path and HTTP methods

```json
POST <osd host>:<port>/api/saved_objects/_import
```

* Query parameters

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `createNewCopies` | Boolean | NO | Creates copies of the saved objects, genereate new IDs for the imported saved obejcts and resets the reference. |
| `overwrite` | Boolean | NO | Overwrites the saved objects when they already exist. |
| `dataSourceId` | String | NO  | The ID of the data source. |
| `workspaces` | String\|Array | NO  | The ID of the workspace which the saved objects exist in. |

* Request body

The request body must include a multipart/form-data.

* Example request

```json
POST api/saved_objects/_import?createNewCopies=true --form file=@export.ndjson
```

* Example response

```json
{
    "successCount": 3,
    "success": true,
    "successResults": [
        {
            "type": "index-pattern",
            "id": "2ffee5da-55b3-49b4-b9e1-c3af5d1adbd3",
            "meta": {
                "title": "test*",
                "icon": "indexPatternApp"
            },
            "destinationId": "f0b08067-d6ab-4153-ba7d-0304506430d6"
        },
        {
            "type": "index-pattern",
            "id": "619cc200-ecd0-11ee-95b1-e7363f9e289d",
            "meta": {
                "title": "test*",
                "icon": "indexPatternApp"
            },
            "destinationId": "ffd3719c-2314-4022-befc-7d3007225952"
        },
        {
            "type": "index-pattern",
            "id": "test-pattern1",
            "meta": {
                "title": "test-pattern1-*",
                "icon": "indexPatternApp"
            },
            "destinationId": "e87e7f2d-8498-4e44-8d25-f7d41f3b3844"
        }
    ]
}
```

### Resolve import saved objects errors API

Resolve the errors if the import API returns errors, this API can be used to retry importing some saved obejcts,  overwrite specific saved objects, or change the references to different saved objects.

* Path and HTTP methods

```json
POST <osd host>:<port>/api/saved_objects/_resolve_import_errors
```

* Query parameters

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `createNewCopies` | Boolean | NO | Creates copies of the saved objects, genereate new IDs for the imported saved obejcts and resets the reference. |
| `dataSourceId` | String | NO  | The ID of the data source. |
| `workspaces` | String\|Array | NO  | The ID of the workspace which the saved objects exist in. |

* Request body

The request body must include a multipart/form-data.

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `file` | ndjson file | YES | The same file given to the import API. |
| `retries` | Array | YES | The retry operations. |

The attrbutes of the object in the `objects` parameter are as follows:
| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `type` | String | YES | The type of the saved object, such as `index-pattern`, `config` and `dashboard`. |
| `id` | String | YES |The ID of the saved object. |
| `overwrite` | Boolean | NO | If `true`, overwrite the saved object with the same ID, defaults to `false`. |
| `destinationId` | String | NO | The destination ID that the imported object should have, if different from the current ID. |
| `replaceReferences` | Array | NO | A list of `type`, `from`, and `to` to be used to change the saved object's references. |
| `ignoreMissingReferences` | Boolean | NO | If `true`, ignores missing reference errors, defaults to `false`. |

* Example request

```json
POST api/saved_objects/_import?createNewCopies=true --form file=@export.ndjson --form retries='[{"type":"index-pattern","id":"my-pattern","overwrite":true}]'

```

* Example response

```json
{
    "successCount": 0,
    "success": true
}
```

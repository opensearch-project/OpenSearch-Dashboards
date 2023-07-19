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

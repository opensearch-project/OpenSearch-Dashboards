# Saved Object

The saved object plugin provides all the core services and functionalities of the saved objects, and is utilized by many other plugins such as visualizaton plugin, dashboard plugin and wizard plugin etc.

## Save Relationships to Index Pattern

The relationships to index patterns are saved using the kibanaSavedObjectMeta attribute and the references array structure. Functions from the data plugin are utilized by the saved object plugin to manage this index pattern relationships. 

A standard saved object and its index pattern relationship:

```.ts

"kibanaSavedObjectMeta" : {
    "searchSourceJSON" : """{"filter":[],"query":{"query":"","language":"kuery"},"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}"""
      }
    },
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

1. A saved object will be built using `buildSavedObject` function, services such as hydrating index pattern, initializing and serializing the saved object are set and configs such as saved object id, migration version are defined.
2. The saved object will then be serialized by three steps: 

    a. By using `extractReferences` function from the data plugin, the index pattern information will be extracted using the index pattern id within the kibanaSavedObjectMeta, and the id will be replaced by a reference name, such as `indexRefName`; a corresponding index pattern object will then be created to include more detailed information of the index pattern: name (`kibanaSavedObjectMeta.searchSourceJSON.index`), type and id.

    ```.ts
     let searchSourceFields = { ...state };
    const references = [];

    if (searchSourceFields.index) {
        const indexId = searchSourceFields.index.id || searchSourceFields.index;
        const refName = 'kibanaSavedObjectMeta.searchSourceJSON.index';
        references.push({
            name: refName,
            type: 'index-pattern',
            id: indexId
        });
        searchSourceFields = { ...searchSourceFields,
        indexRefName: refName,
        index: undefined
        };
    }
    ```

    b. The indexRefName along with other information will be stringfied and saved into `kibanaSavedObjectMeta.searchSourceJSON`. 
    
    c. Saved object client will create the reference array attribute, and the index pattern object will be pushed into the  reference array.


### Loading an existing/Creating a new saved object

1. When loading an existing object or creating a new, `initializeSavedObject` function will be called. 
2. The saved object will be deserialized in the `applyOpenSearchResp` function.

    a. Using `injectReferences` function from the data plugin, the index pattern reference name within the kibanaSavedObject will be subsituted by the index pattern id and the corerresponding index pattern reference object will be deleted if there are filters applied.

    ```.ts
    searchSourceReturnFields.index = reference.id;
    delete searchSourceReturnFields.indexRefName;
    ```

### Others
 
If a saved object type wishes to have addtional custom functionalities when extracting/injecting references, or after opensearch's response, it can define functions in the class constructor when extending the SavedObjectClass. For example, visualization plugin's SavedVis class has addtional extractReferences, injectReferences and afterOpenSearchResp functions defined.

```.ts
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

## Migration

When a saved object is created using a previous version, the migration will trigger if there is a new way of saving the saved object, and the migration functions alter the structure of the old saved object to follow the new structure. Migrations can be defined in the specific saved object type in the server folder of the plugin. For example, 

```.ts
export const visualizationSavedObjectType: SavedObjectsType = {
  name: 'visualization',
  management: {},
  mappings: {},
  migrations: visualizationSavedObjectTypeMigrations,
};
```

```.ts
const visualizationSavedObjectTypeMigrations = {
  '7.0.0': flow(migrateIndexPattern),
```

The migraton version will be saved as a `migrationVersion` attribute in the saved object, not to be confused with the other `verson` attribute.

```.ts
"migrationVersion" : {
    "visualization" : "1.0.0"
},
```

For a more detailed explanation on the migration, please refer to `src/core/server/saved_objects/migrations/README.md`.
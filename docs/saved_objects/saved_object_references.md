# Saved Object References

Saved object references are a mechanism for storing relationships between saved objects in OSD. Instead of embedding related objects directly, references store the ID and type of the related object, creating a link that can be resolved at runtime.

## Usage

- **Search Sources**: reference index patterns
- **Visualizations**: reference index patterns through their search source
- **Dashboards**: reference visualizations and saved searches
- **Saved Searches**: reference index patterns
- **Index Patterns**: reference data sources

## Example

```typescript
// Original search source before serialization
const searchSource = {
  index: {
    id: 'logs-2024-*',
    title: 'logs-2024-*',
    timeFieldName: '@timestamp',
    fields: [...]
  },
  query: { match_all: {} }
}

// After serialization with extractReferences()
const serializedSearchSource = {
  searchSourceJSON: JSON.stringify({
    index: 'logs-2024-*',
    query: { match_all: {} }
  }),
  references: [
    {
      name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
      type: 'index-pattern',
      id: 'logs-2024-*'
    }
  ]
}
```

## Implementation

To create a new saved object type that uses references:

1. **Design your object structure**: Identify which fields should reference other saved objects (typically IDs of index patterns, data sources, etc.)

2. **Extract references during save**: Before saving, pull out the referenced IDs and create reference entries with:
   - `name`: A unique identifier for this reference
   - `type`: The type of saved object being referenced
   - `id`: The ID of the referenced object

3. **Store both parts**: Save your object with the extracted data and the references array separately

4. **Inject references during load**: When loading the object, use the references array to reconstruct the full object by matching reference names back to their positions

The key is that your saved object stores just the IDs where it would normally embed full objects, and the references array maintains the relationships.

## Details

### Reference naming convention

The reference name represents the path to the referenced object within the saved object structure, using dot notation:

```json
kibanaSavedObjectMeta.searchSourceJSON.index
```

Each segment in the path corresponds to a nested property in the original object structure. When injecting that is the location that you will inject the original object.

### Pros

- **No Data Duplication**: Index patterns are stored once and referenced many times
- **Automatic Updates**: There is a source of truth. When an index pattern changes, all visualizations using it get the updates
- **Smaller Storage**: Saved objects are more compact without embedded data

### Cons

- **Additional Lookup Required**: Must resolve references when loading saved objects
- **Potential for Broken References**: If referenced object is deleted, dependent objects break

## Summary

Saved object references transform OSD from a system where objects are copied everywhere to one where they are linked. This creates a more maintainable and efficient system where updates propagate automatically and storage is optimized.

While it adds complexity to the save/load process, the benefits of having a single source of truth for each object far outweigh the costs. When building new features in OSD, using references ensures your saved objects integrate seamlessly with the existing ecosystem.

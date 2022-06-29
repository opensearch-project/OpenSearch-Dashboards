# Save objects management

An app to manage all saved objects in one place (`/app/management/opensearch-dashboards/objects`):

1. Search/view/delete saved objects
2. Import/export saved objects
3. Inspect/edit raw saved object values without validation

## Making a new saved object type manageable

1. Create a new `SavedObjectsType`. See `SavedObjectsTypeManagementDefinition` for explanation of management fields
2. Register saved object type via `core.savedObjects.registerType(...)` as part of plugin server setup method
3. Implement a way to save the object via `savedObjectsClient.create(...)`
4. After these steps, you should be able to save objects and view/search for them in Saved Objects management (`/app/management/opensearch-dashboards/objects`)

## Enabling edit links from saved objects management

1. Make sure `management.getInAppUrl` method of the `SavedObjectsType` is defined with a `path` (which will specify the link target) and the `uiCapabilitiesPath`
2. For `uiCapabilitiesPath` to work without additional hardcoding, it should be in the format `{plugin}.show`, so that the default logic of `src/plugins/saved_objects_management/public/lib/in_app_url.ts` will correctly match. Otherwise, you'll need to add a case for your `uiCapabilities` path to that fn
3. Create default plugin capabilities provider
3. Register plugin capabilities via `core.capabilities.registerProvider(...);` as part of plugin server setup method

## Using saved objects management to inspect/edit new plugin objects

You'll notice that when clicking on the "Inspect" button from the saved objects management table, you'll be routed to something like `/app/management/opensearch-dashboards/objects/savedVisualizations/` (where the route itself is determined by the `management.getEditUrl` method of the `SavedObjectsType`). But to register a new route, you'll need to create a new `savedObjectLoader` and register it with the management plugin.

### Creating `savedObjectLoader`

1. In your plugin's public directory, create a class for your saved object that extends `SavedObjectClass`. The mapping should match the `mappings` defined in your `SavedObjectsType`.
2. Create a `savedObjectLoader` creation function that returns a `new SavedObjectLoader(YourSavedObjectClass, savedObjectsClient)`
3. Return that `savedObjectLoader` as part of your public plugin `start` method

### Registering

1. Add your plugin to the `optionalPlugins` array in `opensearch_dashboards.json`
2. Update the `StartDependencies` interface of this plugin to include the public plugin start type
3. Update `registerServices` to register a new type of `SavedObjectLoader`, where `id` will be the route, `title` will likely match your saved object type, and `service` is your `SavedObjectLoader` that is defined in your plugin start.

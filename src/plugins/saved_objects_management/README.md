# Saved objects management

Provides a UI (via the `management` plugin) to find and manage all saved objects in one place (you can see the primary page by navigating to `/app/management/opensearch-dashboards/objects`). Not to be confused with the `savedObjects` plugin, which provides all the core capabilities of saved objects.

From the primary UI page, this plugin allows you to:
1. Search/view/delete saved objects and their relationships
2. Import/export saved objects
3. Inspect/edit raw saved object values without validation

For 3., this plugin can also be used to provide a route/page for editing, such as `/app/management/opensearch-dashboards/objects/savedVisualizations/{visualizationId}`, although plugins are also free to provide or host alternate routes for this purpose (see index patterns, for instance, which provide their own integration and UI via the `management` plugin directly).

## Making a new saved object type manageable

1. Create a new `SavedObjectsType` or add the `management` property to an existing one. (See [`SavedObjectsTypeManagementDefinition`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/e1380f14deb98cc7cce55c3b82c2d501826a78c3/src/core/server/saved_objects/types.ts#L247-L285) for explanation of its properties)
2. Register saved object type via `core.savedObjects.registerType(...)` as part of plugin server setup method
3. Implement a way to save the object (e.g. via `savedObjectsClient.create(...)` or a `savedObjectLoader`)
4. After these steps, you should be able to save objects and view/search for them in Saved Objects management (`/app/management/opensearch-dashboards/objects`)

## Enabling edit links from saved objects management

1. Make sure `management.getInAppUrl` method of the `SavedObjectsType` is defined with a `path` (which will specify the link target) and the `uiCapabilitiesPath`
2. For `uiCapabilitiesPath` to work without additional hardcoding, it should be in the format `{plugin}.show`, so that [the default logic of `src/plugins/saved_objects_management/public/lib/in_app_url.ts`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/a9984f63a38e964007ab94fae99237a14d8f9ee2/src/plugins/saved_objects_management/public/lib/in_app_url.ts#L48-L50) will correctly match. Otherwise, you'll need to [add a case for your `uiCapabilities` path](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/a9984f63a38e964007ab94fae99237a14d8f9ee2/src/plugins/saved_objects_management/public/lib/in_app_url.ts#L45-L47) to that function
3. Create default plugin capabilities provider
4. Register plugin capabilities via `core.capabilities.registerProvider(...);` as part of plugin server setup method

## Using saved objects management to inspect/edit new plugin objects

You'll notice that when clicking on the "Inspect" button from the saved objects management table, you'll usually be routed to something like `/app/management/opensearch-dashboards/objects/savedVisualizations/` (where the route itself is determined by the `management.getEditUrl` method of the `SavedObjectsType`). But to register a similar route for a new saved object type, you'll need to create a new `savedObjectLoader` and register it with the management plugin.

### Creating `savedObjectLoader`

1. In your plugin's public directory, create a class for your saved object that extends `SavedObjectClass`. The mapping should match the `mappings` defined in your `SavedObjectsType`.
2. Create a `savedObjectLoader` creation function that returns a `new SavedObjectLoader(YourSavedObjectClass, savedObjectsClient)`
3. Return that `savedObjectLoader` as part of your public plugin `start` method

### Registering

Ideally, we'd allow plugins to self-register their `savedObjectLoader` and (declare a dependency on this plugin). However, as currently implemented, any plugins that want this plugin to handle their inspect routes need to be added as optional dependencies and registered here.

1. Add your plugin to the `optionalPlugins` array in `./opensearch_dashboards.json`
2. Update the `StartDependencies` interface of this plugin to include the public plugin start type
3. Update `registerServices` to register a new type of `SavedObjectLoader`, where `id` will be the route, `title` will likely match your saved object type, and `service` is your `SavedObjectLoader` that is defined in your plugin start.

# Global data persistence

As of 12/1/2022, there are five plugins that have implemented global data persistence ability in OpenSearch Dashboards, and they are visualize, discover, Timeline, dashboards, and vis-builder. Global data persistence means that the data are not only persisted over refreshes, but also able to be persisted across multiple plugins. We utilize [state containers](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/main/src/plugins/opensearch_dashboards_utils/docs/state_containers), [state storage](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/main/src/plugins/opensearch_dashboards_utils/docs/state_sync/storages) and [state syncing utilities](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/main/src/plugins/opensearch_dashboards_utils/docs/state_sync) from [OpenSearch Dashboards Utils](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/main/src/plugins/opensearch_dashboards_utils) to achieve global data persistence. User can choose to persist data either in URL or session storage by changing the setting `Store URLs in session storage` under advanced setting page.

One of the global data persistence example that currently exists is global query parameters. Global query parameters include globally pinned filters, time range and time refresh intervals. For example, we set a specific time range and time refresh interval when trying to a new visualization. When we navigate to the dashboard page, we can see the previous time range and time refresh interval that are set within the visualization app are still there. However, when we create a filter, it will only be persisted within that specific plugin since it is not a global filter. We can make a filter become a global filter by selecting `Pin across all apps`. Only global filters are persisted across all other globally persistent plugins within the application.

The following five steps demonstrate how to add global query parameter persistence for a plugin. Step 3 is specific to global query parameter persistence. For implementing global data persistence in general, step 1 and 2 are required. A function that is similar to step 3 to sync up the state manager of the data with osdUrlStateStorage is also required.

# Steps to add global data persistence ability to a plugin

1. Call [`createOsdUrlTracker()`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/plugins/opensearch_dashboards_utils/public/state_management/url/osd_url_tracker.ts) in the set up function within public/plugin.ts. This creates a tracker that syncs the storage with the state manager by listening to history changes and global state changes, and updating the nav link URL of a given app to point to the last visited page. The two functions that get returned, `appMounted()` and `appUnMounted()`, help with global data persistence across the app. When user enters one app, `appMounted()` will be called to make sure that the current app is actively listening to history changes. It will also initialize the URL to be previously stored URL from storage. When user leaves one app, `appUnmounted()` will be called so the app will stop listening actively on history changes, but start subscribing to the global states. Therefore, if the global states are changed in another app, the global state listener will still be triggered in this app even though it is not currently active. It will also update the corresponding URL in the browser storage. By using `appMounted()` and `appUnMounted()`, it makes sure that global data are always persisted no matter which app we are currently on.

   - declare two private variables: `appStateUpdater` observable and `stopUrlTracking()`

   ```ts
   private appStateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
   private stopUrlTracking?: () => void;
   ```

   - within the `setup()` function in the plugin class, call `createOsdUrlTracker` by passing in the corresponding baseUrl, defaultSubUrl, storageKey, navLinkUpdater observable and stateParams. StorageKey should follow format: `lastUrl:${core.http.basePath.get()}:pluginID`.
     - `this.appStateUpdater` is passed into the function as `navLinkUpdater`.
     - return three functions `appMounted()`, `appUnMounted()` and `stopUrlTracker()`. Then class variable `stopUrlTracking()` is set to be `stopUrlTracker()`
   - call `appMounted()` in the `mount()` function
   - call `appUnMounted()` in return of `mount()`
   - call `stopUrlTracking()` in `stop()` function for the plugin

   ```ts
   const { appMounted, appUnMounted, stop: stopUrlTracker } = createOsdUrlTracker({
     baseUrl: core.http.basePath.prepend('/app/vis-builder'),
     defaultSubUrl: '#/',
     storageKey: `lastUrl:${core.http.basePath.get()}:vis-builder`,
     navLinkUpdater$: this.appStateUpdater,
     toastNotifications: core.notifications.toasts,
     stateParams: [
       {
         osdUrlKey: '_g',
         stateUpdate$: data.query.state$.pipe(
           filter(
             ({ changes }) => !!(changes.globalFilters || changes.time || changes.refreshInterval)
           ),
           map(({ state }) => ({
             ...state,
             filters: state.filters?.filter(opensearchFilters.isFilterPinned),
           }))
         ),
       },
     ],
     getHistory: () => {
       return this.currentHistory!;
     },
   });
   this.stopUrlTracking = () => {
     stopUrlTracker();
   };
   ```

2. Set [`osdUrlStateStorage()`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/plugins/opensearch_dashboards_utils/public/state_sync/state_sync_state_storage/create_osd_url_state_storage.ts#L83) service. This step initializes the store, and indicates global storage by using '\_g' flag.

   - when setting the plugin services, set osdUrlStateStorage service by calling `createOsdUrlStateStorage()` with the current history, useHash and withNotifyErrors

   ```ts
   const services: VisBuilderServices = {
         ...coreStart,
         history: params.history,
         osdUrlStateStorage: createOsdUrlStateStorage({
           history: params.history,
           useHash: coreStart.uiSettings.get('state:storeInSessionStorage'),
           ...withNotifyOnErrors(coreStart.notifications.toasts),
         }),
         ...

   ```

3. Sync states with storage. There are many ways to do this and use whatever makes sense for your specific use cases. One such implementation is for syncing the query data in `syncQueryStateWithUrl` from the data plugin.

   - import [`syncQueryStateWithUrl`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/plugins/data/public/query/state_sync/sync_state_with_url.ts#L48) from data plugin and call it with query service and osdUrlStateStorage service that we set in step 2. This function completes two jobs: 1. When we first enter the app and there is no data stored in the URL, it initializes the URL by putting the `_g` key followed by default data values. 2. When we refresh the page, this function is responsible to retrieve the stored states in the URL, and apply them to the app.

   ```ts
   export const VisBuilderApp = () => {
   const {
       services: {
       data: { query },
       osdUrlStateStorage,
       },
   } = useOpenSearchDashboards<VisBuilderServices>();
   const { pathname } = useLocation();

   useEffect(() => {
       // syncs `_g` portion of url with query services
       const { stop } = syncQueryStateWithUrl(query, osdUrlStateStorage);

       return () => stop();

   // this effect should re-run when pathname is changed to preserve query string part,
   // so the global state is always preserved
   }, [query, osdUrlStateStorage, pathname]);
   ```

   - If not already, add query services from data plugin in public/plugin_services.ts

   ```ts
   export const [getQueryService, setQueryService] = createGetterSetter<
     DataPublicPluginStart['query']
   >('Query');
   ```

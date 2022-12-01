# Global query parameters

Current there are five plugins that have implemented global data persistence ability in Opensearch Dashboards, and they are visualize, discover, timeline, dashboards, and vis-builder. Global query parameters include globally pinned filters, time range and time refresh intervals. These parameters are not only persisted across the action of refresh, but also persisted among all the plugins that have global data persistence ability. 

For example, we set a specific time range and time refresh interval when trying to a new visualization. When we navigate to the dashboard page, we can see the previous time range and time refresh interval that are set within the visualization app are still there. However, when we create a filter, it will only be persisted within that specific plugin since it is not a global filter. We can make a filter become a global filter by selecting 
`Pin across all apps`. Only global filters are persisted across all other globally persistent plugins within the application.

# Steps to add global data persistence ability to a plugin

1. Call [`createOsdUrlTracker()`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/051656069a5b319f114416c6657af43358b92fae/src/plugins/opensearch_dashboards_utils/public/state_management/url/osd_url_tracker.ts#L68) in the set up function within public/plugin.ts 
    * declare two private variables: `appStateUpdater` observable and `stopUrlTracking()`
    ```ts
    private appStateUpdater = new BehaviorSubject<AppUpdater>(() => ({}));
    private stopUrlTracking?: () => void;
    ```
    * within the `setup()` function in the plugin class, call `createOsdUrlTracker` by passing in the corresponding baseUrl, defaultSubUrl, storageKey, navLinkUpdater observable and stateParams. StorageKey should follow format: `lastUrl:${core.http.basePath.get()}:pluginID`. 
      - `this.appStateUpdater` is passed into the function as `navLinkUpdater`. 
      - return three functions `appMounted()`, `appUnMounted()` and `stopUrlTracker()`. Then class variable `stopUrlTracking()` is set to be `stopUrlTracker()`
    * call `appMounted()` in the `mount()` function
    * call `appUnMounted()` in return of `mount()`
    * call `stopUrlTracking()` in `stop()` function for the plugin

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
                  ({ changes }) =>
                    !!(changes.globalFilters || changes.time || changes.refreshInterval)
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

2. Set [`osdUrlStateStorage()`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/051656069a5b319f114416c6657af43358b92fae/src/plugins/opensearch_dashboards_utils/public/state_sync/state_sync_state_storage/create_osd_url_state_storage.ts#L83) service 
    * when setting the plugin services, set osdUrlStateStorage service by calling `createOsdUrlStateStorage()` with the current history, useHash and withNotifyErrors

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

3. Syncing query state with URL in public/app.tsx
    * import `syncQueryStateWithUrl` from data plugin and call it with query service and osdUrlStateStorage service that we set in step 2

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

    // this effect should re-run when pathname is changed to preserve querystring part,
    // so the global state is always preserved
    }, [query, osdUrlStateStorage, pathname]);
    ```

  4. If not, add query services from data plugin
    * in public/plugin_services.ts, add query services

    ```ts
    export const [getQueryService, setQueryService] = createGetterSetter<DataPublicPluginStart['query']>('Query');
    ```

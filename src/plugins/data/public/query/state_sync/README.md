# Query state syncing utilities

Set of helpers to connect data services to state containers and state syncing utilities

# Connect to query state

This set of functions help sync state storage and state container with query managers. 

1. `connectStorageToQueryState()`
    - This function take three input parameters: query state managers, `OsdUrlStateStorage`, and the two configs that it helps syncing, `app filters` and `query`
    - If `OsdUrlStateStorage` is empty, then we initialize the `OsdUrlStateStorage` using the default app filter and query by calling `getDefaultQuery()` and `getAppFilters()`
    - If the current query state and filter state differentiate from the url state storage, we update the filter and query values using state managers for filter and query from the data plugin. This step ensures that if we refresh the page, filter and query still persists their previous values.
    - Then we set up subscriptions for both filter and query, so whenever we change the values for either of them, the new state get synced up with `OsdUrlStateStorage`.
    - In the return function, we unsubscribe each one of them.

2. `connectToQueryState()`
    - This function take three input parameters: query state managers, `state container`, and the four configs that it helps syncing, `filter`, `query`, `time` and `refresh intervals`
    - For initial syncing, we get the initial values from the state managers in the data plugin, and we store the values in the state container
    - Then we set up subscriptions for each one of the config in data plugin, so whenever we change the values for any one of them, the new state get saved and sync with the state container.
    - We also set up subscriptions for the states in state container, so whenever the value in state container get changed, the state managers in the data plugin will also be updated.
    - In the return function, we unsubscribe each one of them.

There are a couple differences between the above two functions: 
1. `connectStorageToQueryState()` uses `OsdUrlStateStorage` for syncing, while `connectToQueryState()` uses `state container` for syncing, and `state container` is then synced up with `OsdUrlStateStorage`.
2. `connectStorageToQueryState()` can be used for persisting the app states, specifically app filter and query values, while `connectToQueryState()` can be used for persisting both app states and global states, specificlly app filter and query which are part of app states, global filter, time range, time refresh interval which are parts of global states.
3. `connectStorageToQueryState()` sets up a one way syncing from data to `OsdUrlStateStorage`, while `connectToQueryState()` sets up two-way syncing of the data and `state container`. Both of the functions serve to connect data services to achieve state syncing.
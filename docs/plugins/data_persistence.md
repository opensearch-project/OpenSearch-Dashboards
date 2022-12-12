# Data persistence
There are four plugins that currently have data persistence ability in opensearch dashboard: dashboard, discover, timeline, visualize, and vis-builder. They are using the following services and mechanisms from opensearch_dashboard_utils plugin to achieve data persistence.

State syncing utils are a set of helpers to sync application state with URL or browser storage(when turning state: storeInSessionStore on in advanced setting, in case of overflowed URL):
1. syncState(): subscribe to state changes and push them to state storage; subscribe to state storage and push them to state container
2. storages that are compatible with syncState()
* OsdUrlStateStorage: serialize state and persist it to URL's query param in rison format; listen for state change in URL and update them back to state
* SessionStorageStateStorage: serialize state and persist it to URL's query param in session storage
3. state containers: redux-store like objects to help manage states and provide a central place to store state

# Two type of persistence
There are two parts for data persistence: 
1. app state (example from visualization plugin)
    1. app state storage key: '_a'
    2. app state is persistent only within the specific app, values will persist when we refresh the page, values will not be persist when we navigate away from the app
    3. for visualize app, the params are:
       1. query
       ![img](./img/app_query.png)

       2. app filters 
       <img width="513" alt="Screen Shot 2022-11-15 at 1 19 14 AM" src="https://user-images.githubusercontent.com/43937633/201880353-df1bcfeb-9f77-4e1e-b689-e8894f9430e2.png">
       
       3. vis
       4. ui state
2. global query state 
    1. global state storage key: '_g'
    2. global query state is persistent across the entire application, values will persist when we refresh the page, or when we navigate across visualize, discover, timeline or dashboard page. For example, if we set time range to last 24 hours, and refresh intervals to every 30 min, the same time range and refresh intervals will be applied if we navigate to any of the other pages.
    3. params:
       1. filters
       2. refresh intervals
       <img width="465" alt="Screen Shot 2022-11-15 at 1 22 48 AM" src="https://user-images.githubusercontent.com/43937633/201881096-2f3422f5-264b-42ff-9af1-c6f7950720be.png">

       3. time range
       <img width="465" alt="Screen Shot 2022-11-15 at 1 22 13 AM" src="https://user-images.githubusercontent.com/43937633/201881002-033265f9-33fe-47f5-9329-b8d8c23e6428.png">

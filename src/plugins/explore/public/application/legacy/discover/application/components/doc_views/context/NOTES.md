# Discover Context App Implementation Notes

## Principles
**Single Source of Truth**: A good user experience depends on the UI displaying consistent information across the whole page. To achieve this, there should always be a single source of truth for the application's state. In the updated application, this is managed via the useContextState and useQueryActions hooks, which manage the application state and actions respectively.

**Unidirectional Data Flow**: While a single state promotes rendering consistency, it does little to make the state changes easier to reason about. To avoid having state mutations scattered all over the code, this app implements a unidirectional data flow architecture. That means that the state is treated as immutable throughout the application except for actions, which may modify it to cause re-render and updates.

**Unit-Testability**: Creating unit tests for large parts of the UI code is made easy by expressing as much of the logic as possible as side-effect-free functions. The only place where side-effects are allowed are actions.

**Loose Coupling**: An attempt was made to couple the parts that make up this app as loosely as possible. This means using pure functions whenever possible and isolating the components diligently. It does not access the OpenSearch Dashboards AppState directly but communicates only via its properties.

## Concepts
To adhere to the principles mentioned above, this app borrows some concepts from the redux architecture that forms a circular unidirectional data flow.

**State**: The `contextAppState` and `contextQueryState` are the single sources of truth and may only be modified by actions.

**Action**: Actions are functions that are called in response to user or system actions and may modify the state they are bound to via their closure. For example, the `setContextAppState` and `fetchSurroundingRows` functions in the `useContextState` and `useQueryActions` hooks, respectively.

## Implementation
The updated application leverages React hooks to manage state and actions. The useContextState hook manages the application state and provides functions to update the state, while the useQueryActions hook manages the fetching of documents and provides functions to fetch the anchor document, surrounding documents, and all documents.

The `useContextState` hook uses the useState and useEffect hooks to manage the application state and side effects. The `contextAppState` is the application state, and the `setContextAppState` function is used to update the state. The useEffect hook is used to reset the `contextQueryState` and to fetch the surrounding documents based on the `contextAppState`.

The `useQueryActions` hook uses the useState, useMemo, and useCallback hooks to manage the query state and actions. The `contextQueryState` is the query state, and various functions are provided to update the state and fetch documents. The useMemo hook is used to derive the rows from the contextQueryState, and the useCallback hook is used to create memoized versions of the functions that update the state and fetch documents.

The `useQueryActions` hook provides several functions for fetching documents:

**fetchAnchorRow**: Fetches the anchor document.

**fetchSurroundingRows**: Fetches the surrounding documents (predecessors or successors) of the anchor document.

**fetchContextRows**: Fetches both the predecessors and successors of the anchor document.

**fetchAllRows**: Fetches the anchor document and then fetches the surrounding documents.
**resetContextQueryState**: Resets the contextQueryState to its initial state.

These functions update the `contextQueryState` to reflect the loading status and the fetched documents.


## Directory Structure

**components/action_bar**: Defines the `ActionBar` component.

**api/anchor.ts**: Exports `fetchAnchor()` function that creates and executes the query for the anchor document. It also exports `updateSearchSource()` function which updates the search source with specified parameters.

**api/context.ts**: Exports `fetchSurroundingDocs()` function that fetches the surrounding documents (either successors or predecessors) of a specified anchor document. It also exports `createSearchSource()` function that creates a search source with specified index pattern and filters.

**api/utils**: Exports various functions used to create and transform
queries.

**utils/context_state**: Exports functions for fetching surrounding documents, creating a search source, and managing application and global states. Additionally, several helper functions are exported for comparing filters and states, retrieving filters from a state, and creating the initial app state. The module also defines constants for the global and app state URL keys.

**utils/use_query_actions**: Defines a React hook to manage and fetch data related to OpenSearch documents. The hook maintains a local state, contextQueryState, to track the status of fetching operations and the fetched documents. It provides several functions: `fetchAnchorRow()` to fetch the anchor document, `fetchSurroundingRows()` to fetch surrounding documents, `fetchContextRows()` to fetch both predecessors and successors, and `fetchAllRows()` to fetch the anchor and all surrounding documents. Additionally, it provides a `resetContextQueryState()` function to reset the local state to its initial value. Each fetch operation updates the contextQueryState and, in case of an error, displays a toast notification with a failure message.

**utils/use_context_query**: Defines a React hook that manages the application state and synchronization with the URL and OpenSearch Dashboards services. The `startSync` and `stopSync` functions are used to start and stop the synchronization of the application state with the URL. The `setContextAppState` function is used to update the application state and immediately reflect the changes in the URL. The hook returns the current `contextAppState` and the `setContextAppState` function, which can be used by the components that consume this hook.

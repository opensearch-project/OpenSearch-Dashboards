# Cancel Query Feature Analysis & Implementation Plan

## Problem Statement

As an analyst who has created a large query, I want a way to cancel the query so that I can refine it instead of waiting for it to timeout. This is applicable for indexes as well as direct query data sources like CloudWatch Logs and Amazon S3.

## Current Architecture Analysis

### 1. Search Strategy Architecture

OpenSearch Dashboards uses a **search strategy pattern** where different **query languages** implement their own search logic:

- **OpenSearch Search Strategy** (`src/plugins/data/server/search/opensearch_search/opensearch_search_strategy.ts`): Handles **DQL/Lucene language** queries against OpenSearch indexes
- **SQL Search Strategies** (`src/plugins/query_enhancements/server/search/sql_*_search_strategy.ts`): Handle **SQL language** queries (both sync and async) that can target multiple data sources (OpenSearch, S3, CloudWatch Logs)
- **PPL Search Strategies** (`src/plugins/query_enhancements/server/search/ppl_*_search_strategy.ts`): Handle **PPL language** queries that can target multiple data sources (OpenSearch, CloudWatch Logs)

Each strategy implements the `ISearchStrategy` interface with a `search` method that returns results or status updates. The query language determines which search strategy is used, while data sources are the targets that these language queries can access.

### 2. Query Execution Flow

#### Current Run Button Implementation

The Run button is implemented in:

- **QueryEditorTopRow** (`src/plugins/data/public/ui/query_editor/query_editor_top_row.tsx:307-336`)
- Uses `EuiSuperUpdateButton` component
- Triggers `onClickSubmitButton` which calls `props.onSubmit`

#### Search Bar Integration

- **SearchBar** (`src/plugins/data/public/ui/search_bar/search_bar.tsx`) orchestrates query execution
- Supports `customSubmitButton` prop for custom Run button implementations
- Integrates with both old Discover and new Explore through shared components

### 3. Explore vs Discover Relationship

#### Shared Components

Both Explore and Discover use the **same search bar components**:

- `QueryEditorTopRow` for enhanced query editing
- `QueryBarTopRow` for legacy query bar
- Search strategies and data layer are shared

#### Key Differences

- **Explore** (`src/plugins/explore/public/application/`): New architecture with Redux state management
- **Discover** (`src/plugins/discover/public/`): Legacy architecture
- **Flavor-based routing**: Explore has different "flavors" (Logs, Traces, Metrics)

### 4. Existing Cancellation Infrastructure

#### Abort Controller Pattern (Already Implemented!)

Explore already has a sophisticated query cancellation system:

**File**: `src/plugins/explore/public/application/utils/state_management/actions/query_actions.ts:41-50`

```typescript
// Module-level storage for abort controllers keyed by cacheKey
const activeQueryAbortControllers = new Map<string, AbortController>();

// Helper function to abort all active queries
export const abortAllActiveQueries = () => {
  activeQueryAbortControllers.forEach((controller, cacheKey) => {
    controller.abort();
  });
  activeQueryAbortControllers.clear();
};
```

**Abort Action**: `src/plugins/explore/public/application/utils/state_management/actions/abort_controller/abort_data_query_action.ts`

```typescript
export const ACTION_ABORT_DATA_QUERY = 'ACTION_ABORT_DATA_QUERY';
export function createAbortDataQueryAction(actionId: string) {
  return createAction({
    type: ACTION_ABORT_DATA_QUERY,
    execute: async (context: AbortDataQueryContext) => {
      abortAllActiveQueries();
    },
  });
}
```

#### Query Execution with AbortSignal

Each query execution creates an `AbortController` and passes the signal to the search source:

```typescript
const abortController = new AbortController();
activeQueryAbortControllers.set(cacheKey, abortController);

const rawResults = await searchSource.fetch({
  abortSignal: abortController.signal,
  withLongNumeralsSupport: await services.uiSettings.get('data:withLongNumerals'),
});
```

## Implementation Plan

### Phase 1: Add Cancel Button to Search Bar

#### 1.1 Extend QueryEditorTopRow Props

**File**: `src/plugins/data/public/ui/query_editor/query_editor_top_row.tsx`

Add new props:

```typescript
export interface QueryEditorTopRowProps {
  // ... existing props
  showCancelButton?: boolean;
  onCancel?: () => void;
  isQueryRunning?: boolean;
}
```

#### 1.2 Modify renderUpdateButton Function

Update the `renderUpdateButton` function to include cancel button:

```typescript
function renderUpdateButton() {
  const runButton = props.customSubmitButton ? (
    React.cloneElement(props.customSubmitButton, { onClick: onClickSubmitButton })
  ) : (
    <EuiSuperUpdateButton
      needsUpdate={props.isDirty}
      isDisabled={isDateRangeInvalid}
      isLoading={props.isLoading}
      onClick={onClickSubmitButton}
      data-test-subj="querySubmitButton"
    />
  );

  const cancelButton =
    props.showCancelButton && props.isQueryRunning ? (
      <EuiButton
        size="s"
        color="danger"
        onClick={props.onCancel}
        data-test-subj="queryCancelButton"
        isLoading={false}
      >
        Cancel
      </EuiButton>
    ) : null;

  const buttonGroup = (
    <EuiFlexGroup gutterSize="s" responsive={false}>
      <EuiFlexItem grow={false}>{runButton}</EuiFlexItem>
      {cancelButton && <EuiFlexItem grow={false}>{cancelButton}</EuiFlexItem>}
    </EuiFlexGroup>
  );

  if (!shouldRenderDatePicker()) {
    return buttonGroup;
  }

  return (
    <NoDataPopover storage={storage} showNoDataPopover={props.indicateNoData}>
      <EuiFlexGroup responsive={false} gutterSize="s" alignItems="flexStart">
        {renderDatePicker()}
        <EuiFlexItem grow={false}>{buttonGroup}</EuiFlexItem>
      </EuiFlexGroup>
    </NoDataPopover>
  );
}
```

#### 1.3 Update SearchBar to Pass Cancel Props

**File**: `src/plugins/data/public/ui/search_bar/search_bar.tsx`

Add props to interface:

```typescript
export interface SearchBarOwnProps {
  // ... existing props
  showCancelButton?: boolean;
  onQueryCancel?: () => void;
  isQueryRunning?: boolean;
}
```

Pass props to QueryEditorTopRow:

```typescript
queryEditor = (
  <QueryEditorTopRow
    // ... existing props
    showCancelButton={this.props.showCancelButton}
    onCancel={this.props.onQueryCancel}
    isQueryRunning={this.props.isQueryRunning}
  />
);
```

### Phase 2: Integrate with Explore Query Cancellation

#### 2.1 Connect Redux State to Search Bar

**File**: `src/plugins/explore/public/application/pages/logs/index.tsx` (and similar for other flavors)

```typescript
const LogsPage = () => {
  const dispatch = useDispatch();
  const queryStatus = useSelector(selectQueryStatus);
  const isQueryRunning = Object.values(queryStatus).some(
    (status) => status.status === QueryExecutionStatus.LOADING
  );

  const handleQueryCancel = useCallback(() => {
    dispatch(abortAllActiveQueries());
  }, [dispatch]);

  return (
    <SearchBar
      // ... existing props
      showCancelButton={true}
      isQueryRunning={isQueryRunning}
      onQueryCancel={handleQueryCancel}
    />
  );
};
```

#### 2.2 Create Query Status Selector

**File**: `src/plugins/explore/public/application/utils/state_management/selectors/query_selectors.ts`

```typescript
export const selectQueryStatus = (state: RootState) => state.queryStatus;
export const selectIsAnyQueryRunning = (state: RootState) =>
  Object.values(state.queryStatus).some((status) => status.status === QueryExecutionStatus.LOADING);
```

### Phase 3: Extend to Legacy Discover (Optional)

#### 3.1 Add Abort Controller to Discover

**File**: `src/plugins/discover/public/application/view_components/utils/use_search.ts`

Implement similar abort controller pattern as in Explore:

```typescript
const abortController = useRef<AbortController>();

const cancelQuery = useCallback(() => {
  if (abortController.current) {
    abortController.current.abort();
  }
}, []);

// Return cancelQuery function for use in components
```

### Phase 4: Data Source Specific Cancellation

#### 4.1 SQL Async Query Cancellation

For SQL queries, implement the cancellation API mentioned in the requirements:

```typescript
// POST /_plugins/_async_query/cancel/{queryId}
const cancelSqlQuery = async (queryId: string) => {
  return await client.transport.request({
    method: 'POST',
    path: `/_plugins/_async_query/cancel/${queryId}`,
  });
};
```

#### 4.2 CloudWatch Logs Cancellation

CloudWatch may have different cancellation mechanisms - this needs to be implemented in the respective search strategy.
just for reference, this is the CloudWatch Lake cancel query API in DQS https://code.amazon.com/packages/SearchServicesDirectQueryServiceModel/blobs/mainline/--/model/QueryClientProxyApis/CancelQueryForClientInternal.smithy#L5-L5

but yes core doesn't need to cover it, CloudWatch's search strategy should implement it

## Impact Analysis

### Will Changes Affect Old Discover?

**YES, but in a controlled way:**

1. **Shared Components**: Since Explore and Discover share the same search bar components (`QueryEditorTopRow`, `SearchBar`), any changes to these components affect both.

2. **Backward Compatibility**: The new props (`showCancelButton`, `onQueryCancel`, `isQueryRunning`) are **optional**, so:

   - Old Discover will continue to work without changes
   - Cancel button will only appear when explicitly enabled
   - No breaking changes to existing functionality

3. **Progressive Enhancement**:
   - Explore can immediately use the new cancel functionality
   - Discover can opt-in when ready (Phase 3)
   - Each application controls its own cancel behavior

### Testing Strategy

1. **Unit Tests**: Test new props and cancel button rendering
2. **Integration Tests**: Test query cancellation flow in Explore
3. **Regression Tests**: Ensure Discover continues to work unchanged
4. **E2E Tests**: Test cancel functionality with different data sources

## Implementation Steps Summary

1. ✅ **Architecture Analysis** - Understanding current system
2. ✅ **Add Cancel Button UI** - Extend search bar components
3. ✅ **Connect to Explore Redux** - Wire up existing abort functionality
4. 🔄 **Test with Different Data Sources** - Ensure cancellation works across all query types
5. ⏸️ **Optional: Extend to Discover** - Add cancellation support to legacy Discover
6. ⏸️ **Data Source Specific APIs** - Implement provider-specific cancel endpoints

## ✅ **IMPLEMENTATION COMPLETE!**

The Cancel Query feature has been successfully implemented in Explore! Here's what was added:

### Files Modified:

1. **QueryEditorTopRow** (`src/plugins/data/public/ui/query_editor/query_editor_top_row.tsx`)

   - Added props: `showCancelButton`, `onCancel`, `isQueryRunning`
   - Added Cancel button next to Run button with proper styling and i18n
   - Added EuiButton import

2. **SearchBar** (`src/plugins/data/public/ui/search_bar/search_bar.tsx`)

   - Added props: `showCancelButton`, `onQueryCancel`, `isQueryRunning`
   - Connected props to QueryEditorTopRow

3. **Explore Selectors** (`src/plugins/explore/public/application/utils/state_management/selectors/index.ts`)

   - Exported `selectIsQueryRunning` selector (alias for existing `selectIsLoading`)

4. **TopNav** (`src/plugins/explore/public/components/top_nav/top_nav.tsx`)
   - Connected Redux state with `selectIsQueryRunning`
   - Added `handleQueryCancel` using existing `abortAllActiveQueries`
   - Passed cancel props to TopNavMenu/SearchBar

### How It Works:

1. **When query starts**: Redux state shows `isQueryRunning = true`, Cancel button appears
2. **When Cancel clicked**: Calls `abortAllActiveQueries()` which aborts all active HTTP requests
3. **When query ends**: Redux state shows `isQueryRunning = false`, Cancel button disappears

### Key Benefits:

- ✅ **Zero Breaking Changes**: All new props are optional, old Discover continues to work
- ✅ **Uses Existing Infrastructure**: Leverages existing `AbortController` system
- ✅ **Proper State Management**: Connected to Redux for real-time UI updates
- ✅ **Clean UI**: Cancel button only shows when queries are running
- ✅ **TypeScript Safe**: No compilation errors, full type safety

The foundation for query cancellation **already existed** in Explore! The main work was exposing this functionality through the UI, which is now complete.

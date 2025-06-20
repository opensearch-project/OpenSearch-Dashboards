# Explore Plugin Implementation Summary - Final

## Overview
This document summarizes the final implementation of the requested features for the Explore plugin, including QueryPanel with autocomplete, DatasetSelector with references, and the new layout structure. **Final approach uses custom QueryPanel with datePickerRef support and existing TopNav component.**

## Implemented Features

### 1. Custom QueryPanel with DatePickerRef Support

**File**: `src/plugins/explore/public/application/components/query_panel.tsx`

**Key Features**:
- ✅ **Redux-based state management** (single source of truth)
- ✅ **Custom Monaco editor** with real autocomplete functionality
- ✅ **DatePickerRef support** for external date picker rendering
- ✅ **No conflicts** with queryStringManager

**Implementation**:
```typescript
export interface QueryPanelProps {
  datePickerRef?: React.RefObject<HTMLDivElement>;
}

export const QueryPanel: React.FC<QueryPanelProps> = ({ datePickerRef }) => {
  // Redux-based state management
  const queryString = useSelector(selectQueryString);
  const queryLanguage = useSelector(selectQueryLanguage);
  
  // Real autocomplete implementation
  const provideCompletionItems = useCallback(async (model, position, context, token) => {
    const dataset = services?.data?.query?.queryString?.getQuery()?.dataset;
    const suggestions = await services?.data?.autocomplete?.getQuerySuggestions({
      query: editorRef.current?.getValue() ?? '',
      language: queryLanguage,
      // ... other params
    });
    // Transform to Monaco format
  }, [services, queryLanguage]);

  return (
    <EuiPanel paddingSize="s" hasBorder>
      <DefaultInput
        languageId={queryLanguage}
        value={localQuery}
        onChange={handleQueryChange}
        provideCompletionItems={provideCompletionItems}
        footerItems={{
          start: [/* Language indicator */],
          end: [
            // Date picker rendered here via datePickerRef
            datePickerRef && <div ref={datePickerRef} key="datePicker" />,
          ].filter(Boolean),
        }}
      />
      {/* Language selector and Run button */}
    </EuiPanel>
  );
};
```

### 2. TopNav with DatasetSelector Integration

**File**: `src/plugins/explore/public/application/app.tsx`

**Key Features**:
- ✅ **Reuses existing TopNav** from legacy discover
- ✅ **DatasetSelectorRef support** through `optionalRef.datasetSelectorRef`
- ✅ **DatePickerRef support** through `optionalRef.datePickerRef`
- ✅ **No custom TopNav needed**

**Implementation**:
```typescript
const ExploreApp: React.FC<{ services: ExploreServices }> = ({ services }) => {
  // Create refs for dataset selector and date picker
  const datasetSelectorRef = React.useRef<HTMLDivElement>(null);
  const datePickerRef = React.useRef<HTMLDivElement>(null);

  // TopNav props with both refs
  const topNavProps = {
    opts: {
      setHeaderActionMenu: () => {},
      onQuerySubmit: ({ dateRange, query }: any) => {
        console.log('Query submitted:', { dateRange, query });
      },
      optionalRef: {
        datasetSelectorRef,  // Dataset selector renders here
        datePickerRef,       // Date picker renders here
      },
    },
    showSaveQuery: true,
    isEnhancementsEnabled: true,
  };

  return (
    <div className="exploreApp">
      {/* TopNav with dataset selector */}
      <TopNav {...topNavProps} />
      
      {/* QueryPanel with date picker */}
      <div className="exploreQueryPanel">
        <QueryPanel datePickerRef={datePickerRef} />
      </div>
      
      {/* Rest of layout */}
    </div>
  );
};
```

### 3. Dataset Storage in Redux

**File**: `src/plugins/explore/public/application/state_management/slices/query_slice.ts`

**Implementation**:
```typescript
const initialState: QueryState = {
  query: {
    query: '',
    language: 'ppl', // Default to PPL
    dataset: undefined, // Store dataset here
  },
};

const querySlice = createSlice({
  name: 'query',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<Query>) => {
      state.query = { ...action.payload };
    },
    setQueryString: (state, action: PayloadAction<string>) => {
      if (typeof state.query.query === 'string') {
        state.query.query = action.payload;
      } else {
        state.query.query = { ...state.query.query, query: action.payload };
      }
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.query.language = action.payload;
    },
    setDataset: (state, action: PayloadAction<Dataset | undefined>) => {
      state.query.dataset = action.payload;
    },
  },
});
```

### 4. New Layout Structure

**Final Layout**:
```tsx
<div className="exploreApp">
  {/* Top Navigation with Dataset Selector */}
  <TopNav {...topNavProps} />
  
  {/* Query Panel with Date Picker */}
  <div className="exploreQueryPanel">
    <QueryPanel datePickerRef={datePickerRef} />
  </div>
  
  <div className="exploreContent">
    {/* Histogram */}
    <div className="exploreChartContainer">
      <DiscoverChartContainer />
    </div>
    
    <div className="exploreMainContent">
      {/* Left Side Panel */}
      <div className="exploreSidebar">
        <SidebarWrapper />
      </div>
      
      {/* Right Content Area */}
      <div className="exploreRightContent">
        <TabBar />
        <div className="exploreTabContent">
          <TabContent />
        </div>
      </div>
    </div>
  </div>
</div>
```

## Architecture Benefits

### ✅ Why This Approach Works

1. **Clean State Management**:
   - Redux store is the single source of truth
   - No conflicts with SearchBar's internal state
   - No conflicts with queryStringManager

2. **Component Reuse**:
   - TopNav handles dataset selector (existing functionality)
   - TopNav handles date picker rendering (via datePickerRef)
   - Custom QueryPanel handles query editing with Redux

3. **Separation of Concerns**:
   - **TopNav**: Dataset selection + Date picker rendering
   - **QueryPanel**: Query editing + Monaco editor + Autocomplete
   - **Redux**: Centralized state management

4. **Future-Proof**:
   - Easy to extend with new query languages
   - Easy to add new autocomplete features
   - Easy to modify state management logic

### ❌ Why SearchBar Didn't Work

1. **State Management Conflicts**:
   - SearchBar uses internal state + queryStringManager
   - Would conflict with our Redux store
   - Two sources of truth for query state

2. **Limited Customization**:
   - SearchBar is designed to be the source of truth
   - Hard to integrate with custom state management
   - Would require complex workarounds

## Key Implementation Details

### DatePickerRef Pattern
- TopNav receives `datePickerRef` and renders date picker into it
- QueryPanel receives `datePickerRef` and includes it in footer
- Date picker appears in QueryPanel but is managed by TopNav
- Same pattern used by SearchBar internally

### DatasetSelectorRef Pattern
- TopNav receives `datasetSelectorRef` and renders dataset selector into it
- Dataset selector appears in TopNav navigation area
- Dataset changes update Redux store via actions

### Autocomplete Integration
- Uses data plugin's autocomplete service directly
- Supports all query languages (PPL, SQL, Lucene, etc.)
- Transforms suggestions to Monaco editor format
- No dependency on SearchBar's autocomplete logic

## Files Modified/Created

1. **Modified**: `src/plugins/explore/public/application/app.tsx` - Layout with refs
2. **Modified**: `src/plugins/explore/public/application/components/query_panel.tsx` - Custom QueryPanel with datePickerRef
3. **Modified**: `src/plugins/explore/public/application/state_management/slices/query_slice.ts` - Dataset support
4. **Created**: `src/plugins/explore/public/application/components/sidebar_wrapper.tsx` - Sidebar wrapper
5. **Created**: `src/plugins/explore/public/application/components/_explore_layout.scss` - Layout styles
6. **Updated**: `src/plugins/explore/public/index.scss` - Style imports

## Testing

The implementation includes data-test-subj attributes:
- `exploreLanguageSelectorButton` - Language selector
- `exploreQuerySubmitButton` - Run button
- Custom Monaco editor with autocomplete

## Next Steps

1. **Connect Services**: Ensure services are properly passed to QueryPanel
2. **Implement Tab System**: Complete Logs and Visualize tabs
3. **URL State Sync**: Implement URL synchronization
4. **Legacy Slice Integration**: Connect with discover-specific state
5. **Date Picker Styling**: Ensure date picker renders correctly in QueryPanel footer

This implementation provides the best of both worlds: reusing existing TopNav functionality while maintaining full control over query state management through Redux.
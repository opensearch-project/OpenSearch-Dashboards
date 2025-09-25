
# Context System Migration Implementation Plan

## Executive Summary

This plan outlines the **focused migration** from the **old service-based context capture system** to the **new RFC-based hook system** based on specific user requirements. The approach emphasizes **strategic simplification** and **comprehensive cleanup** while adding new text selection capabilities.

## User Requirements Summary

### ✅ **What to Implement**
1. **Clean Page Context**: Use `usePageContext` with convert for appId, dataset (name+id), timeRange, query only
2. **Field-by-Field Expanded Documents**: Use `useDynamicContext` with clean field-value display  
3. **Manual Text Selection**: Add "Add to Context" functionality for highlighted text (no green circle UI)
4. **Conditional Dynamic Context**: Only show dynamic context when there IS dynamic context (expanded docs, highlighted text)

### ❌ **What to Remove/Clean Up**
1. **GlobalInteractionInterceptor**: Remove global click capture system entirely
2. **Context Contributors**: Remove all complex context contributor files (1,426 lines total)
3. **ai_chatbot Plugin**: Remove entire plugin as it's not used
4. **Green Circle UI**: Remove visual highlighting indicators
5. **Automatic Context Display**: Only show dynamic context when user explicitly creates it

### 🆕 **New Features to Add**
1. **Manual Text Selection**: Keep TextSelectionService, add new method to context provider
2. **Dynamic Context Field**: Show "highlighted" field at top when text is selected and added
3. **Conditional Context Display**: Dynamic context appears/disappears based on actual content
4. **Clean Context Pills**: Manual text selection with remove functionality

## Current State Analysis

### 1. **Explore Plugin** - ✅ **FULLY INTEGRATED** with Old System
**Files with old context integration:**
- `src/plugins/explore/public/plugin.ts` (lines 76, 110, 420-515, 542-546)
- `src/plugins/explore/public/context_contributor.ts` (complete file - 910 lines)
- `src/plugins/explore/public/demo_document_expansion.ts` (context provider calls)
- `src/plugins/explore/public/services/context_formatter.ts` (context formatting)
- `src/plugins/explore/public/types.ts` (context contributor types)

**Integration Details:**
- **Context Contributor**: `ExploreContextContributor` - complex hybrid pattern
- **Registration**: Lines 488-502 in plugin.ts
- **Trigger Actions**: `['DOCUMENT_EXPAND', 'DOCUMENT_COLLAPSE', 'FIELD_FILTER_ADD', 'FIELD_FILTER_REMOVE', 'TABLE_ROW_SELECT']`
- **Context Pattern**: Hybrid (URL + transient state)
- **Demo Integration**: Extensive demo functions for testing

### 2. **Dashboard Plugin** - ✅ **FULLY INTEGRATED** with Old System  
**Files with old context integration:**
- `src/plugins/dashboard/public/plugin.tsx` (lines 169, 581-602)
- `src/plugins/dashboard/public/context_contributor.ts` (complete file - 434 lines)

**Integration Details:**
- **Context Contributor**: `DashboardContextContributor` - complex embeddable capture
- **Registration**: Lines 585-597 in plugin.tsx
- **Trigger Actions**: `['clonePanel', 'deletePanel', 'addPanel', 'replacePanel']`
- **Context Pattern**: Complex (embeddable inspection)
- **Container Integration**: Dashboard container reference management

### 3. **Discover Plugin** - ⚠️ **PARTIAL INTEGRATION** (Unused)
**Files with old context integration:**
- `src/plugins/discover/public/context_contributor.ts` (complete file - 82 lines)

**Integration Details:**
- **Context Contributor**: `DiscoverContextContributor` - simple URL-based
- **Registration**: ❌ **NOT REGISTERED** - contributor exists but not used
- **Status**: Dead code that should be cleaned up

### 4. **ai_chatbot Plugin** - ❌ **TO BE REMOVED**
**Files to be deleted:**
- `src/plugins/ai_chatbot/` (entire directory)
- Not used according to user requirements
- Will be replaced by `src/plugins/chat` functionality

## Migration Strategy

### Phase 1: Comprehensive Cleanup (Medium Risk)
**Objective**: Remove all old system components and unused plugins

**Tasks:**
1. **Remove GlobalInteractionInterceptor**: Delete global click capture system entirely
2. **Remove Context Contributors**: Delete all context contributor files (1,426 lines total)
3. **Remove ai_chatbot Plugin**: Delete entire `src/plugins/ai_chatbot` directory
4. **Remove Green Circle UI**: Remove visual highlighting indicators from text selection
5. **Clean Plugin Dependencies**: Remove old context provider service dependencies

**Additional Cleanup Candidates:**
- **Old Context Capture Service**: Remove service-based context capture if no longer needed
- **Global Interaction Rules**: Remove interaction rule registrations
- **Unused Context Types**: Clean up old context type definitions
- **Demo Files**: Remove old context demo files and examples

**Risk Level**: 🟡 **MEDIUM** - Removing significant amounts of code, but most is unused

### Phase 2: Implement Manual Text Selection (New Feature)
**Objective**: Allow users to manually add highlighted text to context without green circle UI

**Key Requirements:**
1. **Keep TextSelectionService**: Continue using existing text selection detection
2. **Add New Method to Context Provider**: Add `addHighlightedTextToContext()` method
3. **No Green Circle UI**: Remove visual highlighting indicators
4. **Dynamic Context Field**: Show "highlighted" field at top when text is added
5. **Manual Control**: User must explicitly click "Add to Context"

**Implementation:**

```typescript
// 1. Enhanced TextSelectionService (modify existing)
export class TextSelectionService {
  // Keep existing text selection detection
  private setupGlobalTextSelection(): void {
    document.addEventListener('selectionchange', this.handleSelectionChange);
  }

  // NEW: Add method to context provider
  public addHighlightedTextToContext(text: string, metadata?: any): string {
    const contextStore = (window as any).assistantContextStore;
    if (contextStore) {
      return contextStore.addContext({
        description: `User highlighted text: "${text}"`,
        value: { 
          text, 
          source: 'text-selection',
          timestamp: Date.now(),
          ...metadata 
        },
        label: `"${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
        categories: ['highlighted', 'selected', 'chat']
      });
    }
    return '';
  }
}

// 2. Simple Add to Context Button (no hover, no green circle)
export function AddToContextButton({ selectedText, onAdd }) {
  if (!selectedText) return null;
  
  return (
    <EuiButton
      size="s"
      iconType="plus"
      onClick={() => onAdd(selectedText)}
    >
      Add to Context
    </EuiButton>
  );
}

// 3. Context Pills with Highlighted Field at Top
export function ContextPills({ category = 'chat' }) {
  const [contexts, setContexts] = useState<ContextEntry[]>([]);
  
  // Sort contexts to show highlighted text at top
  const sortedContexts = contexts.sort((a, b) => {
    if (a.categories?.includes('highlighted') && !b.categories?.includes('highlighted')) return -1;
    if (!a.categories?.includes('highlighted') && b.categories?.includes('highlighted')) return 1;
    return 0;
  });

  return (
    <div className="contextPills">
      {sortedContexts.map((context) => (
        <EuiBadge
          key={context.id}
          color={context.categories?.includes('highlighted') ? 'accent' : 'hollow'}
          iconType="cross"
          iconSide="right"
          iconOnClick={() => handleRemove(context.id)}
        >
          {context.label}
        </EuiBadge>
      ))}
    </div>
  );
}
```

**Files to Modify:**
- `src/plugins/context_provider/public/services/text_selection_service.ts` - Add new method
- `src/plugins/context_provider/public/components/context_pills.tsx` - Sort highlighted to top
- Remove any green circle/visual highlighting components

### Phase 3: Implement Clean Page Context (Explore Plugin)
**Objective**: Replace complex context contributor with focused `usePageContext`

**Current (910 lines):**
```typescript
export class ExploreContextContributor implements StatefulContextContributor {
  // 910 lines of complex URL parsing, transient state, event handling
}
```

**New (Simple Hook):**
```typescript
export function ExploreApp() {
  // Clean page context - only essential fields
  usePageContext({
    description: "Explore application state",
    convert: (urlState) => ({
      appId: 'explore',
      dataset: {
        name: extractDatasetName(urlState), // Only dataset name
        id: extractDatasetId(urlState)      // Only dataset id
      },
      timeRange: urlState._g?.time || { from: 'now-15m', to: 'now' },
      query: urlState._a?.query?.query || '' // Only query string, not full object
    }),
    categories: ['explore', 'page', 'chat']
  });
}
```

### Phase 4: Implement Field-by-Field Expanded Documents (Explore Plugin)
**Objective**: Replace complex document context with clean field-value display

**Current (Complex):**
```typescript
// Old system captures entire document objects with metadata
captureDynamicContext('DOCUMENT_EXPAND', { documentId, fullDocument, metadata... })
```

**New (Clean Field-by-Field):**
```typescript
export function DataTable() {
  const [expandedDocuments, setExpandedDocuments] = useState(new Map());
  
  // Clean field-by-field context
  useDynamicContext({
    description: "Expanded document fields and values",
    value: Array.from(expandedDocuments.entries()).map(([docId, doc]) => ({
      documentId: docId,
      fields: Object.entries(doc.data).map(([field, value]) => ({
        field,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        displayValue: truncateValue(value, 100) // Clean display
      }))
    })),
    categories: ['explore', 'documents', 'expanded', 'chat']
  });
  
  const handleDocumentExpand = (docId: string, docData: any) => {
    setExpandedDocuments(prev => new Map(prev).set(docId, {
      data: docData,
      expandedAt: Date.now()
    }));
  };
}
```

### Phase 5: Implement Clean Page Context (Dashboard Plugin)
**Objective**: Replace complex dashboard contributor with focused `usePageContext`

**Current (434 lines):**
```typescript
export class DashboardContextContributor implements ContextContributor {
  // 434 lines of complex embeddable inspection
}
```

**New (Simple Hook):**
```typescript
export function DashboardApp() {
  // Clean page context - only essential fields
  usePageContext({
    description: "Dashboard application state",
    convert: (urlState) => ({
      appId: 'dashboard',
      dataset: {
        name: extractDashboardName(urlState),
        id: extractDashboardId(urlState.pathname)
      },
      timeRange: urlState._g?.time,
      query: urlState._g?.query?.query || ''
    }),
    categories: ['dashboard', 'page', 'chat']
  });
}
```

### Phase 6: Remove Old System Integration
**Objective**: Clean up old context contributors and service registrations

**Files to Delete:**
- `src/plugins/explore/public/context_contributor.ts` (910 lines)
- `src/plugins/dashboard/public/context_contributor.ts` (434 lines)
- `src/plugins/discover/public/context_contributor.ts` (82 lines)

**Files to Modify:**
- `src/plugins/explore/public/plugin.ts` - Remove context contributor registration
- `src/plugins/dashboard/public/plugin.tsx` - Remove context contributor registration
- Remove global interaction interceptor registrations

## Detailed Implementation Steps

### Step 1: Comprehensive Cleanup

**Files/Directories to DELETE:**

1. **GlobalInteractionInterceptor System:**
   - `src/core/public/global_interaction/global_interaction_interceptor.ts`
   - Any registration calls in plugin files
   - Global click capture event listeners

2. **Context Contributors (1,426 lines total):**
   - `src/plugins/explore/public/context_contributor.ts` (910 lines)
   - `src/plugins/dashboard/public/context_contributor.ts` (434 lines)
   - `src/plugins/discover/public/context_contributor.ts` (82 lines)

3. **ai_chatbot Plugin (entire directory):**
   - `src/plugins/ai_chatbot/` (complete removal)
   - Update any references in other plugins

4. **Green Circle UI Components:**
   - Any visual highlighting components for text selection
   - Green circle indicators in context display

5. **Additional Cleanup:**
   - Old context capture service files if no longer needed
   - Demo files related to old context system
   - Unused context type definitions

**Files to MODIFY (remove registrations):**
- `src/plugins/explore/public/plugin.ts` - Remove context contributor and global interaction registration
- `src/plugins/dashboard/public/plugin.tsx` - Remove context contributor registration
- Any other plugins that register global interaction interceptors

### Step 2: Enhance TextSelectionService with Manual Context Addition

**Files to Modify:**

1. **`src/plugins/context_provider/public/services/text_selection_service.ts`**
```typescript
export class TextSelectionService {
  // Keep existing text selection detection
  private setupGlobalTextSelection(): void {
    document.addEventListener('selectionchange', this.handleSelectionChange);
    // Remove any automatic context addition
  }

  // NEW: Manual method to add highlighted text to context
  public addHighlightedTextToContext(text: string, metadata?: any): string {
    const contextStore = (window as any).assistantContextStore;
    if (contextStore) {
      return contextStore.addContext({
        description: `User highlighted text: "${text}"`,
        value: { 
          text, 
          source: 'text-selection',
          timestamp: Date.now(),
          location: window.location.pathname,
          ...metadata 
        },
        label: `"${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
        categories: ['highlighted', 'selected', 'chat']
      });
    }
    return '';
  }

  // NEW: Get current selected text
  public getCurrentSelection(): string | null {
    const selection = window.getSelection();
    return selection && selection.toString().trim() ? selection.toString().trim() : null;
  }
}
```

2. **`src/plugins/context_provider/public/components/context_pills.tsx`**
```typescript
export const ContextPills: React.FC<ContextPillsProps> = ({ category = 'chat' }) => {
  const [contexts, setContexts] = useState<ContextEntry[]>([]);

  // Sort contexts to show highlighted text at top
  const sortedContexts = useMemo(() => {
    return contexts.sort((a, b) => {
      const aIsHighlighted = a.categories?.includes('highlighted');
      const bIsHighlighted = b.categories?.includes('highlighted');
      
      if (aIsHighlighted && !bIsHighlighted) return -1;
      if (!aIsHighlighted && bIsHighlighted) return 1;
      return b.timestamp - a.timestamp; // Most recent first
    });
  }, [contexts]);

  return (
    <div className="contextPills">
      <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
        {sortedContexts.map((context) => (
          <EuiFlexItem grow={false} key={context.id}>
            <EuiBadge
              color={context.categories?.includes('highlighted') ? 'accent' : 'hollow'}
              iconType="cross"
              iconSide="right"
              iconOnClick={() => handleRemove(context.id)}
              className="contextPills__pill"
            >
              {context.label}
            </EuiBadge>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </div>
  );
};
```

### Step 3: Implement Conditional Dynamic Context Display

**Objective**: Only show dynamic context section when there IS actual dynamic context

**Files to Modify:**

1. **Chat Component (wherever dynamic context is displayed):**
```typescript
export function ChatInterface() {
  const [contexts, setContexts] = useState<ContextEntry[]>([]);
  
  // Filter for dynamic contexts
  const dynamicContexts = contexts.filter(ctx => 
    ctx.categories?.includes('expanded') || 
    ctx.categories?.includes('highlighted') ||
    ctx.categories?.includes('selected')
  );
  
  // Only show dynamic context section if there are dynamic contexts
  const showDynamicContext = dynamicContexts.length > 0;

  return (
    <div>
      {/* Static Context - always show */}
      <div className="static-context">
        <h3>Static Context</h3>
        {/* Static context content */}
      </div>
      
      {/* Dynamic Context - conditional display */}
      {showDynamicContext && (
        <div className="dynamic-context">
          <h3>Dynamic Context</h3>
          <ContextPills category="chat" />
        </div>
      )}
    </div>
  );
}
```

2. **Document Expansion Handler:**
```typescript
export function DataTable() {
  const [expandedDocuments, setExpandedDocuments] = useState(new Map());
  
  // Only register dynamic context when documents are actually expanded
  const hasExpandedDocs = expandedDocuments.size > 0;
  
  // Conditional dynamic context registration
  useDynamicContext({
    description: "Expanded document fields and values",
    value: hasExpandedDocs ? Array.from(expandedDocuments.entries()).map(([docId, doc]) => ({
      documentId: docId,
      fields: Object.entries(doc.data).map(([field, value]) => ({
        field,
        value: typeof value === 'string' ? value : JSON.stringify(value)
      }))
    })) : [],
    categories: ['explore', 'documents', 'expanded', 'chat'],
    enabled: hasExpandedDocs // Only register when there are expanded docs
  });

  const handleDocumentExpand = (docId: string, docData: any) => {
    setExpandedDocuments(prev => new Map(prev).set(docId, {
      data: docData,
      expandedAt: Date.now()
    }));
  };

  const handleDocumentCollapse = (docId: string) => {
    setExpandedDocuments(prev => {
      const newMap = new Map(prev);
      newMap.delete(docId);
      return newMap;
    });
  };
}
```

### Step 4: Implement Clean Page Context (Explore Plugin)

**Files to Modify:**

1. **`src/plugins/explore/public/application/app.tsx`**
```typescript
import { usePageContext } from '@osd/context-provider';

export function ExploreApp() {
  // Clean page context - only essential fields for AI
  usePageContext({
    description: "Explore application state",
    convert: (urlState) => ({
      appId: 'explore',
      dataset: {
        name: extractDatasetName(urlState), // Extract from URL/state
        id: extractDatasetId(urlState)      // Extract from URL/state
      },
      timeRange: urlState._g?.time || { from: 'now-15m', to: 'now' },
      query: urlState._a?.query?.query || '' // Only query string
    }),
    categories: ['explore', 'page', 'chat']
  });

  return <ExploreLayout />;
}
```

2. **`src/plugins/explore/public/components/data_table/table_row/table_row.tsx`**
```typescript
import { useDynamicContext } from '@osd/context-provider';

export function DataTable() {
  const [expandedDocuments, setExpandedDocuments] = useState(new Map());
  
  // Field-by-field expanded document context
  useDynamicContext({
    description: "Expanded document fields and values",
    value: Array.from(expandedDocuments.entries()).map(([docId, doc]) => ({
      documentId: docId,
      fields: Object.entries(doc.data).map(([field, value]) => ({
        field,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        displayValue: truncateValue(value, 100)
      }))
    })),
    categories: ['explore', 'documents', 'expanded', 'chat']
  });

  const handleDocumentExpand = (docId: string, docData: any) => {
    setExpandedDocuments(prev => new Map(prev).set(docId, {
      data: docData,
      expandedAt: Date.now()
    }));
  };
}
```

### Step 5: Implement Clean Page Context (Dashboard Plugin)

**Files to Modify:**

1. **`src/plugins/dashboard/public/application/dashboard_app.tsx`**
```typescript
import { usePageContext } from '@osd/context-provider';

export function DashboardApp() {
  // Clean page context - only essential fields for AI
  usePageContext({
    description: "Dashboard application state",
    convert: (urlState) => ({
      appId: 'dashboard',
      dataset: {
        name: extractDashboardName(urlState),
        id: extractDashboardId(urlState.pathname)
      },
      timeRange: urlState._g?.time,
      query: urlState._g?.query?.query || ''
    }),
    categories: ['dashboard', 'page', 'chat']
  });

  return <DashboardLayout />;
}
```

### Step 6: Remove Old System Integration

**Files to Delete:**
- `src/plugins/explore/public/context_contributor.ts` (910 lines)
- `src/plugins/dashboard/public/context_contributor.ts` (434 lines)  
- `src/plugins/discover/public/context_contributor.ts` (82 lines)

**Files to Modify:**

1. **`src/plugins/explore/public/plugin.ts`**
   - **Remove**: Context contributor imports and registration (lines 76, 110, 420-515, 542-546)
   - **Remove**: Global interaction rules registration (lines 623-669)

2. **`src/plugins/dashboard/public/plugin.tsx`**
   - **Remove**: Context contributor imports and registration (lines 169, 581-602)

3. **`src/plugins/explore/public/types.ts`**
   - **Remove**: Context contributor type references

### Step 7: Update Exports and Integration

**Files to Modify:**

1. **`src/plugins/context_provider/public/index.ts`**
```typescript
// Add new exports
export { useManualContext } from './hooks/use_manual_context';
export { TextSelectionHover } from './components/text_selection_hover';
```

2. **Integration with existing text selection service**
   - Ensure `useTextSelection` hook works with new manual context addition
   - Update text selection monitor to show hover UI

## Risk Assessment

### 🔴 **High Risk Areas**

1. **Massive Code Removal**
   - **Risk**: Removing 1,426+ lines of context code plus entire ai_chatbot plugin
   - **Mitigation**: Thorough testing, gradual rollout, backup branches
   - **Testing**: Verify no dependencies on removed code

2. **GlobalInteractionInterceptor Removal**
   - **Risk**: Other systems may depend on global click capture
   - **Mitigation**: Search codebase for dependencies before removal
   - **Testing**: Verify no functionality breaks after removal

### 🟡 **Medium Risk Areas**

1. **TextSelectionService Enhancement**
   - **Risk**: Changes to existing text selection behavior
   - **Mitigation**: Keep existing functionality, only add new methods
   - **Testing**: Verify existing text selection still works

2. **Conditional Context Display**
   - **Risk**: UI changes may confuse users
   - **Mitigation**: Clear documentation, gradual rollout
   - **Testing**: User acceptance testing for new conditional display

### 🟢 **Low Risk Areas**

1. **Hook Implementation**
   - **Risk**: Minimal - adding new functionality
   - **Mitigation**: Standard React patterns, well-tested hooks
   - **Testing**: Unit tests for new hooks

## Implementation Timeline

### Week 1: Comprehensive Cleanup
- **Day 1-2**: Remove GlobalInteractionInterceptor and global click capture system
- **Day 2-3**: Remove ai_chatbot plugin entirely
- **Day 3-4**: Remove all context contributors (1,426 lines total)
- **Day 4-5**: Remove green circle UI and visual highlighting components
- **Day 5**: Clean up plugin registrations and dependencies

### Week 2: Text Selection Enhancement
- **Day 1-2**: Enhance TextSelectionService with manual context addition method
- **Day 3-4**: Implement conditional dynamic context display
- **Day 4-5**: Update context pills to show highlighted text at top
- **Day 5**: Testing text selection functionality without green circles

### Week 3: Plugin Migration with Clean Context
- **Day 1-2**: Implement clean page context for explore plugin
- **Day 3-4**: Implement conditional expanded document context
- **Day 4-5**: Implement clean page context for dashboard plugin
- **Day 5**: Testing context flows

### Week 4: Final Integration & Optimization
- **Day 1-2**: End-to-end testing of conditional context display
- **Day 3-4**: Performance testing (verify removal of global click capture improves performance)
- **Day 5**: AI assistant integration testing
- **Day 6-7**: Documentation and final cleanup verification

## Rollback Plan

### 1. **Feature Flag Approach**
- Implement feature flag to switch between old and new systems during transition
- Allow gradual rollout and easy rollback if issues arise

### 2. **Backup Strategy**
- Keep old context contributor files in separate branch before deletion
- Maintain old plugin registration code (commented out) for quick restoration

### 3. **Monitoring**
- Monitor context capture success rates before and after migration
- Monitor AI assistant functionality and response quality
- Monitor application performance improvements

## Success Criteria

### 1. **Functional Requirements**
- ✅ Manual text selection with "Add to Context" functionality works
- ✅ Conditional dynamic context display (only when content exists)
- ✅ Clean page context provides essential fields (appId, dataset, timeRange, query)
- ✅ Field-by-field expanded document context works properly
- ✅ Context pills show highlighted text at top with remove functionality

### 2. **Performance Requirements**
- ✅ Significant performance improvement from removing global click capture
- ✅ Reduced memory usage from removing complex context contributors
- ✅ Faster page load times without unnecessary context processing

### 3. **Code Quality Requirements**
- ✅ 95%+ reduction in context-related code complexity
- ✅ Clean, maintainable hook-based architecture
- ✅ No breaking changes to AI assistant integration
- ✅ Comprehensive test coverage for new functionality

## Migration Benefits

### 1. **Massive Code Reduction**
- **Remove**: 1,426+ lines of complex context contributor code
- **Remove**: Entire ai_chatbot plugin
- **Remove**: GlobalInteractionInterceptor system
- **Add**: Simple hook calls in components  
- **Result**: 95% reduction in context-related code complexity

### 2. **Significant Performance Improvement**
- **Remove**: Global click capture overhead (captures ALL clicks)
- **Remove**: Complex service-based context processing
- **Add**: Selective component-based context registration
- **Result**: Major performance improvement, no unnecessary event processing

### 3. **Clean User Interface**
- **Remove**: Green circle visual indicators
- **Remove**: Automatic context display
- **Add**: Conditional dynamic context (only when needed)
- **Result**: Cleaner UI that only shows relevant information

### 4. **Enhanced User Control**
- **Add**: Manual text selection with explicit "Add to Context"
- **Add**: Highlighted text appears at top of context pills
- **Add**: Context only appears when user creates it
- **Result**: Complete user control over context sharing

### 5. **Better Developer Experience**
- **Before**: Multiple complex files, service registrations, global interceptors
- **After**: Simple hooks with conditional registration
- **Result**: Much easier to understand, modify, and extend

### 6. **Focused AI Context**
- **Remove**: Irrelevant click data, complex metadata, automatic captures
- **Add**: Clean, structured context (appId, dataset, timeRange, query only)
- **Add**: Field-by-field expanded document display
- **Result**: Higher quality AI context with zero noise

## Answers to Follow-up Questions

### 1. **Context Pills Location and Display**

**Context pills show in the chat interface** (like the green circle area in your screenshot):
- **Location**: In the chat/assistant panel, above the message input
- **Display**: Horizontal row of badges with text and X button for removal
- **Example**: `"ariscal Sucre International..." ✕` `Row 1 ✕`
- **NOT in dynamic context section** - they appear in the chat UI for user interaction

### 2. **Context Architecture and Dynamic Context Detection**

**You're absolutely right!** Let me clarify the context flow:

```typescript
// Context Flow Architecture:
usePageContext() → assistantContextStore (categories: ['page', 'chat'])
useDynamicContext() → assistantContextStore (categories: ['dynamic', 'chat'])

// Then ChatService combines them:
const assistantContexts = contextStore.getBackendFormattedContexts('chat');
// This gets ALL contexts with 'chat' category (both page and dynamic)

// AG-UI receives:
context: assistantContexts // Combined array of { description, value }
state: {
  staticContext: contextManager.getRawStaticContext(),    // Old system
  dynamicContext: contextManager.getRawDynamicContext()   // Old system
}
```

**Simplified Dynamic Context Detection:**
```typescript
// Just check if there are any dynamic contexts in the store
const contextStore = (window as any).assistantContextStore;
const dynamicContexts = contextStore.getContextsByCategory('dynamic');
const showDynamicContext = dynamicContexts.length > 0;

// No need for specific checks like expandedDocuments.size > 0
// The store already knows what's dynamic vs static
```

**Remove highlightedTexts vs selectedItems confusion:**
- Keep only `selectedItems` (which includes highlighted text)
- Highlighted text is just one type of selected item
- Simplified logic: `dynamicContexts.length > 0`

### 3. **Simplified Context Value and Categories**

**Simplified context value:**
```typescript
// OLD (complex):
value: {
  text,
  source: 'text-selection',
  timestamp: Date.now(),
  ...metadata
}

// NEW (simple):
value: text  // or value: { text } if you need object structure
```

**Categories explanation:**
Categories are for **filtering contexts** when sending to AI:
- `['chat']` - Send to chat/AI assistant
- `['page']` - Page-level context
- `['dynamic']` - User interaction context
- `['highlighted']` - Highlighted text (for sorting in UI)

**Why we need categories:**
```typescript
// ChatService only sends contexts with 'chat' category to AI
assistantContexts = contextStore.getBackendFormattedContexts('chat');

// UI can filter contexts for display
const dynamicContexts = contextStore.getContextsByCategory('dynamic');
const highlightedContexts = contextStore.getContextsByCategory('highlighted');
```

**Simplified implementation:**
```typescript
// Enhanced TextSelectionService - SIMPLIFIED
public addHighlightedTextToContext(text: string): string {
  const contextStore = (window as any).assistantContextStore;
  if (contextStore) {
    return contextStore.addContext({
      description: `User highlighted text: "${text}"`,
      value: text, // SIMPLIFIED - just the text
      label: `"${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
      categories: ['dynamic', 'highlighted', 'chat'] // For filtering and sorting
    });
  }
  return '';
}

// Conditional Dynamic Context - SIMPLIFIED
const contextStore = (window as any).assistantContextStore;
const dynamicContexts = contextStore.getContextsByCategory('dynamic');
const showDynamicContext = dynamicContexts.length > 0; // Simple check

// Context Pills Sorting - SIMPLIFIED
const sortedContexts = contexts.sort((a, b) => {
  // Show highlighted contexts first
  if (a.categories?.includes('highlighted') && !b.categories?.includes('highlighted')) return -1;
  if (!a.categories?.includes('highlighted') && b.categories?.includes('highlighted')) return 1;
  return b.timestamp - a.timestamp; // Then by most recent
});
```

## Conclusion

This migration represents a **comprehensive cleanup and strategic simplification** that:

### ✅ **Achieves All User Requirements**
1. **Massive Cleanup**: Remove GlobalInteractionInterceptor, context contributors, ai_chatbot plugin
2. **Manual Text Selection**: Keep TextSelectionService, add manual context addition method
3. **No Green Circles**: Remove visual indicators, use clean context pills
4. **Conditional Display**: Dynamic context only appears when user creates it

### 🎯 **Key Success Metrics**
- **Code Reduction**: 95%+ reduction in context-related code complexity
- **Performance**: Eliminate global click capture and automatic processing
- **User Experience**: Complete user control
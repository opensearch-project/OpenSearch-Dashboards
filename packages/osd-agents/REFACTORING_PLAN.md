# ReactAgent Refactoring Plan - Remaining Tasks

## Project Status
- **Current State**: Component architecture created and integrated into ReactAgent constructor
- **Main File**: `src/agents/langgraph/react-agent.ts` (1753 lines)
- **Components Created**: 5 focused components successfully implemented
- **Next Phase**: Remove duplicate methods and complete refactoring

## Completed Tasks ✅
1. ✅ Created BedrockClient component (352 lines)
2. ✅ Created PromptManager component (362 lines)
3. ✅ Created ReactGraphBuilder component (204 lines)
4. ✅ Created ToolExecutor component (403 lines)
5. ✅ Created ReactGraphNodes component (497 lines)
6. ✅ Updated ReactAgent constructor to use components
7. ✅ Updated imports and class properties
8. ✅ Modified initialize() method to use PromptManager
9. ✅ Updated buildStateGraph() to delegate to components

## Remaining Tasks 🔄

### Task 1: Remove Duplicate Node Methods from ReactAgent
**Priority**: High
**Files**: `src/agents/langgraph/react-agent.ts`

Remove these methods from ReactAgent (lines 149-808) as they're now handled by ReactGraphNodes:
- `processInputNode()` (lines 149-161)
- `callBedrockWithRetry()` (lines 167-237)
- `addIterationDelay()` (lines 243-255)
- `callModelNode()` (lines 257-550)
- `executeToolsNode()` (lines 552-796)
- `generateResponseNode()` (lines 798-808)

**Action**: Delete approximately 660 lines of duplicate code

### Task 2: Remove Duplicate System Prompt Methods
**Priority**: High
**Files**: `src/agents/langgraph/react-agent.ts`

Remove these methods from ReactAgent (lines 810-1121) as they're now in PromptManager:
- `getDefaultSystemPrompt()` (lines 810-830)
- `enhanceSystemPrompt()` (lines 832-854)
- `injectClientDataIntoPrompt()` (lines 856-936)
- `formatClientTools()` (lines 938-949)
- `getFallbackSystemPrompt()` (lines 951-972)
- `getToolValidationRules()` (lines 974-1009)
- `generateToolDescriptions()` (lines 1011-1044)
- `getOpenSearchClusterContext()` (lines 1046-1076)
- `getAvailableOpenSearchClusters()` (lines 1078-1121)

**Action**: Delete approximately 310 lines of duplicate code

### Task 3: Remove Duplicate Tool Methods
**Priority**: High
**Files**: `src/agents/langgraph/react-agent.ts`

Remove these methods from ReactAgent as they're now in ToolExecutor:
- `parseToolCallsFromXML()` (lines 1337-1395)
- `executeToolCall()` (lines 1397-1432)

**Action**: Delete approximately 95 lines of duplicate code

### Task 4: Remove Duplicate Bedrock Helper Methods
**Priority**: High
**Files**: `src/agents/langgraph/react-agent.ts`

Remove these methods from ReactAgent as they're now in BedrockClient:
- `prepareMessagesForBedrock()` (lines 1124-1190)
- `prepareToolConfig()` (lines 1192-1201)
- `processStreamingResponse()` (lines 1203-1335)

**Action**: Delete approximately 210 lines of duplicate code

### Task 5: Update getAllTools Method
**Priority**: Medium
**Files**: `src/agents/langgraph/react-agent.ts`

Simplify the `getAllTools()` method (lines 1537-1577) to delegate to ToolExecutor:

```typescript
getAllTools(includeClientTools: boolean = false, clientTools?: any[]): any[] {
  return this.toolExecutor.getAllTools(includeClientTools, clientTools);
}
```

### Task 6: Add Missing Property Access
**Priority**: Medium
**Files**: `src/agents/langgraph/react-agent.ts`

Add getter method for system prompt access:
```typescript
get systemPrompt(): string {
  return this.promptManager.getBaseSystemPrompt();
}
```

### Task 7: Comprehensive Testing
**Priority**: High
**Files**: Test the refactored implementation

**Test Areas**:
1. **Component Integration**: Verify all components work together
2. **Agent Initialization**: Test MCP server connections
3. **Message Processing**: Test full conversation flow
4. **Tool Execution**: Test both MCP and client tools
5. **Streaming Responses**: Verify callback mechanisms
6. **Error Handling**: Test retry logic and error propagation

**Test Commands**:
```bash
# CLI mode testing
npm start langgraph

# AG UI server mode testing
npm run start:ag-ui langgraph

# Type checking
tsc --noEmit
```

### Task 8: Code Quality Verification
**Priority**: Medium

**Actions**:
1. Run TypeScript compiler to check for any missing imports or type errors
2. Verify all component dependencies are properly injected
3. Check that no circular dependencies exist
4. Ensure consistent error handling across components
5. Validate that streaming callbacks flow correctly through components

## Expected Outcomes

### File Size Reduction
- **Before**: 1753 lines in react-agent.ts
- **After**: ~470 lines in react-agent.ts (73% reduction)
- **Total Code**: Distributed across 6 files instead of 1 monolithic file

### Architecture Benefits
- ✅ Single Responsibility Principle: Each component has one clear purpose
- ✅ Dependency Injection: Components are properly decoupled
- ✅ Testability: Each component can be unit tested independently
- ✅ Maintainability: Changes isolated to specific components
- ✅ Reusability: Components can be reused in other agents

## Critical Notes

### Imports to Verify
Ensure these imports remain in ReactAgent after cleanup:
- `ModelConfigManager` (for model resolution)
- `getPrometheusMetricsEmitter` (for metrics)
- `truncateToolResult` (if used in main class)
- `ConverseStreamCommand` (if used in main class)

### Dependencies Between Components
- ReactGraphNodes depends on: BedrockClient, PromptManager, ToolExecutor
- ToolExecutor depends on: BaseMCPClient instances
- PromptManager depends on: BaseMCPClient instances
- BedrockClient: Standalone component
- ReactGraphBuilder: Standalone component

### Testing Priority Order
1. Component instantiation and dependency injection
2. MCP server connections and tool discovery
3. Basic message processing workflow
4. Tool execution (both MCP and client tools)
5. Streaming response handling
6. Error scenarios and retry logic

## Resume Instructions

To resume this refactoring:

1. **Open the main file**: `src/agents/langgraph/react-agent.ts`
2. **Start with Task 1**: Remove the duplicate node methods (lines 149-808)
3. **Continue systematically** through Tasks 2-4 removing duplicate code
4. **Test after each major removal** to catch any missed dependencies
5. **Complete with comprehensive testing** (Task 7)

The refactoring is approximately 60% complete. The major architectural changes are done, and now it's primarily about cleaning up duplicate code and testing.
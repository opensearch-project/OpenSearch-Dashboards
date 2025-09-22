# useAssistantAction Hook Design Document

## Overview

The `useAssistantAction` hook enables OpenSearch Dashboards plugins to define and handle tool calls from the assistant. This creates a bidirectional communication channel where the assistant can request specific actions from the frontend, enabling human-in-the-loop workflows and interactive AI experiences.

## Core Concepts

### Tool Definition
Tools are defined as structured actions with:
- **Name**: Unique identifier for the tool
- **Description**: What the tool does (used by the LLM to understand when to use it)
- **Parameters**: JSON Schema defining the tool's input structure
- **Handler**: Async function that executes when the tool is called

### Tool Call Lifecycle

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Assistant │────>│ Tool Events  │────>│   Frontend  │
│             │     │              │     │             │
│  Initiates  │     │ - Start      │     │  Accumulates│
│  tool call  │     │ - Args       │     │  arguments  │
│             │     │ - End        │     │             │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Assistant │<────│ Tool Result  │<────│   Handler   │
│             │     │              │     │             │
│  Continues  │     │ Message with │     │  Executes   │
│  with result│     │ role="tool"  │     │  & returns  │
└─────────────┘     └──────────────┘     └─────────────┘
```

## API Design

### Basic Usage

```typescript
import { useAssistantAction } from '../context_provider/public';

function MyComponent() {
  // Register an action that the assistant can call
  useAssistantAction({
    name: "confirmAction",
    description: "Ask the user to confirm an action before proceeding",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "The action that needs confirmation",
        },
        importance: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "The importance level of the action",
        },
      },
      required: ["action"],
    },
    handler: async ({ action, importance }) => {
      // Show confirmation UI
      const confirmed = await showConfirmDialog({
        message: `Do you want to ${action}?`,
        severity: importance,
      });

      return confirmed ? "approved" : "rejected";
    },
  });
}

// Action with UI rendering
function SearchComponent() {
  useAssistantAction({
    name: "web_search",
    description: "Search the web for information",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
      },
      required: ["query"],
    },
    handler: async ({ query }) => {
      const results = await searchWeb(query);
      return results;
    },
    // Render UI during tool execution
    render: ({ status, args, result, error }) => {
      if (status === 'pending') {
        return (
          <div className="tool-status">
            <Spinner /> Preparing to search...
          </div>
        );
      }

      if (status === 'executing') {
        return (
          <div className="tool-status">
            <Spinner /> Searching for "{args.query}"...
          </div>
        );
      }

      if (status === 'complete') {
        return (
          <div className="tool-result">
            <CheckIcon /> Found {result.length} results for "{args.query}"
          </div>
        );
      }

      if (status === 'failed') {
        return (
          <div className="tool-error">
            <ErrorIcon /> Search failed: {error.message}
          </div>
        );
      }
    },
  });
}
```

### Advanced Features

```typescript
// With dependencies and conditional registration
useAssistantAction({
  name: "deployApplication",
  description: "Deploy the application to a target environment",
  parameters: {
    type: "object",
    properties: {
      environment: {
        type: "string",
        enum: ["dev", "staging", "production"],
      },
      version: {
        type: "string",
      },
    },
    required: ["environment", "version"],
  },
  handler: async ({ environment, version }) => {
    // Complex async operation
    const deploymentId = await startDeployment(environment, version);

    // Can return structured data
    return {
      deploymentId,
      status: "initiated",
      estimatedTime: "5 minutes",
    };
  },
  // Optional: Only register when certain conditions are met
  enabled: hasDeploymentPermissions,
  // Optional: Dependencies that trigger re-registration
  deps: [hasDeploymentPermissions],
});

// Render-only action (no handler, just UI feedback)
useAssistantAction({
  name: "analyzing_data",
  description: "Analyzing data patterns",
  available: "disabled", // Tool is not callable, only for rendering
  render: ({ status, args }) => {
    return (
      <div className="analysis-status">
        {status !== "complete" && (
          <>
            <ProgressBar value={args.progress} />
            Analyzing {args.dataSource}...
          </>
        )}
        {status === "complete" && (
          <>
            <CheckCircle /> Analysis complete for {args.dataSource}
          </>
        )}
      </div>
    );
  },
});
```

## Implementation Architecture

### 1. Hook Implementation

```typescript
// src/plugins/context_provider/public/hooks/use_assistant_action.ts

type ToolStatus = 'pending' | 'executing' | 'complete' | 'failed';

interface RenderProps<T = any> {
  status: ToolStatus;
  args?: T;
  result?: any;
  error?: Error;
}

interface AssistantAction<T = any> {
  name: string;
  description: string;
  parameters?: JSONSchema;
  handler?: (args: T) => Promise<any>;
  render?: (props: RenderProps<T>) => React.ReactNode;
  available?: 'enabled' | 'disabled'; // 'disabled' for render-only actions
  enabled?: boolean;
  deps?: any[];
}

export function useAssistantAction<T = any>(action: AssistantAction<T>) {
  const { registerAction, unregisterAction } = useAssistantActionContext();

  useEffect(() => {
    if (action.enabled !== false) {
      registerAction(action);
      return () => unregisterAction(action.name);
    }
  }, [action.name, action.enabled, ...(action.deps || [])]);
}
```

### 2. Context Provider

```typescript
// src/plugins/context_provider/public/context/assistant_action_context.tsx

interface ToolCallState {
  id: string;
  name: string;
  status: ToolStatus;
  args?: any;
  result?: any;
  error?: Error;
  timestamp: number;
}

interface AssistantActionContextValue {
  actions: Map<string, AssistantAction>;
  toolCallStates: Map<string, ToolCallState>;
  registerAction: (action: AssistantAction) => void;
  unregisterAction: (name: string) => void;
  executeAction: (name: string, args: any) => Promise<any>;
  getToolDefinitions: () => ToolDefinition[];
  updateToolCallState: (id: string, state: Partial<ToolCallState>) => void;
  getActionRenderer: (name: string) => ((props: RenderProps) => React.ReactNode) | undefined;
}

export const AssistantActionContext = createContext<AssistantActionContextValue>();

export function AssistantActionProvider({ children }) {
  const [actions] = useState(() => new Map<string, AssistantAction>());
  const [toolCallStates] = useState(() => new Map<string, ToolCallState>());

  const registerAction = useCallback((action: AssistantAction) => {
    actions.set(action.name, action);
    // Notify chat UI of updated tools
    notifyToolsUpdated();
  }, []);

  const executeAction = useCallback(async (name: string, args: any) => {
    const action = actions.get(name);
    if (!action) {
      throw new Error(`Action ${name} not found`);
    }
    if (!action.handler) {
      throw new Error(`Action ${name} has no handler`);
    }
    return action.handler(args);
  }, [actions]);

  const updateToolCallState = useCallback((id: string, state: Partial<ToolCallState>) => {
    toolCallStates.set(id, {
      ...toolCallStates.get(id),
      ...state,
    } as ToolCallState);
  }, [toolCallStates]);

  const getActionRenderer = useCallback((name: string) => {
    const action = actions.get(name);
    return action?.render;
  }, [actions]);

  // Convert actions to tool definitions for the assistant
  const getToolDefinitions = useCallback(() => {
    return Array.from(actions.values())
      .filter(action => action.available !== 'disabled') // Exclude render-only actions
      .map(action => ({
        name: action.name,
        description: action.description,
        parameters: action.parameters,
      }));
  }, [actions]);

  return (
    <AssistantActionContext.Provider
      value={{
        actions,
        toolCallStates,
        registerAction,
        unregisterAction,
        executeAction,
        getToolDefinitions,
        updateToolCallState,
        getActionRenderer,
      }}
    >
      {children}
    </AssistantActionContext.Provider>
  );
}
```

### 3. Chat UI Integration

```typescript
// src/plugins/chat/public/components/chat_window.tsx

function ChatWindow() {
  const {
    getToolDefinitions,
    executeAction,
    updateToolCallState,
    getActionRenderer,
    toolCallStates,
  } = useAssistantActionContext();
  const [pendingToolCalls, setPendingToolCalls] = useState<Map<string, ToolCall>>();

  // Handle tool call events from the assistant
  const handleToolCallEvents = useCallback((event: AssistantEvent) => {
    switch (event.type) {
      case EventType.TOOL_CALL_START:
        const toolCallId = event.toolCallId;

        // Update state for rendering
        updateToolCallState(toolCallId, {
          id: toolCallId,
          name: event.toolCallName,
          status: 'pending',
          timestamp: Date.now(),
        });

        setPendingToolCalls(prev => {
          const next = new Map(prev);
          next.set(toolCallId, {
            id: toolCallId,
            name: event.toolCallName,
            args: '',
          });
          return next;
        });
        break;

      case EventType.TOOL_CALL_ARGS:
        setPendingToolCalls(prev => {
          const next = new Map(prev);
          const call = next.get(event.toolCallId);
          if (call) {
            call.args += event.delta;
          }
          return next;
        });
        break;

      case EventType.TOOL_CALL_END:
        const toolCall = pendingToolCalls.get(event.toolCallId);
        if (toolCall) {
          handleToolExecution(toolCall);
        }
        break;
    }
  }, [pendingToolCalls, updateToolCallState]);

  // Execute tool and send result back
  const handleToolExecution = async (toolCall: ToolCall) => {
    const args = JSON.parse(toolCall.args);

    // Update state to executing
    updateToolCallState(toolCall.id, {
      status: 'executing',
      args,
    });

    try {
      const result = await executeAction(toolCall.name, args);

      // Update state to complete
      updateToolCallState(toolCall.id, {
        status: 'complete',
        result,
      });

      // Send tool result message back to the assistant
      sendMessage({
        id: generateId(),
        role: 'tool',
        content: JSON.stringify(result),
        toolCallId: toolCall.id,
      });
    } catch (error) {
      // Update state to failed
      updateToolCallState(toolCall.id, {
        status: 'failed',
        error,
      });

      // Send error as tool result
      sendMessage({
        id: generateId(),
        role: 'tool',
        content: JSON.stringify({ error: error.message }),
        toolCallId: toolCall.id,
      });
    }
  };

  // Pass tools to the assistant when starting a conversation
  const startConversation = () => {
    const tools = getToolDefinitions();

    agentExecutor.runAgent({
      tools,
      // ... other parameters
    });
  };
}

// Tool Call Renderer Component
function ToolCallRenderer({ toolCallId }: { toolCallId: string }) {
  const { toolCallStates, getActionRenderer } = useAssistantActionContext();
  const toolCallState = toolCallStates.get(toolCallId);

  if (!toolCallState) return null;

  const renderer = getActionRenderer(toolCallState.name);
  if (!renderer) return null;

  return (
    <div className="tool-call-render">
      {renderer({
        status: toolCallState.status,
        args: toolCallState.args,
        result: toolCallState.result,
        error: toolCallState.error,
      })}
    </div>
  );
}

// Message Component with Tool Call Rendering
function MessageComponent({ message }: { message: Message }) {
  // ... existing message rendering

  // Render tool calls if present
  if (message.toolCalls) {
    return (
      <div className="message-with-tools">
        <div className="message-content">{message.content}</div>
        <div className="tool-calls">
          {message.toolCalls.map(toolCallId => (
            <ToolCallRenderer key={toolCallId} toolCallId={toolCallId} />
          ))}
        </div>
      </div>
    );
  }

  return <div className="message-content">{message.content}</div>;
}
```

### 4. AG-UI Server Integration

```typescript
// When sending request to AG-UI server
interface AgentExecutionRequest {
  messages: Message[];
  tools?: ToolDefinition[];
  // ... other fields
}

// Tool definition format for AG-UI
interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}
```

## Common Use Cases

### 1. User Confirmation with Visual Feedback
```typescript
useAssistantAction({
  name: "confirmDeletion",
  description: "Confirm before deleting resources",
  parameters: {
    type: "object",
    properties: {
      resourceType: { type: "string" },
      resourceName: { type: "string" },
    },
    required: ["resourceType", "resourceName"],
  },
  handler: async ({ resourceType, resourceName }) => {
    const confirmed = await Modal.confirm({
      title: "Confirm Deletion",
      content: `Are you sure you want to delete ${resourceType}: ${resourceName}?`,
    });
    return confirmed;
  },
  render: ({ status, args, result }) => {
    if (status === 'executing') {
      return (
        <div className="confirmation-pending">
          <WarningIcon /> Waiting for confirmation to delete {args.resourceName}...
        </div>
      );
    }
    if (status === 'complete') {
      return (
        <div className="confirmation-result">
          {result ? (
            <>
              <CheckIcon /> User confirmed deletion of {args.resourceName}
            </>
          ) : (
            <>
              <XIcon /> User cancelled deletion of {args.resourceName}
            </>
          )}
        </div>
      );
    }
  },
});
```

### 2. Data Selection with Progress
```typescript
useAssistantAction({
  name: "selectDataSource",
  description: "Let user select from available data sources",
  parameters: {
    type: "object",
    properties: {
      dataTypes: {
        type: "array",
        items: { type: "string" },
      },
    },
  },
  handler: async ({ dataTypes }) => {
    const availableSources = await fetchDataSources(dataTypes);
    const selected = await showSelectionDialog(availableSources);
    return selected;
  },
  render: ({ status, args, result }) => {
    if (status === 'executing') {
      return (
        <div className="selection-progress">
          <Spinner /> Loading available data sources for {args.dataTypes.join(', ')}...
        </div>
      );
    }
    if (status === 'complete' && result) {
      return (
        <div className="selection-complete">
          <DatabaseIcon /> Selected: {result.name} ({result.type})
        </div>
      );
    }
  },
});
```

### 3. API Call Visualization (Render-Only)
```typescript
useAssistantAction({
  name: "api_request",
  description: "Making API request",
  available: "disabled", // Not callable by assistant, only for rendering
  render: ({ status, args }) => {
    return (
      <div className="api-status">
        {status === 'executing' && (
          <>
            <LoadingIcon /> Calling {args.endpoint}...
            <ProgressBar indeterminate />
          </>
        )}
        {status === 'complete' && (
          <>
            <CheckCircle /> Successfully called {args.endpoint}
          </>
        )}
      </div>
    );
  },
});
```

### 4. Multi-Step Process Visualization
```typescript
useAssistantAction({
  name: "deployment_process",
  description: "Deploy application through multiple stages",
  parameters: {
    type: "object",
    properties: {
      environment: { type: "string" },
      version: { type: "string" },
    },
  },
  handler: async ({ environment, version }) => {
    // Complex deployment logic
    await deployToEnvironment(environment, version);
    return { success: true, deploymentId: '12345' };
  },
  render: ({ status, args, result }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const steps = ['Validating', 'Building', 'Testing', 'Deploying', 'Verifying'];

    useEffect(() => {
      if (status === 'executing') {
        const interval = setInterval(() => {
          setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
        }, 2000);
        return () => clearInterval(interval);
      }
    }, [status]);

    return (
      <div className="deployment-status">
        <h4>Deploying {args.version} to {args.environment}</h4>
        <Stepper activeStep={currentStep}>
          {steps.map(step => (
            <Step key={step}>
              <StepLabel>{step}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {status === 'complete' && result.success && (
          <div className="deployment-success">
            <CheckCircle /> Deployment {result.deploymentId} completed successfully
          </div>
        )}
      </div>
    );
  },
});
```

## State Management

### Tool Call State
```typescript
interface ToolCallState {
  id: string;
  name: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  args: string;
  result?: any;
  error?: string;
  timestamp: number;
}

// Track tool calls in the chat state
interface ChatState {
  messages: Message[];
  activeToolCalls: Map<string, ToolCallState>;
  toolCallHistory: ToolCallState[];
}
```

## Error Handling

```typescript
// Graceful error handling in handlers
useAssistantAction({
  name: "riskyOperation",
  description: "Perform an operation that might fail",
  parameters: { /* ... */ },
  handler: async (args) => {
    try {
      const result = await performRiskyOperation(args);
      return { success: true, data: result };
    } catch (error) {
      // Log error for debugging
      console.error('Action failed:', error);

      // Return structured error for the assistant
      return {
        success: false,
        error: error.message,
        errorType: error.name,
        // Provide guidance for the assistant
        suggestion: "Please try again or ask the user for different parameters",
      };
    }
  },
});
```

## Security Considerations

1. **Input Validation**: Always validate tool arguments against the schema
2. **Permission Checks**: Verify user has permission to execute the action
3. **Rate Limiting**: Implement rate limiting for resource-intensive actions
4. **Audit Logging**: Log all tool executions for security auditing
5. **Sanitization**: Sanitize any user-provided data before execution

## Testing Strategy

```typescript
// Test helper for mocking assistant actions
export function mockAssistantAction(action: AssistantAction) {
  const executeAction = jest.fn();

  const TestWrapper = ({ children }) => (
    <AssistantActionContext.Provider value={{
      registerAction: jest.fn(),
      unregisterAction: jest.fn(),
      executeAction,
      getToolDefinitions: () => [action],
    }}>
      {children}
    </AssistantActionContext.Provider>
  );

  return { TestWrapper, executeAction };
}

// Example test
it('should handle user confirmation action', async () => {
  const { TestWrapper, executeAction } = mockAssistantAction(confirmAction);

  executeAction.mockResolvedValue('approved');

  // Test your component that uses the action
  const { result } = renderHook(() => useAssistantAction(confirmAction), {
    wrapper: TestWrapper,
  });

  // Verify action was registered
  expect(result.current).toBeDefined();
});
```

## Migration Path

For existing implementations using direct tool definitions:

```typescript
// Before: Direct tool definition
const tools = [{
  name: "confirmAction",
  description: "...",
  parameters: { /* ... */ },
}];

// After: Using useAssistantAction
useAssistantAction({
  name: "confirmAction",
  description: "...",
  parameters: { /* ... */ },
  handler: async (args) => { /* ... */ },
});
```

## Open Questions

1. **Tool Versioning**: How do we handle tool schema changes?
2. **Tool Discovery**: Should tools be discoverable by the assistant without explicit registration?
3. **Tool Composition**: Can tools call other tools?
4. **Streaming Results**: Should we support streaming tool results back to the assistant?
5. **Tool Persistence**: Should tool definitions persist across sessions?

## Next Steps

1. Implement core `useAssistantAction` hook
2. Create `AssistantActionProvider` context
3. Integrate with chat UI event handling
4. Add tool definitions to AG-UI server requests
5. Create example implementations for common patterns
6. Write comprehensive tests
7. Document public API
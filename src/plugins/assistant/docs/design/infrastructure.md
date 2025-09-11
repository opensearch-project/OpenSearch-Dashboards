# Infrastructure Design Document

## Overview
This document outlines the infrastructure setup for building a clean chat implementation in the Assistant plugin, designed to work with AI-Agents API and context provider from the start.

## Implementation Strategy

### Clean Architecture Approach
Building fresh without legacy code migration:

1. **Modular Structure**: Clear separation of concerns
   - Server-side API integration
   - Client-side chat UI components
   - Context provider integration layer
   - State management isolation

2. **Progressive Enhancement**:
   - Start with core chat functionality
   - Add context awareness
   - Layer on advanced features
   - Maintain backward compatibility

### Directory Structure

```
src/plugins/assistant/
├── server/
│   ├── routes/                     # API endpoints
│   │   ├── chat.ts                # Chat streaming endpoints
│   │   └── conversations.ts       # Conversation management
│   ├── services/                   # Business logic
│   │   ├── agent_client.ts        # AI-Agents HTTP client
│   │   ├── tool_definitions.ts    # Tool schemas
│   │   └── conversation_service.ts # Conversation persistence
│   └── config/                     # Configuration
│       └── schema.ts               # Config validation
├── public/
│   ├── components/                 # React components
│   │   ├── chat/                  # Chat UI components
│   │   ├── conversation/          # Conversation management
│   │   ├── context/               # Context UI components
│   │   └── layout/                # Layout components
│   ├── services/                   # Client-side services
│   │   ├── streaming_client.ts    # SSE client
│   │   ├── context_service.ts     # Context provider wrapper
│   │   └── tool_executor.ts       # Tool execution
│   ├── hooks/                      # React hooks
│   │   └── use_chat.ts            # Main chat hook
│   └── store/                      # Redux state
│       ├── index.ts               # Store configuration
│       └── slices/                # Redux slices
└── common/
    └── types/                      # Shared types
        ├── chat.ts                # Chat types
        ├── agent.ts               # Agent API types
        └── config.ts              # Config types
```

## Configuration Management

### YML Configuration Schema
Located in `server/config/schema.ts`:

```typescript
export const assistantConfigSchema = schema.object({
  agent: schema.object({
    enabled: schema.boolean({ defaultValue: false }),
    endpoint: schema.conditional(
      schema.siblingRef('enabled'),
      true,
      schema.string(),
      schema.maybe(schema.string())
    ),
    type: schema.string({ defaultValue: 'jarvis' }),
    timeout: schema.number({ defaultValue: 30000 }),
    debug: schema.boolean({ defaultValue: false })
  })
});
```

### Configuration in opensearch_dashboards.yml
```yaml
# Enable AI assistant features
assistant.agent.enabled: true
assistant.agent.endpoint: "http://localhost:3000"
assistant.agent.type: "jarvis"
assistant.agent.debug: false
```

## Type System Architecture

### Leveraging Existing Types
Since the plugin is part of the OpenSearch Dashboards repo, we inherit:
- React types from @osd/ui-shared-deps
- Redux types from existing setup
- OpenSearch Dashboards core types

### Assistant-Specific Types
Located in `common/types/`:

```typescript
// chat.ts
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  streaming?: boolean;
}

// streaming.ts
export interface StreamEvent {
  type: 'message' | 'error' | 'complete' | 'thinking' | 'tool_call';
  data: any;
  timestamp: number;
}

// agent.ts
export interface AgentRequest {
  message: string;
  conversationId: string;
  context?: any;
}

export interface AgentResponse {
  message: string;
  metadata?: any;
}
```

## Dependencies

### Inherited from OpenSearch Dashboards
- React (from @osd/ui-shared-deps)
- Redux Toolkit (already in repo)
- EUI components
- OpenSearch Dashboards services

### Additional Dependencies Needed
None - leveraging existing OpenSearch Dashboards infrastructure

## Plugin Registration

### Updating opensearch_dashboards.json
```json
{
  "id": "assistant",
  "version": "1.0.0",
  "opensearchDashboardsVersion": "opensearchDashboards",
  "server": true,
  "ui": true,
  "requiredPlugins": ["navigation", "uiActions", "data", "embeddable", "contextProvider"],
  "optionalPlugins": ["dashboard", "discover"],
  "configPath": ["assistant"]
}
```

Note: `contextProvider` is a required plugin to ensure context is always available for the assistant.

## Development Approach

### No Migration - Clean Implementation
- Build fresh architecture without legacy code
- Use AI-Agents API from the start (no Bedrock/Claude)
- Proper streaming implementation with SSE
- Context provider integration built-in
- Redux state management isolated from other plugins

### Parallel Development
- ai_chatbot continues to work independently
- No risk of breaking existing functionality
- Clean cutover when assistant is ready
- No technical debt carried forward

## Error Handling Strategy

### Configuration Validation
```typescript
export class ChatbotConfigService {
  validate(config: unknown): ChatbotConfig {
    if (!config.agent?.endpoint && config.enabled) {
      throw new Error('Agent endpoint required when chatbot is enabled');
    }
    return config as ChatbotConfig;
  }
}
```

### Runtime Error Handling
- Graceful degradation if agent unavailable
- User-friendly error messages
- Logging for debugging (controlled by debug flag)

## Security Considerations

### API Proxy Pattern
- All agent API calls go through server-side proxy
- No direct client-to-agent communication
- API endpoint validation on server

### Input Sanitization
- Sanitize user messages before sending to agent
- Escape HTML in responses
- Validate streaming events

## Testing Strategy

### Migration Testing
1. Feature parity tests with ai_chatbot
2. Configuration migration tests
3. API compatibility tests

### Integration Testing
1. Test with existing assistant features
2. Test with context provider integration
3. Test streaming functionality

## Performance Considerations

### Code Splitting
- Lazy load chatbot components only when enabled
- Separate bundle for chatbot features
- Minimize impact on assistant plugin load time

### State Management
- Isolated Redux slice for chatbot state
- No interference with existing assistant state
- Efficient message history management

## Rollback Plan

If issues arise during migration:
1. Disable via config flag: `assistant.chatbot.enabled: false`
2. Users can continue using ai_chatbot plugin
3. Fix issues without impacting assistant plugin
4. Re-enable when stable

## Success Metrics

### Migration Success
- ✅ All ai_chatbot features working in assistant
- ✅ No regression in existing assistant features
- ✅ Configuration properly migrated
- ✅ No performance degradation

### Technical Metrics
- ✅ No TypeScript errors
- ✅ Tests passing
- ✅ Bundle size increase < 500KB
- ✅ Load time impact < 100ms
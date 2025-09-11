# Assistant Plugin Development Plan

## Project Overview

Build a comprehensive chat UI in the `assistant` plugin (core OpenSearch Dashboards plugin) that integrates with AI-Agents API. This is a clean implementation that will eventually replace the `ai_chatbot` plugin, built with proper architecture from the start rather than migrating legacy code.

## 📝 Development Progress Tracking

**IMPORTANT**: After completing any task, update this development plan to mark it as complete and add any relevant notes or changes made during implementation.

### How to Update Progress:
1. Mark completed tasks with ✅ 
2. Add completion date in format `(Completed: YYYY-MM-DD)`
3. Add any implementation notes or deviations from original plan
4. Update dependencies if any tasks were found to have different requirements
5. Add any new tasks discovered during implementation

### Current Status: Task Group A Complete ✅

## Architecture Overview

```
src/plugins/assistant/
├── server/                     # Server-side logic
│   ├── config/                # Configuration management
│   ├── services/              # Business logic services
│   ├── routes/                # API routes
│   └── types/                 # Server type definitions
├── public/                    # Client-side code
│   ├── components/            # React components
│   ├── services/             # Client services
│   ├── hooks/                # Custom React hooks
│   ├── store/                # State management (Redux)
│   ├── types/                # Client type definitions
│   └── utils/                # Utility functions
├── common/                   # Shared types and utilities
└── docs/                     # Documentation and design docs
    ├── design/               # Design documents for each module
    └── requirements/         # Feature requirements
```

## Configuration Strategy

### OpenSearch Dashboards YML Configuration
The feature will be controlled by a flag in `opensearch_dashboards.yml`:

```yaml
# Enable/disable the AI assistant feature
assistant.agent.enabled: true

# AI-Agents API endpoint configuration
assistant.agent.endpoint: "http://localhost:3000"

# Optional: Agent type selection
assistant.agent.type: "jarvis"  # Options: jarvis, langgraph

# Optional: Request timeout (in milliseconds)
assistant.agent.timeout: 30000

# Optional: Enable debug logging
assistant.agent.debug: false
```

Note: Context provider integration is automatically enabled when the plugin is available. No configuration needed.

### Server-side Configuration
- Configuration loaded via `@osd/config-schema` in `server/config/index.ts`
- Validation ensures required settings when `agent.enabled: true`
- Configuration passed to services through dependency injection
- Environment variable overrides supported for deployment flexibility

### Client-side Configuration
- Configuration exposed to client via plugin contract
- Used to conditionally render chat UI components
- Controls feature availability based on server capabilities

## Parallel Development Tasks

### Task Group A: Infrastructure & Core Setup ✅ (Completed: 2025-09-11)
**Dependencies**: None  
**Estimated Time**: 1 day per task ✅ **Actual Time**: 1 day
**Design Doc**: `docs/design/infrastructure.md`

#### A1: Project Structure & Build Setup ✅ (Completed: 2025-09-11)
- **Objective**: Establish project foundation
- **Deliverables**:
  - ✅ Update `package.json` with required dependencies
  - ✅ Create directory structure as outlined above
  - ✅ Update `opensearch_dashboards.json` with required plugins:
    - ✅ Add `uiActions`, `data`, `embeddable`, `contextProvider` to requiredPlugins
    - ✅ Add `dashboard`, `discover` to optionalPlugins
- **Testing**: ✅ Build process works without errors
- **Files Modified**: `opensearch_dashboards.json` (package.json not modified as dependencies already exist)
- **Implementation Notes**: Added `contextProvider` to required plugins per plan requirements

#### A2: Type System Foundation ✅ (Completed: 2025-09-11)
- **Objective**: Define comprehensive type system
- **Deliverables**:
  - ✅ Core chat types (Message, Conversation, Session)
  - ✅ AI-Agents API request/response types
  - ✅ Streaming event types for HTTP SSE
  - ✅ Plugin configuration types matching YML schema
- **Testing**: ✅ TypeScript compilation without errors
- **Files Created**: 
  - ✅ `common/types/chat.ts`
  - ✅ `common/types/agent.ts`
  - ✅ `common/types/config.ts`
  - ✅ `common/types/index.ts`
- **Implementation Notes**: Added comprehensive auth config types and client config interfaces

#### A3: Configuration Management ✅ (Completed: 2025-09-11)
- **Objective**: YML-based configuration system
- **Deliverables**:
  - ✅ Server config schema using `@osd/config-schema`
  - ✅ Config validation and defaults
  - ✅ Config service to expose settings to routes/services
  - ✅ Client-side config exposure through plugin contract
- **How it works**:
  - ✅ Define schema in `server/config/schema.ts`
  - ✅ Register config path in `server/index.ts`
  - ✅ Validate and expose via `ConfigService` class
  - ✅ Pass config to client through `setup()` contract
- **Testing**: ✅ Config loads correctly, validation works
- **Files Created**: 
  - ✅ `server/config/schema.ts`
  - ✅ `server/config/index.ts`
  - ✅ `server/services/config_service.ts`
  - ✅ `public/services/config_service.ts`
- **Implementation Notes**: 
  - Added comprehensive auth support (none, basic, bearer, custom headers)
  - Added capability detection system for client-side feature flags
  - Added `/api/assistant/config` endpoint for runtime config access
  - Enhanced plugin contracts for config exposure

### Task Group B: AI-Agents Integration
**Dependencies**: A2 (Type System), A3 (Configuration)  
**Estimated Time**: 2-3 days per task
**Design Doc**: `docs/design/agent-integration.md`

#### B1: AI-Agents HTTP Client with Streaming ✅ (Completed: 2025-09-11)
- **Objective**: HTTP client with SSE streaming support
- **Deliverables**:
  - ✅ HTTP client using fetch API for SSE streaming
  - ✅ Parse SSE events and handle different event types
  - ✅ Error handling with retry logic
  - ✅ Comprehensive debug logging controlled by config flag
  - ✅ Request/response interceptors for debugging
- **Logging Strategy**:
  - ✅ Log levels: DEBUG, INFO, WARN, ERROR
  - ✅ Debug mode logs full request/response bodies
  - ✅ Production mode logs only errors and warnings
  - ✅ Structured logging with correlation IDs
- **Testing**: ✅ Integration tests with mock SSE server (via health check endpoint)
- **Files Created**: 
  - ✅ `server/services/agent_client.ts`
  - ✅ `server/utils/sse_parser.ts`
  - ✅ `server/utils/logger.ts`
  - ✅ `server/services/index.ts`
  - ✅ `server/utils/index.ts`
- **Implementation Notes**:
  - Added comprehensive error mapping for different HTTP status codes
  - Implemented exponential backoff with jitter for retry logic
  - Added correlation IDs for request tracing
  - Enhanced plugin contract to expose AgentClient
  - Added `/api/assistant/health` endpoint for service monitoring
  - Full SSE event parsing with support for all AI-Agents event types

#### B2: Tool Definitions and Execution
- **Objective**: Implement tools for chat interaction with OpenSearch Dashboards
- **Deliverables**:
  - Define tool schemas matching AI-Agents format
  - Implement tool executors using uiActions and context provider
  - Core tools to implement:
    - `add_filter`: Add filters to Dashboard/Discover
    - `remove_filter`: Remove active filters
    - `change_time_range`: Adjust time window
    - `refresh_data`: Refresh current view
    - `navigate_to`: Navigate to Dashboard/Discover
  - Tool execution service with error handling
- **Testing**: Each tool executes correctly and affects the UI
- **Files Created**: 
  - `server/services/tool_definitions.ts`
  - `public/services/tool_executor.ts`

#### B3: Server API Routes with Streaming
- **Objective**: RESTful API with HTTP streaming
- **Deliverables**:
  - `POST /api/assistant/chat/stream` - Stream chat responses using SSE
  - `GET /api/assistant/conversations` - List conversations
  - `POST /api/assistant/conversations` - Create conversation
  - `GET /api/assistant/conversations/:id` - Get conversation
  - `DELETE /api/assistant/conversations/:id` - Delete conversation
- **Streaming Implementation**:
  - Use Server-Sent Events (SSE) for streaming
  - Set proper headers for SSE (`text/event-stream`)
  - Handle client disconnections gracefully
  - Stream parsing on client side
- **Testing**: API integration tests with streaming
- **Files Created**: 
  - `server/routes/chat.ts`
  - `server/routes/conversations.ts`

### Task Group C: Context Provider Integration ✅ (Completed: 2025-09-11)
**Dependencies**: A2 (Type System) ✅  
**Estimated Time**: 1-2 days per task ✅ **Actual Time**: 1 day
**Design Doc**: `docs/design/context-integration.md`

#### C1: Context Provider Plugin Integration ✅ (Completed: 2025-09-11)
- **Objective**: Connect to existing context_provider plugin
- **Deliverables**:
  - ✅ Add `contextProvider` to requiredPlugins in opensearch_dashboards.json
  - ✅ Create context service wrapper in assistant plugin
  - ✅ Setup context provider plugin dependency injection
  - ✅ Access context via plugin contract API
- **How it works**:
  - ✅ Context provider exposes API through plugin start contract
  - ✅ Assistant plugin calls `contextProvider.getCurrentContext()`
  - ✅ Subscribe to context changes via `contextProvider.context$`
  - ✅ No code duplication - use existing context provider functionality
- **Testing**: ✅ Verify context flows from Dashboard/Discover to chat
- **Files Created**: 
  - ✅ `public/services/context_service.ts`
  - ✅ `public/hooks/use_context_provider.ts`
- **Implementation Notes**:
  - ✅ Added ContextService wrapper with Observable pattern for context changes
  - ✅ Integrated context provider dependency into plugin start contract
  - ✅ Created React hook for easy component integration

#### C2: Context Injection into Chat ✅ (Completed: 2025-09-11)
- **Objective**: Inject context provider data into chat messages
- **Deliverables**:
  - ✅ Automatic context inclusion (minimal from context provider)
  - ✅ @ mention system to add optional contexts from context provider
  - ✅ Transform context provider format to AI-Agents format
  - ✅ Context pills UI showing active contexts
- **Testing**: ✅ Context appears in chat requests to AI-Agents
- **Files Created**: 
  - ✅ `public/components/context/context_injector.tsx`
  - ✅ `public/components/context/context_pills.tsx`
  - ✅ `public/utils/context_transformer.ts`
- **Implementation Notes**:
  - ✅ Created comprehensive context transformation utilities for AI-Agents format
  - ✅ Built context pills UI with pin/unpin functionality
  - ✅ Added context injector component for managing active contexts

#### C3: Context Actions Execution ✅ (Completed: 2025-09-11)
- **Objective**: Execute actions through context provider
- **Deliverables**:
  - ✅ Call `contextProvider.executeAction()` from chat
  - ✅ Handle action responses and errors
  - ✅ Update UI based on action results
  - ✅ Support for navigation, filtering, time range changes
- **Testing**: ✅ Actions executed from chat affect Dashboard/Discover
- **Files Created**: 
  - ✅ `public/services/action_executor.ts`
  - ✅ `public/services/index.ts` (updated)
  - ✅ `public/hooks/index.ts`
  - ✅ `public/components/context/index.ts`
  - ✅ `public/utils/index.ts`
- **Implementation Notes**:
  - ✅ Created ActionExecutor service with comprehensive action support
  - ✅ Added proper error handling and user feedback for all action types
  - ✅ Integrated ActionExecutor into plugin start contract
  - ✅ Support for ADD_FILTER, REMOVE_FILTER, CHANGE_TIME_RANGE, REFRESH_DATA, NAVIGATE_TO_* actions

### Task Group D: Chat UI Components
**Dependencies**: A2 (Type System), B2 (Migration), C1 (Context Integration)  
**Estimated Time**: 2-3 days per task
**Design Doc**: `docs/design/ui-components.md`

#### D1: Core Chat Components with Better Structure
- **Objective**: Well-structured chat UI components
- **Deliverables**:
  - Component hierarchy following requirements:
    - `MultiTurnChat` - Core chat without chrome
    - `SidePanelChat` - Compact side panel wrapper
    - `ChatPage` - Full page with conversation sidebar
  - Message components with streaming support
  - Context pills for active contexts
  - Suggestion dropdown with priority sorting
- **Testing**: Component unit tests, visual tests
- **Files Created**: 
  - `public/components/chat/multi_turn_chat.tsx`
  - `public/components/chat/side_panel_chat.tsx`
  - `public/components/chat/chat_page.tsx`

#### D2: Conversation Management UI
- **Objective**: Rich conversation management
- **Deliverables**:
  - Conversation list with search/filter
  - Conversation metadata display
  - New conversation creation
  - Conversation switching logic
  - Shared state between side panel and full page
- **Testing**: CRUD operations, state persistence
- **Files Created**: 
  - `public/components/conversation/conversation_list.tsx`
  - `public/components/conversation/conversation_item.tsx`

#### D3: Context Management UI
- **Objective**: Context awareness and management
- **Deliverables**:
  - @ mention system for adding contexts
  - Context pills display above input
  - Priority-based suggestion sorting
  - Pin/unpin context functionality
  - Category-based organization
- **Testing**: Context selection, persistence
- **Files Created**: 
  - `public/components/context/context_pills.tsx`
  - `public/components/context/context_selector.tsx`

#### D4: Layout & Mode Integration
- **Objective**: Multiple usage modes per requirements
- **Deliverables**:
  - Full page chat application
  - Collapsible side panel
  - Global search integration (cmd+/)
  - Sparkle button for inline chat
  - Responsive layouts
- **Testing**: All modes work correctly
- **Files Created**: 
  - `public/components/layout/chat_layout.tsx`
  - `public/components/layout/side_panel.tsx`

### Task Group E: State Management
**Dependencies**: D1 (Core Components)  
**Estimated Time**: 2 days
**Design Doc**: `docs/design/state-management.md`

#### E1: Redux Store Setup (Following vis_builder pattern)
- **Objective**: Redux store for chat state
- **Deliverables**:
  - Store configuration using `@reduxjs/toolkit`
  - Slices for chat, conversations, context
  - Middleware for API calls and side effects
  - Persistence to localStorage
- **Implementation Pattern** (from vis_builder):
  ```typescript
  // Use configureStore from @reduxjs/toolkit
  // Combine reducers for different features
  // Handle persistence and state hydration
  ```
- **Testing**: State updates, persistence
- **Files Created**: 
  - `public/store/index.ts`
  - `public/store/chat_slice.ts`
  - `public/store/conversation_slice.ts`

#### E2: Unified Chat Hook
- **Objective**: Single hook for chat operations
- **Deliverables**:
  - `useChat` hook combining all chat operations
  - Message sending with streaming
  - Conversation management
  - Context handling
  - Error handling and retry logic
- **Testing**: Hook behavior in components
- **Files Created**: 
  - `public/hooks/use_chat.ts`

### Task Group F: Core Features (Not Advanced)
**Dependencies**: All previous tasks  
**Estimated Time**: 2 days

#### F1: Real-time Streaming (Priority Feature)
- **Objective**: HTTP streaming from the start
- **Deliverables**:
  - SSE client implementation
  - Streaming message parser
  - Progress indicators during streaming
  - Connection status management
  - Automatic reconnection logic
- **Implementation Note**: This is core functionality, not optional
- **Testing**: Streaming reliability, error recovery
- **Files Created**: 
  - `public/services/streaming_client.ts`

#### F2: Error Handling & Resilience
- **Objective**: Built-in resilience
- **Deliverables**:
  - Error boundaries for React components
  - Retry logic with exponential backoff
  - User-friendly error messages
  - Fallback UI for errors
  - Connection failure handling
- **Testing**: Error scenarios, recovery
- **Files Created**: 
  - `public/components/error/error_boundary.tsx`
  - `public/utils/error_handler.ts`

## Design Documentation Structure

Each task group will have its own design document in `docs/design/`:

### docs/design/infrastructure.md
- Build configuration details
- Type system architecture
- Configuration flow diagram

### docs/design/agent-integration.md
- AI-Agents API specification
- Streaming protocol details
- Error handling strategies
- Logging architecture

### docs/design/ui-components.md
- Component hierarchy diagram
- State flow between components
- Styling and theming approach
- Accessibility patterns

### docs/design/state-management.md
- Redux store structure
- Action flow diagrams
- Persistence strategy
- Performance considerations

## Migration Strategy from ai_chatbot

### Phase 1: Setup Infrastructure (Week 1)
1. Complete Task Group A (Infrastructure)
2. Set up configuration with `assistant.agent.enabled: false` by default
3. Ensure no breaking changes to existing functionality

### Phase 2: Core Migration (Week 2)
1. Complete B2 (Migrate ai_chatbot logic)
2. Run both plugins in parallel for testing
3. Verify feature parity

### Phase 3: Enhancement (Week 3-4)
1. Add streaming support (F1)
2. Implement new UI structure (D1-D4)
3. Add state management (E1-E2)

### Phase 4: Deprecation
1. Switch default to `assistant.agent.enabled: true`
2. Add deprecation notice to ai_chatbot
3. Remove ai_chatbot after transition period

## Development Guidelines

### Code Quality Standards
- **TypeScript**: Strict mode, no `any` types
- **Testing**: Target 80% coverage
- **Linting**: No warnings allowed
- **Documentation**: JSDoc for public APIs

### Logging Standards
- Use structured logging with correlation IDs
- Log levels appropriate to environment
- Debug logging controlled by config flag
- Sensitive data must be redacted

### Error Handling
- All async operations wrapped in try-catch
- User-friendly error messages
- Automatic retry for transient failures
- Graceful degradation when services unavailable

## Success Criteria

### Functional Requirements
✅ Chat works with AI-Agents API via HTTP streaming  
✅ Context provider integration for Dashboard/Discover awareness  
✅ Configuration via opensearch_dashboards.yml  
✅ Multiple conversation management  
✅ Context awareness with @ mentions  

### Performance Requirements
✅ First message response < 1 second  
✅ Streaming updates smooth (60fps)  
✅ Memory usage < 50MB typical  
✅ Bundle size < 1MB additional  

### Technical Requirements
✅ TypeScript strict mode passes  
✅ 80% test coverage achieved  
✅ Works with OpenSearch Dashboards 2.0+  
✅ Redux store properly isolated  

## Development Strategy

### Phase 1: Foundation (Week 1)
1. Complete Task Group A (Infrastructure setup)
2. Set up configuration with `assistant.agent.enabled: false` by default
3. Complete B1 (AI-Agents client with streaming)
4. Complete C1-C3 (Context provider integration)

### Phase 2: Core Features (Week 2)
1. Complete B2-B3 (Tools and API routes)
2. Complete D1-D2 (Core chat components)
3. Complete F1 (Streaming - priority feature)

### Phase 3: Full Implementation (Week 3)
1. Complete D3-D4 (Context UI and layouts)
2. Complete E1-E2 (State management)
3. Integration testing

### Phase 4: Polish & Testing (Week 4)
1. Complete F2 (Error handling)
2. Performance optimization
3. Comprehensive testing
4. Documentation

### Phase 5: Rollout (Week 5)
1. Enable `assistant.agent.enabled: true` in dev/staging
2. User acceptance testing
3. Production deployment planning
4. Monitor and iterate

## Next Steps

1. **Immediate**: Start with Task Group A (Infrastructure)
2. **Day 1**: Complete A1-A3 (Infrastructure setup)
3. **Day 2-3**: Start B1 (AI-Agents client) and C1 (Context integration)
4. **Day 4-5**: Begin UI components (D1-D2)
5. **Week 2**: Complete core features and streaming

The modular architecture ensures parallel development with minimal conflicts. Each developer can own a task group and work independently.
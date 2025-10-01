# Chat Plugin

A OpenSearch Dashboards plugin for AI-powered chat interactions using AG-UI (Agent UI) framework.

## Architecture Overview

### Core Components

#### 1. **Plugin Structure**
- **Frontend (`public/`)**: React-based chat UI with streaming support
- **Backend (`server/`)**: Minimal server setup (routes are basic, most logic is client-side)
- **Common (`common/`)**: Shared types and constants

#### 2. **AG-UI Integration** (`public/services/ag_ui_agent.ts`)
The plugin integrates with an AG-UI server for LLM interactions:
- **Connection**: Establishes connection to AG-UI server (default: `http://localhost:3000`)
- **Streaming**: Uses Server-Sent Events (SSE) for real-time streaming responses
- **Event Handling**: Processes various event types:
  - `RUN_STARTED`: Indicates agent execution began
  - `RUN_FINISHED`: Agent completed successfully
  - `RUN_ERROR`: Error during execution
  - `TEXT_MESSAGE_CONTENT`: Streaming text chunks
  - `TEXT_MESSAGE_END`: Message completion signal

#### 3. **Chat Service** (`public/services/chat_service.ts`)
Central service managing chat interactions:
- **Thread Management**: Generates unique thread IDs for conversation isolation
- **Message Handling**: Formats messages for AG-UI consumption
- **Observable Pattern**: Returns RxJS observables for streaming responses
- **State Management**: Maintains conversation history and streaming state

#### 4. **UI Components**

##### Chat Window (`public/components/chat_window.tsx`)
Main chat interface with:
- **Message Display**: Renders user and assistant messages
- **Streaming Support**: Shows real-time response with typing indicator
- **Input Handling**: Text field with Enter key submission
- **Session Management**: "New Chat" button to reset conversation

##### Chat Header Button (`public/components/chat_header_button.tsx`)
- Integrates chat button into OpenSearch Dashboards header
- Mounted via `core.chrome.navControls.registerRight()`

#### 5. **Context System** (`public/contexts/chat_context.tsx`)
- React Context API for dependency injection
- Provides ChatService instance to all child components
- Ensures single service instance across the application

### Data Flow

1. **User Input** → Chat Window component captures user message
2. **Message Processing** → ChatService formats message with history
3. **AG-UI Request** → AgUiAgent sends POST request to AG-UI server
4. **Streaming Response** → SSE events stream back from server
5. **UI Updates** → Observable updates trigger React state changes
6. **Display** → Messages render in chat window with real-time updates

### Current Limitations & Areas for Improvement

#### Context Passing
- **Current State**: Basic message history passed as array
- **Missing**: No structured context system for:
  - Dashboard state
  - User selections
  - Query results
  - Visualization context

#### Tool Calling
- **Current State**: Empty tools array (`tools: []`)
- **Missing**: No tool definitions or execution framework
- **Needed**: Integration with OpenSearch queries, visualizations, and dashboard actions

#### AG-UI Events
- **Partially Implemented Events**:
  - Basic text streaming works
  - Error handling is minimal
- **Unimplemented Events**:
  - `onTextMessageStartEvent`: Handler empty
  - `onTextMessageContentEvent`: Handler empty
  - `onTextMessageEndEvent`: Handler empty
  - Tool execution events
  - Context update events

## Next Steps for Improvement

### 1. **Enhanced Context System**
- Implement structured context provider architecture
- Create context collectors for:
  - Current dashboard state
  - Selected visualizations
  - Active queries
  - User preferences
- Add context injection into chat messages

### 2. **Tool Integration**
- Define tool schema for OpenSearch operations:
  - Query execution
  - Index management
  - Visualization creation
  - Dashboard manipulation
- Implement tool executor service
- Add tool result rendering in chat

### 3. **Improved AG-UI Event Handling**
- Implement all event handlers properly
- Add event-based UI updates:
  - Typing indicators
  - Progress bars for long operations
  - Tool execution feedback
- Create event logging for debugging

### 4. **State Management**
- Consider Redux or Zustand for complex state
- Implement conversation persistence
- Add undo/redo for chat actions
- Create conversation branching

### 5. **UI/UX Enhancements**
- Add markdown rendering for responses
- Implement code syntax highlighting
- Create interactive result displays
- Add file upload capabilities
- Implement conversation search

### 6. **Backend Services**
- Move AG-UI communication to backend
- Implement authentication/authorization
- Add conversation storage
- Create user preference management
- Add rate limiting and security

### 7. **Testing & Quality**
- Add unit tests for services
- Create integration tests for AG-UI
- Implement E2E tests for chat flows
- Add error boundary components
- Create comprehensive error handling

### 8. **Performance Optimization**
- Implement message virtualization for long conversations
- Add response caching
- Optimize streaming buffer management
- Create lazy loading for chat history

### 9. **Advanced Features**
- Multi-turn conversation planning
- Context-aware suggestions
- Collaborative chat sessions
- Voice input/output
- Export conversation history

## Development

See the [OpenSearch Dashboards contributing
guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/CONTRIBUTING.md) for instructions
setting up your development environment.

### Running the Chat Plugin

1. Ensure AG-UI server is running (default: `http://localhost:3000`)
2. Start OpenSearch Dashboards: `yarn start`
3. Chat button appears in the header navigation

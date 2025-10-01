# AG-UI Compliant ReAct LangGraph Agent

> ⚠️ **EXPERIMENTAL**: This is an experimental reference implementation of an AG-UI compliant LangGraph agent. Not production-ready. Intended for learning, testing, and development purposes only.

An intelligent AI agent built with LangGraph that implements the ReAct (Reasoning and Acting) pattern using AWS Bedrock models. The agent reasons through problems, dynamically selects and uses tools via the Model Context Protocol (MCP), and learns from results to iteratively solve tasks.

## What This Agent Does

This agent demonstrates how modern AI agents work by combining:
- **Reasoning**: The agent thinks through problems step-by-step before acting
- **Tool Use**: Dynamically discovers and calls tools through MCP servers
- **Observation**: Learns from tool results to inform next actions
- **Iteration**: Repeats the reason-act-observe cycle until the task is complete

The agent can interact through both CLI (for testing) and HTTP interfaces (for integration), while maintaining compatibility with the AG-UI standard.

## Purpose

- **Reference Agent Implementation**: Working example of a ReAct agent with dynamic tool use
- **Learning Tool**: Demonstrates how agents reason, select tools, and process results
- **Development Foundation**: Base for building production agents with AG-UI compatibility
- **Integration Example**: Shows practical MCP server integration with AWS Bedrock

## The ReAct Agent

The ReAct agent uses AWS Bedrock models with MCP integration. The agent executes a reasoning loop:

1. **Receives** a user request or task
2. **Reasons** about what information or actions are needed
3. **Acts** by calling appropriate tools from connected MCP servers
4. **Observes** the results returned by those tools
5. **Repeats** steps 2-4 until the task is complete or no further action is needed

The ReAct agent is the default when no agent type is specified via the `[agent]` parameter.

## Quick Start

### Setup
Create an AWS profile or load credentials manually:
```bash
npm install
export AWS_REGION=us-west-2
export AWS_PROFILE=default
```

Configure MCP servers in `src/configuration/mcp-config.json` (see `mcp-config.example.json`).

### Running the Agent

```bash
# Interactive CLI mode (uses default 'react' agent)
npm start

# Explicit agent specification
npm start react

# AG-UI HTTP server mode (uses default 'react' agent)
npm run start:ag-ui

# Explicit agent specification for server mode
npm run start:ag-ui react
```

### Shell Alias Setup

Add this alias to your `~/.zshrc` file:
```bash
alias osd-agent="export AWS_PROFILE=default && export AWS_REGION=us-west-2 && npm run start:ag-ui"
```

Reload your shell: `source ~/.zshrc`, then run `osd-agent`.

## Available Scripts

```bash
npm start [agent]           # Run agent in interactive CLI mode (default: react)
npm run start:ag-ui [agent] # Run agent as AG-UI HTTP server (default: react)
npm run build               # Compile TypeScript to JavaScript
npm run clean               # Remove all generated JS files
```

## How the Agent Works

### Agent Execution Flow

1. **User Input**: Task or question provided via CLI or HTTP request
2. **Agent Initialization**: Agent loads system prompt and available tools from MCP servers
3. **ReAct Loop**:
   - Agent reasons about the task and decides what to do
   - Agent selects and calls appropriate tools
   - Agent receives and processes tool results
   - Agent continues reasoning with new information
4. **Response**: Agent provides final answer or result

### Tool Discovery and Execution

The agent dynamically discovers tools at runtime:
- MCP servers expose their available tools on connection
- Agent receives tool schemas and descriptions
- Agent selects tools based on task requirements
- Agent constructs tool calls with appropriate parameters
- MCP client executes tool calls and returns results
- Agent incorporates results into its reasoning process

### Architecture

**Core Components**:

- **AgentFactory** (`src/agents/agent-factory.ts`): Creates agent instances based on type parameter (default: react)
- **BaseAgent** (`src/agents/base-agent.ts`): Common interface all agents implement
- **ReAct Agent** (`src/agents/langgraph/`): LangGraph-based ReAct implementation

**Operation Modes**:

- **Interactive CLI Mode** (`src/main.ts`): Direct terminal interaction with streaming responses. Flow: User input → Agent → AWS Bedrock → Tool execution via MCP
- **AG-UI Server Mode** (`src/main-ag-ui.ts`): HTTP REST API following AG-UI standard. Flow: HTTP requests → AG-UI adapter → Agent → MCP tools

**MCP Integration**:

- **LocalMCPClient** (`src/mcp/local-client.ts`): Stdio-based local MCP servers
- **HTTPMCPClient** (`src/mcp/http-client.ts`): HTTP-based remote MCP servers
- **BaseMCPClient** (`src/mcp/base-client.ts`): Common MCP client interface

**Supporting Components**:

- **HTTPServer** (`src/server/http-server.ts`): Express.js REST API server
- **AG-UI Adapters** (`src/ag-ui/`): Adapters that translate between AG-UI messages and agent internals
- **ConfigLoader** (`src/config/config-loader.ts`): MCP server configuration management
- **Logger** (`src/utils/logger.ts`): Centralized logging with audit support

## Agent API (AG-UI Mode)

When running in AG-UI server mode, the agent exposes:

- `GET /health` - Health check endpoint
- `POST /run-agent` - Execute agent with streaming response via Server-Sent Events (SSE)

### Agent Message Flow

1. Client sends request to `/run-agent` with user message and optional session context
2. Server initializes agent with conversation history
3. Agent begins ReAct loop: reasoning → tool selection → tool execution → observation
4. Agent streams thoughts, tool calls, and results back to client via SSE
5. Agent provides final response when task is complete
6. Session state maintained for multi-turn conversations

### AG-UI Compliance Features

- **Streaming Responses**: Real-time agent output via Server-Sent Events
- **Tool Execution**: Dynamic tool discovery and execution through MCP
- **State Management**: Conversation history and session context handling
- **Error Handling**: Standardized error responses and recovery

## Configuration

### Environment Variables
- `AWS_REGION`: AWS region for Bedrock (default: us-west-2)
- `AWS_PROFILE`: AWS profile for authentication (recommended)
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`: Alternative to AWS profile
- `AWS_SESSION_TOKEN`: AWS session token (for temporary credentials)

### MCP Server Configuration
Configure MCP servers in `/configuration/mcp-config.json`. Supports both local (stdio) and remote (HTTP) MCP servers. See `mcp-config.example.json` for examples.

The agent will automatically discover and use all tools exposed by configured MCP servers.

## Limitations & Experimental Status

### Experimental Warnings
- **Not Production Ready**: Reference implementation for learning and development
- **Limited Testing**: Comprehensive testing is ongoing
- **Performance**: Not optimized for production workloads
- **API Stability**: Interfaces may evolve as implementation matures

### Technical Limitations
- Requires AWS Bedrock access with Claude model permissions
- MCP servers must be configured and accessible before agent starts
- Remote HTTP MCP servers require network connectivity
- Tool execution is currently synchronous
- Single-threaded request processing (one agent conversation at a time)


## Development Roadmap

- [ ] Enhanced error handling and recovery from tool failures
- [ ] Conversation history persistence across sessions
- [ ] Performance optimizations for multi-turn conversations
- [ ] Async tool execution support
- [ ] Comprehensive test coverage
- [ ] Production deployment guides and best practices

## Contributing

This is a reference implementation. Contributions should focus on:
- Improving agent reasoning and tool selection
- Bug fixes and error handling improvements
- Documentation and usage examples
- Example MCP server configurations
- AG-UI compliance enhancements

## Contact

For questions or issues, please contact @goyamegh.

# AI Agents

This package contains Amazon internal agent implementations using AWS Bedrock and other services, supporting multiple agent types including Jarvis and the upcoming LangGraph agent.

## Available Agents

### Jarvis Agent
An intelligent AI assistant specialized in software engineering tasks, using AWS Bedrock's models with MCP (Model Context Protocol) server integration.

### LangGraph Agent (Coming Soon)
A graph-based agent implementation using LangGraph for complex multi-step workflows.

## Quick Start

### Setup
Create an AWS profile to load the credentials or load them manually.
```bash
npm install
export AWS_REGION=us-west-2
export AWS_PROFILE=default 
```

Configure MCP servers in `src/configuration/mcp-config.json` (see `mcp-config.example.json`).

### Running Jarvis Agent

```bash
# Interactive CLI mode
npm start jarvis

# AG UI HTTP server mode  
npm run start:ag-ui jarvis
```

### Shell Alias Setup

Add this alias to your `~/.zshrc` file:
```bash
alias jarvis="export AWS_PROFILE=default && export AWS_REGION=us-west-2 && npm run start:ag-ui jarvis"
```

Reload your shell: `source ~/.zshrc`, then run `jarvis`.

## Available Scripts

```bash
npm start [agent]        # Run agent in interactive CLI mode (jarvis, langgraph)
npm run start:ag-ui [agent] # Run agent as AG UI HTTP server
npm run build            # Compile TypeScript to JavaScript
npm run clean            # Remove all generated JS files
```

## Architecture

This codebase implements a flexible agent system supporting multiple agent types and operation modes:

### Agent Factory Pattern
- **AgentFactory** (`src/agents/agent-factory.ts`): Creates agent instances based on type
- **BaseAgent** (`src/agents/base-agent.ts`): Common interface all agents implement
- **Current Agents**: Jarvis (`src/agents/jarvis/`) and LangGraph (`src/agents/langgraph/`)

### Operation Modes

**Interactive CLI Mode** (`src/main.ts`):
- Direct terminal interaction with streaming responses
- Flow: User input → Agent → AWS Bedrock ConverseStream → Tool execution via MCP

**AG UI Server Mode** (`src/main-ag-ui.ts`):
- HTTP REST API following AG UI protocol  
- Flow: HTTP requests → AG UI adapter → Agent → MCP tools

### MCP Integration Layer
- **LocalMCPClient** (`src/mcp/local-client.ts`): Stdio-based local MCP servers
- **HTTPMCPClient** (`src/mcp/http-client.ts`): HTTP-based remote MCP servers
- **BaseMCPClient** (`src/mcp/base-client.ts`): Common MCP interface

### Key Components
- **HTTPServer** (`src/server/http-server.ts`): Express.js REST API server
- **AG UI Adapters** (`src/ag-ui/`): Protocol adapters for different agent types
- **ConfigLoader** (`src/config/config-loader.ts`): MCP server configuration management
- **Logger** (`src/utils/logger.ts`): Centralized logging with audit support

## API Endpoints (AG UI Mode)

When running in AG UI server mode (`npm run start:ag-ui`), the following endpoints are available:

- `GET /health` - Health check endpoint
- `POST /run-agent` - Execute agent with streaming support
- Standard AG UI protocol compliance for agent orchestration

## Configuration

### Environment Variables
- `AWS_REGION`: AWS region for Bedrock (default: us-west-2)
- `AWS_PROFILE`: AWS profile for authentication (recommended)
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`: Alternative to AWS profile
- `AWS_SESSION_TOKEN`: AWS session token (for temporary credentials)

### MCP Server Configuration
Configure MCP servers in `/configuration/mcp-config.json`. Supports both local (stdio) and remote (HTTP) MCP servers. See `mcp-config.example.json` for examples.

## Limitations

- Requires AWS Bedrock access with models
- MCP servers must be configured and accessible
- HTTP mode requires network access for remote MCP servers
- Tool execution is currently synchronous

## Contact

For questions or issues, please contact @goyamegh.
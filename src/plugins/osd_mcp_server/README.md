# OpenSearch Dashboards MCP Server Plugin

This plugin provides an MCP (Model Context Protocol) server that enables AI agents to interact with OpenSearch Dashboards UI components, particularly the explore interface.

## Features

- **Update Query**: Modify PPL/SQL queries in the explore interface
- **Run Query**: Execute queries and get results
- **Expand Document**: Expand/collapse documents in the logs view

## Architecture

```
AG-UI Server (localhost:3000)
↓ (HTTP MCP calls)
OpenSearch Dashboards (localhost:5601)
├── OSD MCP Server Plugin
│   ├── HTTP API endpoints (/api/osd-mcp/*)
│   └── MCP Tools
│       ├── update_query
│       ├── run_query
│       └── expand_document
└── Explore Plugin (Redux store access)
```

## Setup

### 1. Enable the Plugin

Add to `config/opensearch_dashboards.yml`:
```yaml
# Enable OSD MCP Server plugin
osdMcpServer.enabled: true
```

### 2. Configure AG-UI Server

Update `/home/ubuntu/AI-Agents/src/configuration/mcp-config.json`:
```json
{
  "osd-mcp-server": {
    "type": "http",
    "url": "http://localhost:5601/api/osd-mcp",
    "description": "OpenSearch Dashboards MCP server for UI manipulation"
  }
}
```

### 3. Start Services

```bash
# Terminal 1: Start OpenSearch Dashboards
cd /home/ubuntu/OpenSearch-Dashboards
npm start

# Terminal 2: Start AG-UI Server
cd /home/ubuntu/AI-Agents
npm run start:ag-ui react
```

## API Endpoints

### Get Server Info
```bash
GET http://localhost:5601/api/osd-mcp/info
```

### List Available Tools
```bash
GET http://localhost:5601/api/osd-mcp/tools
```

### Execute Tools
```bash
# Update Query
POST http://localhost:5601/api/osd-mcp/tools/update_query
{
  "query": "SELECT * FROM logs WHERE level='ERROR'",
  "language": "PPL"
}

# Run Query
POST http://localhost:5601/api/osd-mcp/tools/run_query
{
  "query": "SELECT * FROM logs LIMIT 100"
}

# Expand Document
POST http://localhost:5601/api/osd-mcp/tools/expand_document
{
  "documentId": "doc_123",
  "action": "expand"
}
```

## Usage with AG-UI

Once configured, you can use natural language with the AG-UI chat interface:

```
User: "Change the query to show only error logs from the last hour"
AG-UI: Uses osd-mcp-server__update_query tool
Result: Query editor updates with new query

User: "Run the query"  
AG-UI: Uses osd-mcp-server__run_query tool
Result: Query executes and results appear

User: "Expand the first document"
AG-UI: Uses osd-mcp-server__expand_document tool  
Result: Document expands to show full details
```

## Development

### Current Implementation Status

✅ **Completed:**
- Plugin structure and configuration
- HTTP API endpoints
- MCP tool interfaces
- AG-UI configuration

🚧 **TODO (for full functionality):**
- Connect tools to actual Redux store
- Implement real query execution
- Add error handling and validation
- Add UI state synchronization

### Testing

```bash
# Test server info
curl http://localhost:5601/api/osd-mcp/info

# Test tools list
curl http://localhost:5601/api/osd-mcp/tools

# Test update query
curl -X POST http://localhost:5601/api/osd-mcp/tools/update_query \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM logs", "language": "PPL"}'
```

## Integration Flow

```
1. User types in AG-UI chat: "run query SELECT * FROM logs"
2. AG-UI ReactAgent processes request
3. Agent calls MCP tool: osd-mcp-server__update_query
4. HTTP request to: POST /api/osd-mcp/tools/update_query
5. OSD MCP Server updates explore Redux state
6. UI automatically reflects the change
7. Agent calls: osd-mcp-server__run_query  
8. Query executes and results update in UI
9. User sees the changes in real-time
```

This creates a seamless bridge between AI conversation and OpenSearch Dashboards UI manipulation!
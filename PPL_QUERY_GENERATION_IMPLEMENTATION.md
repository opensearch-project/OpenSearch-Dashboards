# PPL Query Generation Implementation Guide

## Overview

This implementation fixes the PPL query syntax issue in the chat by ensuring the `generate_and_run_query_tool` uses the same `callAgentActionCreator` as the AI mode in the Explore plugin, but with the question coming from chat instead of the editor text.

## Key Changes Made

### 1. Fixed `generate_and_run_query_tool.ts`

**Location**: `src/plugins/osd_mcp_server/server/tools/explore/generate_and_run_query_tool.ts`

**Key Fixes**:
- Added comprehensive console logging to track execution
- Uses the same global services access pattern as `update_query_tool`
- **Critical Fix 1**: Uses `question` from chat as `editorText` parameter instead of editor content
- **Critical Fix 2**: Gets dataset from `services.data.query.queryString.getQuery().dataset` (EXACT same as `call_agent.ts`)
- **Critical Fix 3**: Uses identical `QueryAssistParameters` as `call_agent.ts`
- Maintains the same `callAgentActionCreator` flow as AI mode
- Added fallback handling when global services aren't available

**Important Code Changes**:
```typescript
// CRITICAL FIX 1: Use the question as editorText (same as AI mode)
await globalServices.store.dispatch(
  reduxActions.callAgentActionCreator({
    services: globalServices,
    editorText: question, // This is the key - question from chat, not from editorText
  })
);

// CRITICAL FIX 2: Get dataset from EXACT same source as call_agent.ts
const dataset = globalServices.data.query.queryString.getQuery().dataset;

// CRITICAL FIX 3: Use EXACT same QueryAssistParameters as call_agent.ts
const params = {
  question, // Same as editorText in call_agent.ts
  index: dataset.title, // EXACT same as call_agent.ts
  language: 'PPL', // EXACT same as call_agent.ts (hardcoded)
  dataSourceId: dataset.dataSource?.id, // EXACT same as call_agent.ts
};
```

### 2. Added MCP Server Integration

**Location**: `src/plugins/osd_mcp_server/server/routes/index.ts`

**Added**:
- MCP SSE endpoint: `/api/osd-mcp-server/mcp-sse`
- MCP protocol endpoint: `/api/osd-mcp-server/mcp`
- Console logging for all MCP tool calls
- Proper tool routing for AI-Agents integration

### 3. Created MCP Configuration

**Location**: `agent/AI-Agents/configuration/mcp-config.json`

**Configuration**:
```json
{
  "mcpServers": {
    "opensearch_dashboards": {
      "type": "remote",
      "url": "http://localhost:5601/api/osd-mcp-server/mcp-sse",
      "description": "OpenSearch Dashboards MCP Server for query generation and execution",
      "env": {},
      "requestInit": {
        "headers": {
          "Content-Type": "application/json",
          "osd-xsrf": "true"
        }
      }
    }
  }
}
```

## How It Works

### Current Architecture

1. **Chat Plugin** (`src/plugins/chat`) → **AI-Agents** (`agent/AI-Agents`) → **MCP Server** (`src/plugins/osd_mcp_server`)
2. Chat sends message to AI-Agents via HTTP
3. AI-Agents connects to OpenSearch Dashboards MCP server via SSE
4. MCP server executes tools using global services (same as AI mode)

### PPL Query Generation Flow

1. User types question in chat: `"show me errors from last hour"`
2. AI-Agents calls MCP tool: `generate_and_run_query`
3. MCP server executes `generate_and_run_query_tool`
4. Tool uses `callAgentActionCreator` with `question` as `editorText`
5. Same API call as AI mode: `/api/enhancements/assist/generate`
6. **Correct PPL syntax**: `source = opensearch_dashboards_sample_data_logs | where response = '200'`

## Testing Examples

### 1. Basic Query Generation

**Chat Input**: `"generate query for response 200"`

**Expected MCP Tool Call**:
```json
{
  "name": "generate_and_run_query",
  "arguments": {
    "question": "generate query for response 200",
    "executeQuery": true
  }
}
```

**Expected PPL Output**: `source = opensearch_dashboards_sample_data_logs | where response = '200'`

### 2. Error Analysis

**Chat Input**: `"show me all errors from the last hour"`

**Expected PPL Output**: `source = opensearch_dashboards_sample_data_logs | where level = 'ERROR' | where @timestamp >= now() - 1h`

### 3. Response Code Analysis

**Chat Input**: `"find all 404 errors"`

**Expected PPL Output**: `source = opensearch_dashboards_sample_data_logs | where response = '404'`

### 4. Time-based Query

**Chat Input**: `"show me logs from last 15 minutes"`

**Expected PPL Output**: `source = opensearch_dashboards_sample_data_logs | where @timestamp >= now() - 15m`

## Console Logging

### What to Look For

1. **MCP Tool Execution**:
```
🤖 GenerateAndRunQueryTool: Starting execution using callAgentActionCreator
🔍 GenerateAndRunQueryTool: Checking global services availability
🚀 GenerateAndRunQueryTool: Dispatching callAgentActionCreator (same as AI mode)
✅ GenerateAndRunQueryTool: Query generated and executed successfully
```

2. **MCP Protocol Calls**:
```
🔧 MCP protocol call: tools/call
🛠️ MCP Tool called via protocol: generate_and_run_query
🤖 Executing generate_and_run_query_tool via MCP protocol
✅ MCP Tool generate_and_run_query completed successfully
```

3. **Global Services Check**:
```
🔍 GenerateAndRunQueryTool: Checking global services availability {
  hasGlobalServices: true,
  hasStore: true,
  hasReduxActions: true,
  hasCallAgentAction: true
}
```

## Troubleshooting

### Issue: "Explore services not available"

**Symptoms**: Tool returns `SERVICES_NOT_AVAILABLE` error

**Solutions**:
1. Ensure you're on the Explore page (`/app/explore`)
2. Refresh the Explore page to initialize global services
3. Check browser console for global service initialization errors

### Issue: Wrong PPL Syntax

**Symptoms**: Generated query has syntax like `response == 200` instead of `response = '200'`

**Root Cause**: Tool not using `callAgentActionCreator` properly

**Check**:
1. Verify console logs show "Dispatching callAgentActionCreator"
2. Ensure `question` parameter is passed as `editorText`
3. Check that the same API endpoint is called as AI mode

### Issue: MCP Connection Failed

**Symptoms**: AI-Agents can't connect to MCP server

**Solutions**:
1. Verify OpenSearch Dashboards is running on port 5601
2. Check MCP configuration in `agent/AI-Agents/configuration/mcp-config.json`
3. Ensure MCP SSE endpoint is accessible: `http://localhost:5601/api/osd-mcp-server/mcp-sse`

## Verification Steps

### 1. Test MCP Server Health
```bash
curl http://localhost:5601/api/osd-mcp-server/health
```

### 2. Test MCP Tools List
```bash
curl http://localhost:5601/api/osd-mcp-server/tools
```

### 3. Test Direct Tool Call
```bash
curl -X POST http://localhost:5601/api/osd-mcp-server/tools/call \
  -H "Content-Type: application/json" \
  -H "osd-xsrf: true" \
  -d '{
    "name": "generate_query",
    "arguments": {
      "question": "show me response 200"
    }
  }'
```

### 4. Start AI-Agents with MCP
```bash
cd agent/AI-Agents
npm run start:ag-ui -- --agent langgraph
```

### 5. Test in Chat
1. Open OpenSearch Dashboards
2. Navigate to Explore page
3. Open chat
4. Type: "generate query for response 200"
5. Check console logs for MCP tool execution
6. Verify correct PPL syntax is generated

## Expected Results

- ✅ Chat can generate PPL queries with correct syntax
- ✅ Console logs show MCP tool execution
- ✅ Same API calls as AI mode (`callAgentActionCreator`)
- ✅ Question from chat used instead of editor text
- ✅ Proper error handling and fallbacks
- ✅ Integration between chat, AI-Agents, and MCP server

## Notes

- The key insight is that the chat question should be passed as `editorText` to `callAgentActionCreator`
- This ensures the same query generation logic as the AI mode in Explore
- The MCP server acts as a bridge between AI-Agents and OpenSearch Dashboards Redux store
- Console logging helps verify the execution flow and debug issues
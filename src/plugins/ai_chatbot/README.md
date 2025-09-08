# AI Chatbot Plugin for OpenSearch Dashboards

This plugin provides an AI-powered chatbot that can understand your dashboard context and interact with OpenSearch Dashboards using UI Actions.

## Features

- 🤖 **Claude AI Integration**: Uses Anthropic's Claude API for natural language processing
- 🔍 **Context Awareness**: Integrates with the Context Provider to understand your current dashboard state
- 🎛️ **Dashboard Actions**: Can add filters and expand panels using UI Actions
- 💬 **Natural Language Interface**: Chat with your dashboards in plain English

## Setup

### 1. Install Dependencies

```bash
# Add to package.json dependencies (if not already present)
npm install @elastic/eui react react-dom
```

### 2. Get Claude API Key

1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Create an API key
3. Keep it secure - you'll enter it in the chatbot interface

### 3. Enable the Plugin

Add the plugin to your OpenSearch Dashboards configuration:

```yaml
# config/opensearch_dashboards.yml
plugins.paths: ["src/plugins/ai_chatbot"]
```

## Usage

### 1. Access the Chatbot

- Click the "🤖 AI Assistant" button in the top navigation bar
- Or navigate to `/app/ai-chatbot`

### 2. Enter Your API Key

- On first use, you'll be prompted to enter your Claude API key
- This is stored only for your current session

### 3. Start Chatting

Try these example commands:

#### Context Questions
- "What am I looking at?"
- "What data is currently displayed?"
- "How many panels are visible?"

#### Action Commands
- "Add a filter for level ERROR"
- "Add a filter for service auth-service"
- "Expand panel panel-123"

## Integration with Context Provider

The chatbot automatically integrates with the Context Provider system to understand:

- **Current Page**: Dashboard, Explore, etc.
- **Visible Panels**: Dashboard visualizations and their configurations
- **Expanded Documents**: Documents you've opened in Explore
- **Active Filters**: Current filter state
- **Time Range**: Selected time period
- **Query State**: Active search queries

## Available UI Actions

The chatbot can execute these actions:

### Dashboard Actions
- `ADD_FILTER_TRIGGER`: Add filters to dashboard views
- `EXPAND_PANEL_TRIGGER`: Expand dashboard panels to full screen

### Explore Actions
- `EXPLORE_DOCUMENT_EXPAND_TRIGGER`: Expand documents in log views

## Architecture

```
User Input → Claude AI Agent → UI Actions → Dashboard/Explore
     ↑                           ↓
Context Provider ← Dashboard State Updates
```

### Components

1. **ClaudeOSDAgent**: Handles AI processing and tool execution
2. **Chatbot Component**: React UI for chat interface
3. **Context Hook**: Integrates with Context Provider
4. **UI Actions**: Registered actions for dashboard interaction

## Development

### Adding New Actions

1. Register a new UI Action in the target plugin:

```typescript
uiActions.registerTrigger({
  id: 'MY_NEW_TRIGGER',
  title: 'My New Action',
  description: 'Description of what this does'
});

uiActions.registerAction({
  id: 'MY_NEW_ACTION',
  type: 'MY_NEW_TRIGGER',
  execute: async (context) => {
    // Your action logic here
  }
});
```

2. Add the tool to ClaudeOSDAgent:

```typescript
{
  name: 'my_new_action',
  description: 'Description for the AI',
  parameters: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Parameter description' }
    }
  },
  execute: async (params) => {
    return this.uiActions.executeTriggerActions('MY_NEW_TRIGGER', params);
  }
}
```

### Testing

1. **Context Integration**: Navigate to different pages and verify context updates
2. **UI Actions**: Test each action command in the chatbot
3. **Error Handling**: Try invalid commands and verify graceful error handling

## Security Notes

- API keys are stored only in session storage (cleared on browser close)
- All API calls are made client-side to Anthropic's servers
- No sensitive data is logged or stored permanently

## Troubleshooting

### Common Issues

1. **"Context Provider not available"**
   - Ensure the Context Provider plugin is enabled
   - Check browser console for Context Provider errors

2. **"UI Actions not available"**
   - Verify you're on a dashboard or explore page
   - Check that UI Actions are properly registered

3. **API Errors**
   - Verify your Claude API key is correct
   - Check network connectivity
   - Ensure you have API credits remaining

### Debug Mode

Enable debug information by opening the "Debug Context" panel in the chatbot interface to see:
- Current context data
- Available UI Actions
- API call logs

## Future Enhancements

- [ ] Support for more AI providers (OpenAI, local models)
- [ ] Advanced dashboard creation capabilities
- [ ] Integration with saved searches and visualizations
- [ ] Multi-step workflows and automation
- [ ] Voice input support
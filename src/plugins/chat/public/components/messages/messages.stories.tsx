/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Messages } from './messages';
import { ChatContextProvider } from '../chat-context';
import { AIContext } from '../../context/ai-context/ai-context';
import {
  AIMessage,
  UserMessage as UserMessageType,
  ImageData,
  Message,
} from '../../../common/types';

const meta: Meta<typeof Messages> = {
  title: 'src/plugins/chat/public/components/messages',
  component: Messages,
  decorators: [
    (Story) => {
      const [open, setOpen] = React.useState(true);
      const [isLoading, setIsLoading] = React.useState(false);
      return (
        <AIContext.Provider value={{ isLoading, setIsLoading }}>
          <ChatContextProvider open={open} setOpen={setOpen}>
            <div style={{ height: '600px', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}>
              <Story />
            </div>
          </ChatContextProvider>
        </AIContext.Provider>
      );
    },
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Messages component displays a scrollable container of chat messages with automatic scrolling behavior and support for initial messages.',
      },
    },
  },
  argTypes: {
    inProgress: { control: 'boolean' },
    messages: { control: false },
    AssistantMessage: { control: false },
    UserMessage: { control: false },
    RenderMessage: { control: false },
    ImageRenderer: { control: false },
    onRegenerate: { action: 'regenerate clicked' },
    onCopy: { action: 'copied' },
    onThumbsUp: { action: 'thumbs up' },
    onThumbsDown: { action: 'thumbs down' },
  },
};

export default meta;
type Story = StoryObj<typeof Messages>;

// Create test image data
const createTestImage = (
  color: 'red' | 'blue' | 'green' = 'red',
  format: 'png' | 'jpeg' = 'png'
): ImageData => {
  const base64Images = {
    red: {
      png:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jIoJhgAAAABJRU5ErkJggg==',
      jpeg:
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=',
    },
    blue: {
      png:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      jpeg:
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wB=',
    },
    green: {
      png:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A9EDwADfwGPQ9G3iwAAAABJRU5ErkJggg==',
      jpeg:
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wC=',
    },
  };

  return {
    format,
    bytes: base64Images[color][format],
  };
};

// Mock message creation helpers
const createMockUserMessage = (content: string, id?: string): UserMessageType => ({
  id: id || `user-${Date.now()}-${Math.random()}`,
  role: 'user',
  content,
  timestamp: new Date().toISOString(),
});

const createMockUserImageMessage = (
  content: string,
  image: ImageData,
  id?: string
): UserMessageType => ({
  id: id || `user-img-${Date.now()}-${Math.random()}`,
  role: 'user',
  content,
  image,
  timestamp: new Date().toISOString(),
});

const createMockAssistantMessage = (content: string, id?: string): AIMessage => ({
  id: id || `assistant-${Date.now()}-${Math.random()}`,
  role: 'assistant',
  content,
  timestamp: new Date().toISOString(),
});

const createMockAssistantWithUIMessage = (content: string, id?: string): AIMessage => ({
  id: id || `assistant-ui-${Date.now()}-${Math.random()}`,
  role: 'assistant',
  content,
  timestamp: new Date().toISOString(),
  generativeUI: () => (
    <div
      style={{
        padding: '12px',
        backgroundColor: '#e7f3ff',
        border: '1px solid #0073e6',
        borderRadius: '4px',
        margin: '8px 0',
      }}
    >
      <h4 style={{ margin: '0 0 8px 0', color: '#0073e6' }}>Dashboard Analytics</h4>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0073e6' }}>1,234</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Total Queries</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>98.5%</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Uptime</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>2.3s</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Avg Response</div>
        </div>
      </div>
    </div>
  ),
});

export const EmptyMessages: Story = {
  args: {
    messages: [],
    inProgress: false,
  },
};

export const SingleUserMessage: Story = {
  args: {
    messages: [createMockUserMessage('Hello, I need help with OpenSearch Dashboards.')],
    inProgress: false,
  },
};

export const SingleAssistantMessage: Story = {
  args: {
    messages: [
      createMockAssistantMessage('Hello! How can I help you with OpenSearch Dashboards today?'),
    ],
    inProgress: false,
  },
};

export const BasicConversation: Story = {
  args: {
    messages: [
      createMockUserMessage('What is OpenSearch Dashboards?'),
      createMockAssistantMessage(
        'OpenSearch Dashboards is a powerful data visualization and exploration tool that works with OpenSearch clusters. It provides an intuitive interface for searching, visualizing, and analyzing your data.'
      ),
      createMockUserMessage('How do I create a visualization?'),
      createMockAssistantMessage(`To create a visualization in OpenSearch Dashboards:

## Steps:
1. **Go to Visualize** in the main navigation
2. **Click "Create visualization"**
3. **Choose your visualization type** (bar chart, line chart, pie chart, etc.)
4. **Select your index pattern**
5. **Configure the metrics and buckets**
6. **Save your visualization**

### Example:
For a simple bar chart:
- **Y-axis**: Count of documents
- **X-axis**: Terms aggregation on a field

Would you like me to explain any specific visualization type?`),
    ],
    inProgress: false,
  },
};

export const ConversationWithImages: Story = {
  args: {
    messages: [
      createMockUserMessage("I'm having issues with my dashboard setup."),
      createMockAssistantMessage(
        "I'd be happy to help you with your dashboard setup. Can you provide more details about the specific issues you're encountering?"
      ),
      createMockUserImageMessage(
        'Here is a screenshot of the error I am seeing',
        createTestImage('red', 'png')
      ),
      createMockAssistantMessage(
        'I can see the error in your screenshot. This appears to be a connection issue with your data source. Let me help you troubleshoot this step by step.'
      ),
      createMockUserImageMessage(
        'And here is my current dashboard configuration',
        createTestImage('blue', 'png')
      ),
      createMockAssistantWithUIMessage(
        'Based on your configuration, here are the current metrics for your dashboard:'
      ),
    ],
    inProgress: false,
  },
};

export const InProgressConversation: Story = {
  args: {
    messages: [
      createMockUserMessage('Explain how index patterns work in OpenSearch Dashboards.'),
      createMockAssistantMessage('Index patterns in OpenSearch Dashboards are...'),
    ],
    inProgress: true,
  },
};

export const LoadingResponse: Story = {
  args: {
    messages: [
      createMockUserMessage('How do I set up alerting in OpenSearch Dashboards?'),
      createMockAssistantMessage(''),
    ],
    inProgress: true,
  },
};

export const LongConversation: Story = {
  args: {
    messages: [
      createMockUserMessage(
        'I need to set up a comprehensive dashboard for monitoring our application logs.'
      ),
      createMockAssistantMessage(`I'll help you set up a comprehensive dashboard for application log monitoring. Here's a complete guide:

## Step 1: Index Pattern Setup
First, create an index pattern for your logs:
- Go to **Stack Management** → **Index Patterns**
- Create pattern like \`logs-*\` or \`application-logs-*\`
- Set the time field (usually \`@timestamp\`)

## Step 2: Key Visualizations to Create

### 1. Log Volume Over Time
- **Type**: Line chart
- **Y-axis**: Count of documents
- **X-axis**: Date histogram on @timestamp

### 2. Log Levels Distribution
- **Type**: Pie chart
- **Slice by**: Terms aggregation on log level field

### 3. Error Rate Tracking
- **Type**: Area chart
- **Filter**: level:ERROR
- **Y-axis**: Count
- **X-axis**: Time

### 4. Top Error Messages
- **Type**: Data table
- **Columns**: timestamp, level, message
- **Filter**: level:ERROR
- **Sort by**: @timestamp desc`),
      createMockUserMessage(
        'That sounds great! Can you also help me with alerting on error rates?'
      ),
      createMockAssistantMessage(`Absolutely! Here's how to set up alerting for error rates:

## Alerting Setup

### 1. Create a Monitor
- Go to **Alerting** → **Monitors** → **Create Monitor**
- Choose **Per query monitor**

### 2. Define the Query
\`\`\`json
{
  "query": {
    "bool": {
      "must": [
        {"range": {"@timestamp": {"gte": "now-5m"}}},
        {"term": {"level": "ERROR"}}
      ]
    }
  }
}
\`\`\`

### 3. Set Trigger Conditions
- **Threshold**: \`ctx.results[0].hits.total.value > 10\`
- **Schedule**: Every 5 minutes

This will alert you when error count exceeds 10 in any 5-minute window.`),
      createMockUserImageMessage(
        'I tried to set this up but got this error. Can you help?',
        createTestImage('red', 'png')
      ),
      createMockAssistantMessage(`I can see the error in your screenshot. This is a common permissions issue. Here's how to fix it:

## Fix Permission Error

### 1. Check User Roles
- Go to **Security** → **Roles**
- Ensure your user has \`alerting_full_access\` role

### 2. Index Permissions
Make sure the role includes:
- **Index patterns**: \`logs-*\`
- **Permissions**: \`read\`, \`indices:data/read/*\`

Try these steps and let me know if you still encounter issues!`),
      createMockUserMessage(
        'Perfect! Now how do I create a dashboard that combines all these visualizations?'
      ),
      createMockAssistantWithUIMessage(
        `Great question! Here's your dashboard creation guide with current system metrics:`
      ),
    ],
    inProgress: false,
  },
};

export const WithAllActions: Story = {
  args: {
    messages: [
      createMockUserMessage('How do I optimize my OpenSearch queries?'),
      createMockAssistantMessage(`Here are the key strategies for optimizing OpenSearch queries:

## Query Optimization Techniques

### 1. Use Filters Instead of Queries
- **Filters** are cached and faster
- **Queries** calculate relevance scores

### 2. Limit Field Searches
\`\`\`json
{
  "query": {
    "multi_match": {
      "query": "search term",
      "fields": ["title", "description"]
    }
  }
}
\`\`\`

### 3. Use Date Range Filters
Always include time ranges for time-series data:
\`\`\`json
{
  "filter": {
    "range": {
      "@timestamp": {
        "gte": "now-1d"
      }
    }
  }
}
\`\`\`

This comprehensive approach will significantly improve your query performance.`),
    ],
    inProgress: false,
    onRegenerate: (messageId) => console.log('Regenerating message:', messageId),
    onCopy: (content) => console.log('Copied:', content),
    onThumbsUp: (message) => console.log('Thumbs up for:', message),
    onThumbsDown: (message) => console.log('Thumbs down for:', message),
  },
};

export const WithFooterContent: Story = {
  args: {
    messages: [
      createMockUserMessage('Show me how to use the Dev Tools console.'),
      createMockAssistantMessage(`The Dev Tools console is a powerful interface for interacting directly with your OpenSearch cluster:

## Getting Started
1. Navigate to **Dev Tools** in the main menu
2. Use the left panel to write queries
3. Use \`Ctrl+Enter\` (or \`Cmd+Enter\`) to execute

## Example Queries
\`\`\`json
GET _cluster/health

GET _cat/indices?v

GET logs-*/_search
{
  "query": {
    "match_all": {}
  },
  "size": 10
}
\`\`\`

The console provides auto-completion and syntax highlighting to help you write queries efficiently.`),
    ],
    inProgress: false,
    children: (
      <div style={{ padding: '16px', backgroundColor: '#fff', borderTop: '1px solid #ddd' }}>
        <div style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
          💡 Tip: Use Ctrl+Enter to send messages quickly
        </div>
      </div>
    ),
  },
};

export const Interactive: Story = {
  render: function InteractiveRender(args) {
    const [messages, setMessages] = React.useState<Message[]>([
      createMockUserMessage('Hello! I want to learn about OpenSearch Dashboards.'),
      createMockAssistantMessage(
        "Hello! I'd be happy to help you learn about OpenSearch Dashboards. What would you like to know?"
      ),
    ]);
    const [inProgress, setInProgress] = React.useState(false);
    const [newMessage, setNewMessage] = React.useState('');
    const [feedback, setFeedback] = React.useState<string>('');

    const handleSendMessage = () => {
      if (!newMessage.trim()) return;

      const userMessage = createMockUserMessage(newMessage);
      setMessages((prev) => [...prev, userMessage]);
      setNewMessage('');
      setInProgress(true);

      // Simulate assistant response
      setTimeout(() => {
        const responses = [
          'Great question! Let me explain that for you.',
          "Here's what you need to know about that topic.",
          'I can help you with that. Let me break it down.',
          "That's an excellent use case. Here's how to approach it.",
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const assistantMessage = createMockAssistantMessage(randomResponse);
        setMessages((prev) => [...prev, assistantMessage]);
        setInProgress(false);
      }, 2000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    const handleRegenerate = (messageId: string) => {
      setFeedback(`Regenerating message ${messageId}...`);
      setTimeout(() => setFeedback(''), 3000);
    };

    const handleCopy = (content: string) => {
      setFeedback(`Copied: "${content.substring(0, 30)}..."`);
      setTimeout(() => setFeedback(''), 3000);
    };

    const handleThumbsUp = (message: Message) => {
      setFeedback('Thanks for the positive feedback! 👍');
      setTimeout(() => setFeedback(''), 3000);
    };

    const handleThumbsDown = (message: Message) => {
      setFeedback("Thanks for the feedback. We'll work to improve! 👎");
      setTimeout(() => setFeedback(''), 3000);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Messages
          {...defaultProps}
          messages={messages}
          inProgress={inProgress}
          onRegenerate={handleRegenerate}
          onCopy={handleCopy}
          onThumbsUp={handleThumbsUp}
          onThumbsDown={handleThumbsDown}
        >
          <div style={{ padding: '16px', backgroundColor: '#fff', borderTop: '1px solid #ddd' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  resize: 'none',
                  minHeight: '40px',
                }}
                disabled={inProgress}
              />
              <button
                onClick={handleSendMessage}
                disabled={inProgress || !newMessage.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: inProgress ? '#ccc' : '#0073e6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: inProgress ? 'not-allowed' : 'pointer',
                }}
              >
                {inProgress ? 'Sending...' : 'Send'}
              </button>
            </div>
            {feedback && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px',
                  backgroundColor: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#155724',
                }}
              >
                {feedback}
              </div>
            )}
          </div>
        </Messages>
      </div>
    );
  },
  args: {},
};

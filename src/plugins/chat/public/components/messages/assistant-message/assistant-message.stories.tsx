/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { AssistantMessage } from './assistant-message';
import { ChatContextProvider } from '../../chat-context';
import { AIMessage } from '../../../../common/types';

const meta: Meta<typeof AssistantMessage> = {
  title: 'src/plugins/chat/public/components/messages/assistant-message',
  component: AssistantMessage,
  decorators: [
    (Story) => {
      const [open, setOpen] = React.useState(true);
      return (
        <ChatContextProvider open={open} setOpen={setOpen}>
          <div style={{ padding: '16px', backgroundColor: '#f5f5f5', maxWidth: '800px' }}>
            <Story />
          </div>
        </ChatContextProvider>
      );
    },
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'AssistantMessage displays AI assistant responses with markdown content, control buttons for user interaction, and loading states.',
      },
    },
  },
  argTypes: {
    isLoading: { control: 'boolean' },
    isGenerating: { control: 'boolean' },
    isCurrentMessage: { control: 'boolean' },
    onRegenerate: { action: 'regenerate clicked' },
    onCopy: { action: 'copied' },
    onThumbsUp: { action: 'thumbs up' },
    onThumbsDown: { action: 'thumbs down' },
  },
};

export default meta;
type Story = StoryObj<typeof AssistantMessage>;

// Mock message data
const createMockMessage = (content: string, id = '1'): AIMessage => ({
  id,
  role: 'assistant',
  content,
  timestamp: new Date().toISOString(),
});

export const Default: Story = {
  args: {
    message: createMockMessage('Hello! How can I help you with OpenSearch Dashboards today?'),
    isLoading: false,
    isGenerating: false,
    isCurrentMessage: false,
  },
};

export const Loading: Story = {
  args: {
    message: undefined,
    isLoading: true,
    isGenerating: false,
    isCurrentMessage: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Assistant message in loading state while waiting for response.',
      },
    },
  },
};

export const WithMarkdown: Story = {
  args: {
    message: createMockMessage(`I can help you with OpenSearch Dashboards! Here are some key features:

## Core Features
- **Discover**: Search and explore your data
- **Visualize**: Create charts and graphs  
- **Dashboard**: Combine visualizations
- **Dev Tools**: Query your indices

### Example Query
\`\`\`json
{
  "query": {
    "match": {
      "message": "error"
    }
  }
}
\`\`\`

Would you like help with any specific feature?`),
    isLoading: false,
    isGenerating: false,
    isCurrentMessage: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Assistant message with rich markdown content including headers, lists, and code blocks.',
      },
    },
  },
};

export const CurrentMessage: Story = {
  args: {
    message: createMockMessage('This is the most recent message from the assistant.'),
    isLoading: false,
    isGenerating: false,
    isCurrentMessage: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Assistant message marked as the current/latest message with enhanced styling.',
      },
    },
  },
};

export const WithAllActions: Story = {
  args: {
    message: createMockMessage(
      'Here is a comprehensive response that you can interact with using all available actions.'
    ),
    isLoading: false,
    isGenerating: false,
    isCurrentMessage: true,
    onRegenerate: () => console.log('Regenerating response...'),
    onCopy: (content) => console.log('Copied:', content),
    onThumbsUp: (message) => console.log('Thumbs up for:', message),
    onThumbsDown: (message) => console.log('Thumbs down for:', message),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Assistant message with all interaction buttons enabled (regenerate, copy, thumbs up/down).',
      },
    },
  },
};

export const WithoutFeedback: Story = {
  args: {
    message: createMockMessage(
      'This message only has regenerate and copy actions, no feedback buttons.'
    ),
    isLoading: false,
    isGenerating: false,
    isCurrentMessage: true,
    onRegenerate: () => console.log('Regenerating...'),
    onCopy: (content) => console.log('Copied:', content),
    // No onThumbsUp/onThumbsDown - buttons won't show
  },
  parameters: {
    docs: {
      description: {
        story:
          'Assistant message without feedback buttons, showing only regenerate and copy actions.',
      },
    },
  },
};

export const LongContent: Story = {
  args: {
    message: createMockMessage(`# Complete OpenSearch Dashboards Guide

## Introduction
OpenSearch Dashboards is a powerful data visualization and exploration tool that works with OpenSearch clusters. It provides an intuitive interface for searching, visualizing, and analyzing your data.

## Getting Started

### 1. Connecting to OpenSearch
First, you need to connect Dashboards to your OpenSearch cluster:

\`\`\`yaml
opensearch_dashboards.yml:
opensearch.hosts: ["https://localhost:9200"]
opensearch.username: "admin"
opensearch.password: "admin"
\`\`\`

### 2. Creating Index Patterns
Before you can explore data, create index patterns:

1. Go to **Stack Management** > **Index Patterns**
2. Click **Create index pattern**
3. Enter your index pattern (e.g., \`logs-*\`)
4. Select a time field if applicable

## Core Features

### Discover
The Discover application lets you:
- Search across your indices
- Filter results using the query bar
- Examine individual documents
- Save searches for later use

**Example KQL query:**
\`\`\`
response.status:404 AND @timestamp >= now-1d
\`\`\`

### Visualizations
Create various chart types:
- **Line charts**: Time series data
- **Bar charts**: Categorical comparisons  
- **Pie charts**: Part-to-whole relationships
- **Data tables**: Detailed data views
- **Maps**: Geospatial visualizations

### Dashboards
Combine multiple visualizations:
1. Create individual visualizations
2. Add them to a dashboard
3. Arrange and resize as needed
4. Apply global filters and time ranges

## Advanced Features

### Dev Tools
Use the console for direct queries:

\`\`\`json
GET _cluster/health

GET logs-2023.12.*/_search
{
  "query": {
    "bool": {
      "must": [
        {"range": {"@timestamp": {"gte": "now-1h"}}},
        {"term": {"level": "ERROR"}}
      ]
    }
  },
  "aggs": {
    "error_counts": {
      "terms": {"field": "service.name"}
    }
  }
}
\`\`\`

### Alerting
Set up monitors and alerts:
- Define search criteria
- Set thresholds
- Configure notifications
- Monitor trigger history

## Best Practices

1. **Index Patterns**: Use time-based indices for better performance
2. **Visualizations**: Keep them simple and focused
3. **Dashboards**: Group related visualizations logically
4. **Performance**: Use appropriate time ranges and filters
5. **Security**: Implement proper role-based access control

## Troubleshooting

### Common Issues

**Dashboard loading slowly:**
- Check time range (avoid overly broad ranges)
- Optimize visualizations
- Consider index lifecycle management

**Visualizations not showing data:**
- Verify index pattern matches your data
- Check time filter settings
- Ensure fields are mapped correctly

**Search not returning expected results:**
- Validate query syntax
- Check field names and types
- Review index mappings

Need more specific help? Feel free to ask about any particular feature or issue!`),
    isLoading: false,
    isGenerating: false,
    isCurrentMessage: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Long assistant message with comprehensive content to test scrolling and layout.',
      },
    },
  },
};

export const WithGenerativeUI: Story = {
  args: {
    message: {
      ...createMockMessage('Here is a response with custom UI component:'),
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
          <h4 style={{ margin: '0 0 8px 0', color: '#0073e6' }}>Custom UI Component</h4>
          <p style={{ margin: 0 }}>
            This is a custom React component rendered alongside the message content.
          </p>
        </div>
      ),
    },
    isLoading: false,
    isGenerating: false,
    isCurrentMessage: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Assistant message with custom generative UI component alongside text content.',
      },
    },
  },
};

export const Interactive: Story = {
  render: function InteractiveRender(args) {
    const [message, setMessage] = React.useState(
      createMockMessage('This is an interactive message. Try the buttons!')
    );
    const [isLoading, setIsLoading] = React.useState(false);
    const [feedback, setFeedback] = React.useState<string>('');

    const handleRegenerate = () => {
      setIsLoading(true);
      setTimeout(() => {
        setMessage(createMockMessage('This is a regenerated response with new content!'));
        setIsLoading(false);
        setFeedback('Message regenerated!');
        setTimeout(() => setFeedback(''), 3000);
      }, 2000);
    };

    const handleCopy = (content: string) => {
      setFeedback(`Copied: "${content.substring(0, 30)}..."`);
      setTimeout(() => setFeedback(''), 3000);
    };

    const handleThumbsUp = () => {
      setFeedback('Thanks for the positive feedback! 👍');
      setTimeout(() => setFeedback(''), 3000);
    };

    const handleThumbsDown = () => {
      setFeedback("Thanks for the feedback. We'll work to improve! 👎");
      setTimeout(() => setFeedback(''), 3000);
    };

    return (
      <div>
        <AssistantMessage
          {...args}
          message={message}
          isLoading={isLoading}
          onRegenerate={handleRegenerate}
          onCopy={handleCopy}
          onThumbsUp={handleThumbsUp}
          onThumbsDown={handleThumbsDown}
        />
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
    );
  },
  args: {
    isCurrentMessage: true,
    isGenerating: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive assistant message with working buttons and state changes.',
      },
    },
  },
};

export const EmptyMessage: Story = {
  args: {
    message: createMockMessage(''),
    isLoading: false,
    isGenerating: false,
    isCurrentMessage: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Assistant message with empty content to test edge cases.',
      },
    },
  },
};

export const AllStates: Story = {
  render: function AllStatesRender() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Loading State</h4>
          <AssistantMessage isLoading={true} isGenerating={false} isCurrentMessage={true} />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Regular Message</h4>
          <AssistantMessage
            message={createMockMessage('Regular assistant message with basic content.')}
            isLoading={false}
            isGenerating={false}
            isCurrentMessage={false}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
            Current Message with All Actions
          </h4>
          <AssistantMessage
            message={createMockMessage('Current message with all interaction buttons available.')}
            isLoading={false}
            isGenerating={false}
            isCurrentMessage={true}
            onRegenerate={() => {}}
            onCopy={() => {}}
            onThumbsUp={() => {}}
            onThumbsDown={() => {}}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all assistant message states side by side.',
      },
    },
  },
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { RenderMessage } from './render-message';
import { ImageRenderer } from '../image-renderer';
import { ChatContextProvider } from '../../chat-context';
import { AIMessage, UserMessage as UserMessageType, ImageData } from '../../../../common/types';

const meta: Meta<typeof RenderMessage> = {
  title: 'src/plugins/chat/public/components/messages/render-message',
  component: RenderMessage,
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
          'RenderMessage is a message renderer that displays different message types (user/assistant) with their appropriate components and interactions.',
      },
    },
  },
  argTypes: {
    inProgress: { control: 'boolean' },
    isCurrentMessage: { control: 'boolean' },
    index: { control: 'number' },
    AssistantMessage: { control: false },
    UserMessage: { control: false },
    ImageRenderer: { control: false },
    onRegenerate: { action: 'regenerate clicked' },
    onCopy: { action: 'copied' },
    onThumbsUp: { action: 'thumbs up' },
    onThumbsDown: { action: 'thumbs down' },
  },
};

export default meta;
type Story = StoryObj<typeof RenderMessage>;

// Create a small test image in base64 format (1x1 pixel red PNG)
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
const createMockUserMessage = (content: string, id = '1'): UserMessageType => ({
  id,
  role: 'user',
  content,
  timestamp: new Date().toISOString(),
});

const createMockUserImageMessage = (
  content: string,
  image: ImageData,
  id = '2'
): UserMessageType => ({
  id,
  role: 'user',
  content,
  image,
  timestamp: new Date().toISOString(),
});

const createMockAssistantMessage = (content: string, id = '3'): AIMessage => ({
  id,
  role: 'assistant',
  content,
  timestamp: new Date().toISOString(),
});

const createMockAssistantWithUIMessage = (content: string, id = '4'): AIMessage => ({
  id,
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
      <h4 style={{ margin: '0 0 8px 0', color: '#0073e6' }}>Custom UI Component</h4>
      <p style={{ margin: 0 }}>
        This is a custom React component rendered alongside the message content.
      </p>
    </div>
  ),
});

export const UserMessage: Story = {
  args: {
    message: createMockUserMessage('Hello, I need help with OpenSearch Dashboards.'),
    inProgress: false,
    index: 0,
    isCurrentMessage: false,
    ImageRenderer,
  },
};

export const UserMessageWithImage: Story = {
  args: {
    message: createMockUserImageMessage(
      'Here is a screenshot of the error I am encountering',
      createTestImage('red', 'png')
    ),
    inProgress: false,
    index: 1,
    isCurrentMessage: false,
    ImageRenderer,
  },
  parameters: {
    docs: {
      description: {
        story: 'User message with an uploaded image and accompanying text.',
      },
    },
  },
};

export const AssistantMessage: Story = {
  args: {
    message: createMockAssistantMessage(
      'Hello! How can I help you with OpenSearch Dashboards today?'
    ),
    inProgress: false,
    index: 2,
    isCurrentMessage: false,
    ImageRenderer,
  },
};

export const AssistantMessageWithMarkdown: Story = {
  args: {
    message: createMockAssistantMessage(`I can help you with OpenSearch Dashboards! Here are some key features:

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
    inProgress: false,
    index: 3,
    isCurrentMessage: false,
    ImageRenderer,
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

export const AssistantMessageLoading: Story = {
  args: {
    message: createMockAssistantMessage(''),
    inProgress: true,
    index: 4,
    isCurrentMessage: true,
    ImageRenderer,
  },
  parameters: {
    docs: {
      description: {
        story: 'Assistant message in loading state while waiting for response.',
      },
    },
  },
};

export const AssistantMessageGenerating: Story = {
  args: {
    message: createMockAssistantMessage('I can help you with OpenSearch Dashboards...'),
    inProgress: true,
    index: 5,
    isCurrentMessage: true,
    ImageRenderer,
  },
  parameters: {
    docs: {
      description: {
        story: 'Assistant message in generating state while streaming content.',
      },
    },
  },
};

export const AssistantMessageWithActions: Story = {
  args: {
    message: createMockAssistantMessage(
      'Here is a comprehensive response that you can interact with using all available actions.'
    ),
    inProgress: false,
    index: 6,
    isCurrentMessage: true,
    onRegenerate: (messageId) => console.log('Regenerating message:', messageId),
    onCopy: (content) => console.log('Copied:', content),
    onThumbsUp: (message) => console.log('Thumbs up for:', message),
    onThumbsDown: (message) => console.log('Thumbs down for:', message),
    ImageRenderer,
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

export const AssistantMessageWithGenerativeUI: Story = {
  args: {
    message: createMockAssistantWithUIMessage('Here is a response with custom UI component:'),
    inProgress: false,
    index: 7,
    isCurrentMessage: false,
    ImageRenderer,
  },
  parameters: {
    docs: {
      description: {
        story: 'Assistant message with custom generative UI component alongside text content.',
      },
    },
  },
};

export const ConversationFlow: Story = {
  render: function ConversationFlowRender() {
    const messages = [
      createMockUserMessage('What is OpenSearch Dashboards?'),
      createMockAssistantMessage(
        'OpenSearch Dashboards is a powerful data visualization and exploration tool that works with OpenSearch clusters. It provides an intuitive interface for searching, visualizing, and analyzing your data.'
      ),
      createMockUserImageMessage(
        'I have this error on my dashboard, can you help?',
        createTestImage('red', 'png')
      ),
      createMockAssistantMessage(
        'I can see the error in your screenshot. This looks like a connection issue with your data source. Let me help you troubleshoot this.'
      ),
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((message, index) => (
          <RenderMessage
            key={message.id}
            message={message}
            inProgress={false}
            index={index}
            isCurrentMessage={index === messages.length - 1}
            ImageRenderer={ImageRenderer}
          />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete conversation flow showing multiple message types in sequence.',
      },
    },
  },
};

export const Interactive: Story = {
  render: function InteractiveRender(args) {
    const [messageType, setMessageType] = React.useState<'user' | 'assistant'>('user');
    const [content, setContent] = React.useState('This is an interactive message');
    const [inProgress, setInProgress] = React.useState(false);
    const [isCurrentMessage, setIsCurrentMessage] = React.useState(true);
    const [includeImage, setIncludeImage] = React.useState(false);
    const [feedback, setFeedback] = React.useState<string>('');

    const message = React.useMemo(() => {
      if (messageType === 'user') {
        if (includeImage) {
          return createMockUserImageMessage(content, createTestImage('blue', 'png'));
        }
        return createMockUserMessage(content);
      } else {
        return createMockAssistantMessage(content);
      }
    }, [messageType, content, includeImage]);

    const handleRegenerate = (messageId: string) => {
      setFeedback(`Regenerating message ${messageId}...`);
      setTimeout(() => setFeedback(''), 3000);
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Message Type:</label>
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value as 'user' | 'assistant')}
              style={{ padding: '4px' }}
            >
              <option value="user">User</option>
              <option value="assistant">Assistant</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 'bold', marginRight: '8px' }}>In Progress:</label>
            <input
              type="checkbox"
              checked={inProgress}
              onChange={(e) => setInProgress(e.target.checked)}
            />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Current Message:</label>
            <input
              type="checkbox"
              checked={isCurrentMessage}
              onChange={(e) => setIsCurrentMessage(e.target.checked)}
            />
          </div>
          {messageType === 'user' && (
            <div>
              <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Include Image:</label>
              <input
                type="checkbox"
                checked={includeImage}
                onChange={(e) => setIncludeImage(e.target.checked)}
              />
            </div>
          )}
        </div>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
            Message Content:
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              padding: '8px',
              width: '100%',
              maxWidth: '400px',
              minHeight: '60px',
              resize: 'vertical',
            }}
            placeholder="Enter message content..."
          />
        </div>
        <RenderMessage
          message={message}
          inProgress={inProgress}
          index={0}
          isCurrentMessage={isCurrentMessage}
          onRegenerate={handleRegenerate}
          onCopy={handleCopy}
          onThumbsUp={handleThumbsUp}
          onThumbsDown={handleThumbsDown}
          ImageRenderer={ImageRenderer}
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
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Interactive render message where you can change message type, progress state, and content.',
      },
    },
  },
};

export const AllMessageStates: Story = {
  render: function AllMessageStatesRender() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>User Text Message</h4>
          <RenderMessage
            message={createMockUserMessage('Simple user message')}
            inProgress={false}
            index={0}
            isCurrentMessage={false}
            ImageRenderer={ImageRenderer}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>User Image Message</h4>
          <RenderMessage
            message={createMockUserImageMessage(
              'User message with image',
              createTestImage('red', 'png')
            )}
            inProgress={false}
            index={1}
            isCurrentMessage={false}
            ImageRenderer={ImageRenderer}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Assistant Loading</h4>
          <RenderMessage
            message={createMockAssistantMessage('')}
            inProgress={true}
            index={2}
            isCurrentMessage={true}
            ImageRenderer={ImageRenderer}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Assistant Generating</h4>
          <RenderMessage
            message={createMockAssistantMessage('Partial response being generated...')}
            inProgress={true}
            index={3}
            isCurrentMessage={true}
            ImageRenderer={ImageRenderer}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Assistant Complete</h4>
          <RenderMessage
            message={createMockAssistantMessage('Complete assistant response with all features.')}
            inProgress={false}
            index={4}
            isCurrentMessage={true}
            onRegenerate={() => {}}
            onCopy={() => {}}
            onThumbsUp={() => {}}
            onThumbsDown={() => {}}
            ImageRenderer={ImageRenderer}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Assistant with Generative UI</h4>
          <RenderMessage
            message={createMockAssistantWithUIMessage('Assistant with custom UI component')}
            inProgress={false}
            index={5}
            isCurrentMessage={false}
            ImageRenderer={ImageRenderer}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all message rendering states and types side by side.',
      },
    },
  },
};

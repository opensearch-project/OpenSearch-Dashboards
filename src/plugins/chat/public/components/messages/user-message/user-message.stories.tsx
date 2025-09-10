/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { UserMessage } from './user-message';
import { ImageRenderer } from '../image-renderer';
import { UserMessage as UserMessageType, ImageData } from '../../../../common/types';

const meta: Meta<typeof UserMessage> = {
  title: 'src/plugins/chat/public/components/messages/user-message',
  component: UserMessage,
  decorators: [
    (Story) => (
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5', maxWidth: '600px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'UserMessage displays messages from users in chat, supporting both text content and image uploads with optional accompanying text.',
      },
    },
  },
  argTypes: {
    ImageRenderer: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof UserMessage>;

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

// Create a larger test image (simple chart-like pattern)
const createChartImage = (): ImageData => ({
  format: 'png',
  bytes:
    'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJkSURBVHgB7Z0hTsNAEEX/JCKoqKmpqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiov/+2s5vZzUySJkkgCQSSQBAJBJJAEAkEkkAQCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkkAw/wCrp1V8sLxNfgAAAABJRU5ErkJggg==',
});

// Mock message creation helper
const createMockUserMessage = (content: string, id = '1'): UserMessageType => ({
  id,
  role: 'user',
  content,
  timestamp: new Date().toISOString(),
});

const createMockImageMessage = (content: string, image: ImageData, id = '1'): UserMessageType => ({
  id,
  role: 'user',
  content,
  image,
  timestamp: new Date().toISOString(),
});

export const Default: Story = {
  args: {
    message: createMockUserMessage('Hello, I need help with OpenSearch Dashboards.'),
    ImageRenderer,
  },
};

export const ShortMessage: Story = {
  args: {
    message: createMockUserMessage('Help'),
    ImageRenderer,
  },
  parameters: {
    docs: {
      description: {
        story: 'User message with very short content.',
      },
    },
  },
};

export const LongMessage: Story = {
  args: {
    message: createMockUserMessage(
      'I have a complex question about setting up OpenSearch Dashboards with multiple data sources. I need to configure index patterns, create visualizations, and set up a comprehensive dashboard that includes time series data, geographical maps, and various aggregations. Can you provide detailed step-by-step instructions?'
    ),
    ImageRenderer,
  },
  parameters: {
    docs: {
      description: {
        story: 'User message with long, detailed content to test text wrapping.',
      },
    },
  },
};

export const WithImage: Story = {
  args: {
    message: createMockImageMessage(
      'Here is a screenshot of the error I am encountering',
      createTestImage('red', 'png')
    ),
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

export const ImageOnly: Story = {
  args: {
    message: createMockImageMessage('', createChartImage()),
    ImageRenderer,
  },
  parameters: {
    docs: {
      description: {
        story: 'User message with only an image and no text content.',
      },
    },
  },
};

export const ImageWithLongText: Story = {
  args: {
    message: createMockImageMessage(
      'This is a detailed screenshot showing the dashboard configuration panel where I am trying to set up multiple visualizations. As you can see in the image, there are several configuration options that I am not sure how to properly configure. I have tried following the documentation but I am still encountering issues with the data source connections.',
      createChartImage()
    ),
    ImageRenderer,
  },
  parameters: {
    docs: {
      description: {
        story: 'User message with both image and lengthy explanatory text.',
      },
    },
  },
};

export const DifferentImageFormats: Story = {
  render: function DifferentImageFormatsRender() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>PNG Format</h4>
          <UserMessage
            message={createMockImageMessage('PNG screenshot', createTestImage('red', 'png'))}
            ImageRenderer={ImageRenderer}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>JPEG Format</h4>
          <UserMessage
            message={createMockImageMessage('JPEG photo', createTestImage('blue', 'jpeg'))}
            ImageRenderer={ImageRenderer}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Comparison of user messages with different image formats.',
      },
    },
  },
};

export const EmptyMessage: Story = {
  args: {
    message: createMockUserMessage(''),
    ImageRenderer,
  },
  parameters: {
    docs: {
      description: {
        story: 'User message with empty content to test edge cases.',
      },
    },
  },
};

export const NoMessage: Story = {
  args: {
    message: undefined,
    ImageRenderer,
  },
  parameters: {
    docs: {
      description: {
        story: 'User message component with undefined message to test edge cases.',
      },
    },
  },
};

export const MultipleMessages: Story = {
  render: function MultipleMessagesRender() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <UserMessage
          message={createMockUserMessage('What is OpenSearch Dashboards?')}
          ImageRenderer={ImageRenderer}
        />
        <UserMessage
          message={createMockUserMessage('How do I create a visualization?')}
          ImageRenderer={ImageRenderer}
        />
        <UserMessage
          message={createMockImageMessage('Here is my current dashboard setup', createChartImage())}
          ImageRenderer={ImageRenderer}
        />
        <UserMessage
          message={createMockUserMessage('Can you help me improve this?')}
          ImageRenderer={ImageRenderer}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple user messages in sequence to show conversational flow.',
      },
    },
  },
};

export const ConversationContext: Story = {
  render: function ConversationContextRender() {
    return (
      <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '16px',
          maxWidth: '500px',
        }}
      >
        <div
          style={{
            marginBottom: '12px',
            fontSize: '12px',
            color: '#888',
          }}
        >
          Chat Session - OpenSearch Support
        </div>
        <UserMessage
          message={createMockUserMessage(
            "I'm having trouble with my dashboard visualization. The data isn't showing up correctly."
          )}
          ImageRenderer={ImageRenderer}
        />
        <div
          style={{
            marginTop: '12px',
            fontSize: '11px',
            color: '#aaa',
            textAlign: 'right',
          }}
        >
          Sent just now
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'User message in a realistic chat conversation context.',
      },
    },
  },
};

export const Interactive: Story = {
  render: function InteractiveRender(args) {
    const [messageType, setMessageType] = React.useState<'text' | 'image'>('text');
    const [content, setContent] = React.useState('This is an interactive user message');
    const [imageColor, setImageColor] = React.useState<'red' | 'blue' | 'green'>('red');

    const message = React.useMemo(() => {
      if (messageType === 'image') {
        return createMockImageMessage(content, createTestImage(imageColor, 'png'));
      }
      return createMockUserMessage(content);
    }, [messageType, content, imageColor]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Type:</label>
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value as 'text' | 'image')}
              style={{ padding: '4px' }}
            >
              <option value="text">Text Only</option>
              <option value="image">With Image</option>
            </select>
          </div>
          {messageType === 'image' && (
            <div>
              <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Image Color:</label>
              <select
                value={imageColor}
                onChange={(e) => setImageColor(e.target.value as 'red' | 'blue' | 'green')}
                style={{ padding: '4px' }}
              >
                <option value="red">Red</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
              </select>
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
        <UserMessage message={message} ImageRenderer={ImageRenderer} />
      </div>
    );
  },
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Interactive user message where you can change the message type, content, and image properties.',
      },
    },
  },
};

export const AllStates: Story = {
  render: function AllStatesRender() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Text Message</h4>
          <UserMessage
            message={createMockUserMessage('Simple text message from user')}
            ImageRenderer={ImageRenderer}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Image with Text</h4>
          <UserMessage
            message={createMockImageMessage(
              'Here is a screenshot of my issue',
              createTestImage('red', 'png')
            )}
            ImageRenderer={ImageRenderer}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Image Only</h4>
          <UserMessage
            message={createMockImageMessage('', createChartImage())}
            ImageRenderer={ImageRenderer}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Empty Message</h4>
          <UserMessage message={createMockUserMessage('')} ImageRenderer={ImageRenderer} />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>No Message</h4>
          <UserMessage message={undefined} ImageRenderer={ImageRenderer} />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all user message states and variants side by side.',
      },
    },
  },
};

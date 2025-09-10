/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ImageRenderer } from './image-renderer';
import { ImageData } from '../../../../common/types';

const meta: Meta<typeof ImageRenderer> = {
  title: 'src/plugins/chat/public/components/messages/image-renderer',
  component: ImageRenderer,
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
          'ImageRenderer displays user-uploaded images in chat messages with base64 encoded data, optional content text, and error handling for failed image loads.',
      },
    },
  },
  argTypes: {
    content: { control: 'text' },
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ImageRenderer>;

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
    'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJkSURBVHgB7Z0hTsNAEEX/JCKoqKmpqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiov/+2s5vZzUySJkkgCQSSQBAJBJJAEAkEkkAQCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkkAw/wCrp1V8sLxNfgAAAABJRU5ErkJggg==',
});

export const Default: Story = {
  args: {
    image: createTestImage('red', 'png'),
  },
};

export const WithContent: Story = {
  args: {
    image: createTestImage('blue', 'png'),
    content: 'This is a user-uploaded image with additional text content.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Image renderer with additional text content displayed below the image.',
      },
    },
  },
};

export const JPEGFormat: Story = {
  args: {
    image: createTestImage('green', 'jpeg'),
    content: 'This is a JPEG format image.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Image renderer displaying a JPEG format image instead of PNG.',
      },
    },
  },
};

export const WithCustomClassName: Story = {
  args: {
    image: createTestImage('red', 'png'),
    content: 'Image with custom CSS class applied.',
    className: 'custom-image-class',
  },
  parameters: {
    docs: {
      description: {
        story: 'Image renderer with a custom CSS class for additional styling.',
      },
    },
  },
};

export const LargerImage: Story = {
  args: {
    image: createChartImage(),
    content: 'This represents a larger image like a chart or diagram that users might upload.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Image renderer with a larger, more complex image to test layout and scaling.',
      },
    },
  },
};

export const LongContent: Story = {
  args: {
    image: createTestImage('blue', 'png'),
    content:
      'This is a much longer text content that accompanies the image. It might contain detailed descriptions, explanations, or context about what the image represents. This helps test how the component handles longer text content alongside the image display.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Image renderer with longer text content to test text wrapping and layout.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    image: {
      format: 'png',
      bytes: 'invalid-base64-data-that-will-cause-error',
    },
    content: 'This image has invalid data and should show an error state.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Image renderer with invalid base64 data to demonstrate error handling.',
      },
    },
  },
};

export const NoContent: Story = {
  args: {
    image: createTestImage('green', 'png'),
    content: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Image renderer with no additional content text, showing only the image.',
      },
    },
  },
};

export const DifferentFormats: Story = {
  render: function DifferentFormatsRender() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>PNG Format</h4>
          <ImageRenderer image={createTestImage('red', 'png')} content="PNG format image" />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>JPEG Format</h4>
          <ImageRenderer image={createTestImage('blue', 'jpeg')} content="JPEG format image" />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different image formats (PNG vs JPEG) side by side.',
      },
    },
  },
};

export const MultipleImages: Story = {
  render: function MultipleImagesRender() {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <ImageRenderer image={createTestImage('red', 'png')} content="Screenshot of dashboard" />
        <ImageRenderer image={createTestImage('blue', 'png')} content="Error message dialog" />
        <ImageRenderer image={createTestImage('green', 'png')} content="Configuration panel" />
        <ImageRenderer image={createChartImage()} content="Performance chart" />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple image renderers in a grid layout to test how they work together.',
      },
    },
  },
};

export const Interactive: Story = {
  render: function InteractiveRender(args) {
    const [imageType, setImageType] = React.useState<'red' | 'blue' | 'green'>('red');
    const [format, setFormat] = React.useState<'png' | 'jpeg'>('png');
    const [content, setContent] = React.useState('Interactive image renderer');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Color:</label>
            <select
              value={imageType}
              onChange={(e) => setImageType(e.target.value as 'red' | 'blue' | 'green')}
              style={{ padding: '4px' }}
            >
              <option value="red">Red</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Format:</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}
              style={{ padding: '4px' }}
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
            Content:
          </label>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ padding: '8px', width: '100%', maxWidth: '400px' }}
            placeholder="Enter content text..."
          />
        </div>
        <ImageRenderer image={createTestImage(imageType, format)} content={content} />
      </div>
    );
  },
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Interactive image renderer where you can change the image type, format, and content text.',
      },
    },
  },
};

export const ChatMessageContext: Story = {
  render: function ChatMessageContextRender() {
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
            fontSize: '14px',
            color: '#666',
            fontWeight: 'bold',
          }}
        >
          User
        </div>
        <div style={{ marginBottom: '16px' }}>
          I'm having an issue with my dashboard. Here's a screenshot:
        </div>
        <ImageRenderer
          image={createChartImage()}
          content="Dashboard showing error in visualization panel"
        />
        <div
          style={{
            marginTop: '16px',
            fontSize: '12px',
            color: '#888',
          }}
        >
          Sent 2 minutes ago
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Image renderer in the context of a chat message to show real-world usage.',
      },
    },
  },
};

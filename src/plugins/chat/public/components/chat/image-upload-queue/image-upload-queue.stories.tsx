/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ImageUploadQueue } from './image-upload-queue';

const meta: Meta<typeof ImageUploadQueue> = {
  title: 'src/plugins/chat/public/components/chat/image-upload-queue',
  component: ImageUploadQueue,
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
          'ImageUploadQueue displays a queue of uploaded images with remove functionality for each image before sending in chat.',
      },
    },
  },
  argTypes: {
    images: { control: false },
    className: { control: 'text' },
    onRemoveImage: { action: 'image removed' },
  },
};

export default meta;
type Story = StoryObj<typeof ImageUploadQueue>;

// Create test image data (small 1x1 pixel images in base64)
const createTestImage = (
  color: 'red' | 'blue' | 'green' | 'yellow' = 'red',
  format: 'png' | 'jpeg' = 'png'
) => {
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
    yellow: {
      png:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkiPvfDwABhgGAWjR9awAAAABJRU5ErkJggg==',
      jpeg:
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wC=',
    },
  };

  return {
    contentType: `image/${format}`,
    bytes: base64Images[color][format],
  };
};

// Create larger test image (simple pattern)
const createLargerTestImage = () => ({
  contentType: 'image/png',
  bytes:
    'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJkSURBVHgB7Z0hTsNAEEX/JCKoqKmpqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiov/+2s5vZzUySJkkgCQSSQBAJBJJAEAkEkkAQCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkUAgCQSRQCAJBJFAIAkEkkAw/wCrp1V8sLxNfgAAAABJRU5ErkJggg==',
});

export const EmptyQueue: Story = {
  args: {
    images: [],
    onRemoveImage: (index) => console.log('Remove image at index:', index),
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty image upload queue (component returns null when no images).',
      },
    },
  },
};

export const SingleImage: Story = {
  args: {
    images: [createTestImage('red', 'png')],
    onRemoveImage: (index) => console.log('Remove image at index:', index),
  },
  parameters: {
    docs: {
      description: {
        story: 'Single image in the upload queue.',
      },
    },
  },
};

export const MultipleImages: Story = {
  args: {
    images: [
      createTestImage('red', 'png'),
      createTestImage('blue', 'png'),
      createTestImage('green', 'png'),
    ],
    onRemoveImage: (index) => console.log('Remove image at index:', index),
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple images in the upload queue.',
      },
    },
  },
};

export const ManyImages: Story = {
  args: {
    images: [
      createTestImage('red', 'png'),
      createTestImage('blue', 'png'),
      createTestImage('green', 'png'),
      createTestImage('yellow', 'png'),
      createTestImage('red', 'jpeg'),
      createTestImage('blue', 'jpeg'),
    ],
    onRemoveImage: (index) => console.log('Remove image at index:', index),
  },
  parameters: {
    docs: {
      description: {
        story: 'Many images in the upload queue to test layout and scrolling.',
      },
    },
  },
};

export const MixedFormats: Story = {
  args: {
    images: [
      createTestImage('red', 'png'),
      createTestImage('blue', 'jpeg'),
      createTestImage('green', 'png'),
      createTestImage('yellow', 'jpeg'),
    ],
    onRemoveImage: (index) => console.log('Remove image at index:', index),
  },
  parameters: {
    docs: {
      description: {
        story: 'Mix of PNG and JPEG images in the upload queue.',
      },
    },
  },
};

export const WithCustomClassName: Story = {
  args: {
    images: [createTestImage('red', 'png'), createTestImage('blue', 'png')],
    className: 'custom-upload-queue',
    onRemoveImage: (index) => console.log('Remove image at index:', index),
  },
  parameters: {
    docs: {
      description: {
        story: 'Image upload queue with custom CSS class applied.',
      },
    },
  },
};

export const LargerImages: Story = {
  args: {
    images: [createLargerTestImage(), createTestImage('blue', 'png'), createLargerTestImage()],
    onRemoveImage: (index) => console.log('Remove image at index:', index),
  },
  parameters: {
    docs: {
      description: {
        story: 'Upload queue with larger test images to test sizing and layout.',
      },
    },
  },
};

export const Interactive: Story = {
  render: function InteractiveRender(args) {
    const [images, setImages] = React.useState([
      createTestImage('red', 'png'),
      createTestImage('blue', 'png'),
      createTestImage('green', 'png'),
      createTestImage('yellow', 'png'),
    ]);
    const [removedImages, setRemovedImages] = React.useState<number[]>([]);

    const handleRemoveImage = (index: number) => {
      setRemovedImages((prev) => [...prev, index]);
      setImages((prev) => prev.filter((_, i) => i !== index));
      args.onRemoveImage?.(index);
    };

    const handleAddImage = () => {
      const colors: Array<'red' | 'blue' | 'green' | 'yellow'> = ['red', 'blue', 'green', 'yellow'];
      const formats: Array<'png' | 'jpeg'> = ['png', 'jpeg'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomFormat = formats[Math.floor(Math.random() * formats.length)];

      setImages((prev) => [...prev, createTestImage(randomColor, randomFormat)]);
    };

    const handleReset = () => {
      setImages([
        createTestImage('red', 'png'),
        createTestImage('blue', 'png'),
        createTestImage('green', 'png'),
        createTestImage('yellow', 'png'),
      ]);
      setRemovedImages([]);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleAddImage}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0073e6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add Random Image
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>

        <ImageUploadQueue images={images} onRemoveImage={handleRemoveImage} />

        <div
          style={{
            padding: '8px',
            backgroundColor: '#f9f9f9',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <div>
            <strong>Current images:</strong> {images.length}
          </div>
          <div>
            <strong>Removed images:</strong> {removedImages.length}
          </div>
          {removedImages.length > 0 && (
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
              Removed indices: {removedImages.join(', ')}
            </div>
          )}
        </div>
      </div>
    );
  },
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Interactive upload queue where you can add and remove images dynamically.',
      },
    },
  },
};

export const ChatContext: Story = {
  render: function ChatContextRender() {
    const [images, setImages] = React.useState([
      createTestImage('red', 'png'),
      createLargerTestImage(),
    ]);

    const handleRemoveImage = (index: number) => {
      setImages((prev) => prev.filter((_, i) => i !== index));
    };

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
            fontSize: '14px',
            color: '#666',
            marginBottom: '12px',
            fontWeight: 'bold',
          }}
        >
          Chat Input with Image Queue
        </div>

        <ImageUploadQueue images={images} onRemoveImage={handleRemoveImage} />

        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        >
          <textarea
            placeholder="Type your message here..."
            style={{
              width: '100%',
              minHeight: '60px',
              border: 'none',
              backgroundColor: 'transparent',
              resize: 'none',
              fontSize: '14px',
            }}
            disabled={images.length === 0}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#666' }}>
              {images.length} image{images.length !== 1 ? 's' : ''} attached
            </div>
            <button
              style={{
                padding: '6px 12px',
                backgroundColor: images.length > 0 ? '#0073e6' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: images.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '12px',
              }}
              disabled={images.length === 0}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Image upload queue in the context of a chat input interface.',
      },
    },
  },
};

export const AllStates: Story = {
  render: function AllStatesRender() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Empty Queue</h4>
          <ImageUploadQueue images={[]} onRemoveImage={(index) => console.log('Remove:', index)} />
          <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
            (Component returns null when empty)
          </p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Single Image</h4>
          <ImageUploadQueue
            images={[createTestImage('red', 'png')]}
            onRemoveImage={(index) => console.log('Remove:', index)}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Multiple Images</h4>
          <ImageUploadQueue
            images={[
              createTestImage('red', 'png'),
              createTestImage('blue', 'jpeg'),
              createTestImage('green', 'png'),
            ]}
            onRemoveImage={(index) => console.log('Remove:', index)}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Many Images</h4>
          <ImageUploadQueue
            images={[
              createTestImage('red', 'png'),
              createTestImage('blue', 'png'),
              createTestImage('green', 'png'),
              createTestImage('yellow', 'png'),
              createTestImage('red', 'jpeg'),
              createTestImage('blue', 'jpeg'),
            ]}
            onRemoveImage={(index) => console.log('Remove:', index)}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all image upload queue states side by side.',
      },
    },
  },
};

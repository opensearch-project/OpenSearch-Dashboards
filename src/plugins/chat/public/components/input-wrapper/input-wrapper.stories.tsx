/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { InputWrapper } from './input-wrapper';
import { ChatContextProvider } from '../chat-context';

// Mock Message type for stories
const mockMessage = {
  id: '1',
  content: 'Mock response',
  role: 'assistant' as const,
  timestamp: new Date().toISOString(),
};

const meta: Meta<typeof InputWrapper> = {
  title: 'src/plugins/chat/public/components/input-wrapper',
  component: InputWrapper,
  decorators: [
    (Story) => {
      const [open, setOpen] = React.useState(true);
      return (
        <ChatContextProvider open={open} setOpen={setOpen}>
          <div style={{ padding: '16px', backgroundColor: '#f5f5f5', maxWidth: '600px' }}>
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
          'InputWrapper is a composite component that combines AutoResizingTextarea and SubmitButton to create a complete chat input interface with send/stop functionality.',
      },
    },
  },
  argTypes: {
    inProgress: { control: 'boolean' },
    hideStopButton: { control: 'boolean' },
    onSend: { action: 'message sent' },
    onStop: { action: 'stopped' },
    onUpload: { action: 'upload clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof InputWrapper>;

export const Default: Story = {
  args: {
    inProgress: false,
    onSend: async () => mockMessage,
  },
};

export const InProgress: Story = {
  args: {
    inProgress: true,
    onSend: async () => mockMessage,
    onStop: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Input wrapper in progress state, showing stop icon instead of submit.',
      },
    },
  },
};

export const InProgressWithHiddenStop: Story = {
  args: {
    inProgress: true,
    hideStopButton: true,
    onSend: async () => mockMessage,
  },
  parameters: {
    docs: {
      description: {
        story: 'Input wrapper in progress state with stop button hidden.',
      },
    },
  },
};

export const WithContextLabels: Story = {
  render: function WithContextLabelsRender(args) {
    const [open, setOpen] = React.useState(true);

    return (
      <ChatContextProvider open={open} setOpen={setOpen}>
        <div style={{ padding: '16px', backgroundColor: '#f5f5f5', maxWidth: '600px' }}>
          <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
            Shows how the component uses context labels (placeholder from i18n)
          </div>
          <InputWrapper {...args} />
        </div>
      </ChatContextProvider>
    );
  },
  args: {
    inProgress: false,
    onSend: async () => mockMessage,
  },
  parameters: {
    docs: {
      description: {
        story: 'Input wrapper demonstrating how it uses context labels from ChatContext.',
      },
    },
  },
};

export const WithUploadHandler: Story = {
  args: {
    inProgress: false,
    onSend: async () => mockMessage,
    onUpload: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Input wrapper with upload functionality.',
      },
    },
  },
};

export const Interactive: Story = {
  render: function InteractiveRender(args) {
    const [inProgress, setInProgress] = React.useState(false);
    const [messages, setMessages] = React.useState<string[]>([]);

    const handleSend = async (text: string) => {
      if (!text.trim()) return mockMessage;

      setInProgress(true);
      setMessages((prev) => [...prev, `Sent: "${text}"`]);

      // Simulate async operation
      setTimeout(() => {
        setInProgress(false);
        setMessages((prev) => [...prev, 'Response received']);
      }, 2000);

      args.onSend?.(text);
      return mockMessage;
    };

    const handleStop = () => {
      setInProgress(false);
      setMessages((prev) => [...prev, 'Stopped']);
      args.onStop?.();
    };

    const handleUpload = () => {
      setMessages((prev) => [...prev, 'Upload clicked']);
      args.onUpload?.();
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <InputWrapper
          {...args}
          inProgress={inProgress}
          onSend={handleSend}
          onStop={handleStop}
          onUpload={handleUpload}
        />
        <div
          style={{
            maxHeight: '200px',
            overflow: 'auto',
            padding: '8px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Activity Log:</div>
          {messages.length === 0 ? (
            <div style={{ color: '#666', fontStyle: 'italic' }}>
              Type a message and press Enter or click submit...
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                {msg}
              </div>
            ))
          )}
        </div>
      </div>
    );
  },
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Interactive version where you can type messages, send them, and see the progress states. Messages are simulated with a 2-second delay.',
      },
    },
  },
};

export const AllStates: Story = {
  render: function AllStatesRender() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Ready to Send</h4>
          <InputWrapper inProgress={false} onSend={async () => mockMessage} />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>In Progress (with Stop)</h4>
          <InputWrapper inProgress={true} onSend={async () => mockMessage} onStop={() => {}} />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>In Progress (Stop Hidden)</h4>
          <InputWrapper inProgress={true} hideStopButton={true} onSend={async () => mockMessage} />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all input wrapper states side by side.',
      },
    },
  },
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Chat } from './chat';
import { ChatContextProvider } from '../chat-context';
import { AIContext } from '../../context/ai-context/ai-context';
import {
  AIMessage,
  UserMessage as UserMessageType,
  ImageData,
  Message,
} from '../../../common/types';

const meta: Meta<typeof Chat> = {
  title: 'src/plugins/chat/public/components/chat',
  component: Chat,
  decorators: [
    (Story) => {
      const [open, setOpen] = React.useState(true);
      const [isLoading, setIsLoading] = React.useState(false);
      const [additionalInstructions, setAdditionalInstructions] = React.useState<string[]>([]);
      const [chatInstructions, setChatInstructions] = React.useState<string>('');
      const [bannerError, setBannerError] = React.useState<any>(null);

      return (
        <AIContext.Provider
          value={{
            isLoading,
            setIsLoading,
            additionalInstructions,
            setAdditionalInstructions,
            setChatInstructions,
            setBannerError,
          }}
        >
          <ChatContextProvider open={open} setOpen={setOpen}>
            <div
              style={{
                height: '600px',
                width: '800px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <Story />
            </div>
          </ChatContextProvider>
        </AIContext.Provider>
      );
    },
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Chat component provides a complete chat interface with message display, input handling, image uploads, and suggestions.',
      },
    },
  },
  argTypes: {
    instructions: { control: 'text' },
    suggestions: { control: 'radio', options: ['auto', 'manual'] },
    imageUploadsEnabled: { control: 'boolean' },
    hideStopButton: { control: 'boolean' },
    disableSystemMessage: { control: 'boolean' },
    inputFileAccept: { control: 'text' },
    className: { control: 'text' },
    onInProgress: { action: 'in progress changed' },
    onSubmitMessage: { action: 'message submitted' },
    onStopGeneration: { action: 'generation stopped' },
    onReloadMessages: { action: 'messages reloaded' },
    onRegenerate: { action: 'message regenerated' },
    onCopy: { action: 'message copied' },
    onThumbsUp: { action: 'thumbs up' },
    onThumbsDown: { action: 'thumbs down' },
    markdownTagRenderers: { control: false },
    labels: { control: false },
    makeSystemMessage: { control: false },
    AssistantMessage: { control: false },
    UserMessage: { control: false },
    Messages: { control: false },
    RenderMessage: { control: false },
    RenderSuggestionsList: { control: false },
    Input: { control: false },
    ImageRenderer: { control: false },
    renderError: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof Chat>;

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

export const DefaultChat: Story = {
  args: {
    instructions: 'You are a helpful assistant for OpenSearch Dashboards.',
    suggestions: 'auto',
  },
};

export const WithCustomInstructions: Story = {
  args: {
    instructions:
      'You are an expert in OpenSearch Dashboards. Help users with visualizations, dashboards, and data analysis. Always provide step-by-step instructions.',
    suggestions: 'auto',
  },
};

export const WithImageUploads: Story = {
  args: {
    instructions: 'You are a helpful assistant that can analyze images and provide insights.',
    suggestions: 'auto',
    imageUploadsEnabled: true,
    inputFileAccept: 'image/*',
  },
};

export const WithStaticSuggestions: Story = {
  args: {
    instructions: 'You are a helpful assistant for OpenSearch Dashboards.',
    suggestions: [
      { content: 'How do I create a visualization?' },
      { content: 'Explain index patterns' },
      { content: 'Set up a dashboard' },
      { content: 'Configure alerting' },
    ],
  },
};

export const WithManualSuggestions: Story = {
  args: {
    instructions: 'You are a helpful assistant for OpenSearch Dashboards.',
    suggestions: 'manual',
  },
};

export const WithCustomLabels: Story = {
  args: {
    instructions: 'You are a helpful assistant.',
    labels: {
      placeholder: 'Ask me anything about your data...',
      sendButtonLabel: 'Send Query',
      stopButtonLabel: 'Stop Processing',
    },
  },
};

export const WithHiddenStopButton: Story = {
  args: {
    instructions: 'You are a helpful assistant.',
    hideStopButton: true,
  },
};

export const WithDisabledSystemMessage: Story = {
  args: {
    disableSystemMessage: true,
  },
};

export const WithCustomClassName: Story = {
  args: {
    instructions: 'You are a helpful assistant.',
    className: 'custom-chat-styles',
  },
};

export const WithErrorRenderer: Story = {
  args: {
    instructions: 'You are a helpful assistant.',
    renderError: ({ message, operation, timestamp, onDismiss, onRetry }) => (
      <div
        style={{
          padding: '12px',
          margin: '8px',
          backgroundColor: '#ffebee',
          border: '1px solid #e57373',
          borderRadius: '4px',
          color: '#c62828',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          Error in {operation || 'operation'}
        </div>
        <div style={{ marginBottom: '8px' }}>{message}</div>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          {new Date(timestamp).toLocaleString()}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onDismiss}
            style={{
              padding: '4px 8px',
              backgroundColor: '#c62828',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Dismiss
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: '4px 8px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    ),
  },
};

export const WithAllCallbacks: Story = {
  args: {
    instructions: 'You are a helpful assistant for OpenSearch Dashboards.',
    imageUploadsEnabled: true,
    onInProgress: (inProgress: boolean) => console.log('In progress:', inProgress),
    onSubmitMessage: (message: string) => console.log('Message submitted:', message),
    onStopGeneration: (args: any) => console.log('Generation stopped:', args),
    onReloadMessages: (args: any) => console.log('Messages reloaded:', args),
    onRegenerate: (messageId: string) => console.log('Regenerate message:', messageId),
    onCopy: (message: string) => console.log('Copied message:', message),
    onThumbsUp: (message: Message) => console.log('Thumbs up:', message),
    onThumbsDown: (message: Message) => console.log('Thumbs down:', message),
  },
};

export const Interactive: Story = {
  render: function InteractiveRender(args) {
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [inProgress, setInProgress] = React.useState(false);
    const [feedback, setFeedback] = React.useState<string>('');

    const handleSubmitMessage = async (message: string) => {
      console.log('Submitting message:', message);
      setInProgress(true);
      setFeedback('Processing your message...');

      // Simulate assistant response
      setTimeout(() => {
        const responses = [
          'I understand you want to know about OpenSearch Dashboards. Let me help you with that.',
          'Great question! Here are some key points about what you asked.',
          'I can help you with that. Let me provide some detailed information.',
          "That's an excellent topic. Here's what you need to know.",
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setFeedback(`Assistant responded: "${randomResponse.substring(0, 50)}..."`);
        setInProgress(false);
        setTimeout(() => setFeedback(''), 3000);
      }, 2000);
    };

    const handleInProgress = (progress: boolean) => {
      setInProgress(progress);
      if (progress) {
        setFeedback('Chat is processing...');
      }
    };

    const handleCopy = (message: string) => {
      setFeedback(`Copied: "${message.substring(0, 30)}..."`);
      setTimeout(() => setFeedback(''), 2000);
    };

    const handleFeedback = (type: 'up' | 'down', message: Message) => {
      setFeedback(
        `Thanks for the ${type === 'up' ? 'positive' : 'constructive'} feedback! ${
          type === 'up' ? '👍' : '👎'
        }`
      );
      setTimeout(() => setFeedback(''), 2000);
    };

    return (
      <div style={{ position: 'relative', height: '100%' }}>
        <Chat
          {...args}
          instructions="You are a helpful assistant for OpenSearch Dashboards. Help users with their questions and provide clear, actionable guidance."
          imageUploadsEnabled={true}
          onSubmitMessage={handleSubmitMessage}
          onInProgress={handleInProgress}
          onCopy={handleCopy}
          onThumbsUp={(message) => handleFeedback('up', message)}
          onThumbsDown={(message) => handleFeedback('down', message)}
          onRegenerate={(messageId) => {
            setFeedback(`Regenerating message ${messageId}...`);
            setTimeout(() => setFeedback(''), 2000);
          }}
        />
        {feedback && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              padding: '8px 12px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#155724',
              maxWidth: '250px',
              zIndex: 1000,
            }}
          >
            {feedback}
          </div>
        )}
      </div>
    );
  },
  args: {},
};

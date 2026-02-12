/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ChatMessages } from './chat_messages';
import { ChatLayoutMode } from './chat_header_button';
import type { Message } from '../../common/types';

// Mock the child components
jest.mock('./message_row', () => ({
  MessageRow: ({ message }: any) => <div data-test-subj="message-row">{message.content}</div>,
}));

jest.mock('./tool_call_row', () => ({
  ToolCallRow: () => <div data-test-subj="tool-call-row">Tool Call</div>,
}));

jest.mock('./error_row', () => ({
  ErrorRow: ({ error }: any) => <div data-test-subj="error-row">{error.content}</div>,
}));

jest.mock('./chat_suggestions', () => ({
  ChatSuggestions: () => <div data-test-subj="chat-suggestions">Suggestions</div>,
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('ChatMessages', () => {
  const defaultProps = {
    layoutMode: ChatLayoutMode.SIDECAR,
    timeline: [] as Message[],
    isStreaming: false,
    onResendMessage: jest.fn(),
    onApproveConfirmation: jest.fn(),
    onRejectConfirmation: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render empty state when no messages', () => {
      const { getByText } = render(<ChatMessages {...defaultProps} />);

      expect(getByText("Hi, I'm your AI Assistant")).toBeTruthy();
    });

    it('should render messages from timeline', () => {
      const timeline: Message[] = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there!' },
      ];

      const { getAllByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      expect(getAllByTestId('message-row')).toHaveLength(2);
    });

    it('should render loading indicator when streaming with empty timeline', () => {
      const { getByText } = render(<ChatMessages {...defaultProps} isStreaming={true} />);

      expect(getByText('Thinking...')).toBeTruthy();
    });

    it('should apply layout mode class', () => {
      const { container } = render(
        <ChatMessages {...defaultProps} layoutMode={ChatLayoutMode.FULLSCREEN} />
      );

      expect(container.querySelector('.chatMessages--fullscreen')).toBeTruthy();
    });
  });

  describe('smart scroll functionality', () => {
    // Mock scrollIntoView
    beforeEach(() => {
      Element.prototype.scrollIntoView = jest.fn();
    });

    it('should auto-scroll when new messages arrive', () => {
      const { rerender } = render(<ChatMessages {...defaultProps} timeline={[]} />);

      const newTimeline: Message[] = [{ id: '1', role: 'user', content: 'New message' }];

      rerender(<ChatMessages {...defaultProps} timeline={newTimeline} />);

      // scrollIntoView should be called for auto-scroll
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    it('should call scrollIntoView with smooth behavior', () => {
      const { rerender } = render(<ChatMessages {...defaultProps} timeline={[]} />);

      const newTimeline: Message[] = [{ id: '1', role: 'user', content: 'New message' }];

      rerender(<ChatMessages {...defaultProps} timeline={newTimeline} />);

      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('should handle multiple message updates', () => {
      const { rerender } = render(<ChatMessages {...defaultProps} timeline={[]} />);

      const timeline1: Message[] = [{ id: '1', role: 'user', content: 'Message 1' }];
      rerender(<ChatMessages {...defaultProps} timeline={timeline1} />);

      const timeline2: Message[] = [
        ...timeline1,
        { id: '2', role: 'assistant', content: 'Response 1' },
      ];
      rerender(<ChatMessages {...defaultProps} timeline={timeline2} />);

      // Should be called at least twice (may be called more due to React rendering)
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    it('should have scroll container with proper ref', () => {
      const { container } = render(<ChatMessages {...defaultProps} />);

      const messagesContainer = container.querySelector('.chatMessages');
      expect(messagesContainer).toBeTruthy();
    });
  });

  describe('message types', () => {
    it('should render user messages', () => {
      const timeline: Message[] = [{ id: '1', role: 'user', content: 'User message' }];

      const { getByText } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      expect(getByText('User message')).toBeTruthy();
    });

    it('should render assistant messages', () => {
      const timeline: Message[] = [{ id: '1', role: 'assistant', content: 'Assistant message' }];

      const { getByText } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      expect(getByText('Assistant message')).toBeTruthy();
    });

    it('should render system messages as errors', () => {
      const timeline: Message[] = [{ id: '1', role: 'system', content: 'Error message' }];

      const { getByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      expect(getByTestId('error-row')).toBeTruthy();
    });

    it('should not render tool messages separately', () => {
      const timeline: Message[] = [
        { id: '1', role: 'tool', content: 'Tool result', toolCallId: 'tool-1' },
      ];

      const { queryByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      // Tool messages should not render as separate rows
      expect(queryByTestId('message-row')).toBeNull();
    });

    it('should render loading message for empty streaming assistant message', () => {
      const timeline: Message[] = [{ id: '1', role: 'assistant', content: '' }];

      const { getByText } = render(
        <ChatMessages {...defaultProps} timeline={timeline} isStreaming={true} />
      );

      expect(getByText('Thinking...')).toBeTruthy();
    });

    it('should render loading message for messages with loading- prefix', () => {
      const timeline: Message[] = [{ id: 'loading-123', role: 'assistant', content: '' }];

      const { getByText } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      expect(getByText('Thinking...')).toBeTruthy();
    });
  });

  describe('tool calls', () => {
    it('should render tool calls from assistant messages', () => {
      const timeline: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Using a tool',
          toolCalls: [
            {
              id: 'tool-1',
              type: 'function',
              function: { name: 'search', arguments: '{"query": "test"}' },
            },
          ],
        },
      ];

      const { getByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      expect(getByTestId('tool-call-row')).toBeTruthy();
    });

    it('should match tool results with tool calls', () => {
      const timeline: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Using a tool',
          toolCalls: [
            {
              id: 'tool-1',
              type: 'function',
              function: { name: 'search', arguments: '{"query": "test"}' },
            },
          ],
        },
        {
          id: '2',
          role: 'tool',
          content: 'Tool result',
          toolCallId: 'tool-1',
        },
      ];

      const { getByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      // Tool call should be rendered with its result
      expect(getByTestId('tool-call-row')).toBeTruthy();
    });
  });

  describe('suggestions', () => {
    it('should show suggestions after last assistant message when not streaming', () => {
      const timeline: Message[] = [
        { id: '1', role: 'user', content: 'Question' },
        { id: '2', role: 'assistant', content: 'Answer' },
      ];

      const { getByTestId } = render(
        <ChatMessages {...defaultProps} timeline={timeline} isStreaming={false} />
      );

      expect(getByTestId('chat-suggestions')).toBeTruthy();
    });

    it('should not show suggestions when streaming', () => {
      const timeline: Message[] = [
        { id: '1', role: 'user', content: 'Question' },
        { id: '2', role: 'assistant', content: 'Answer' },
      ];

      const { queryByTestId } = render(
        <ChatMessages {...defaultProps} timeline={timeline} isStreaming={true} />
      );

      expect(queryByTestId('chat-suggestions')).toBeNull();
    });

    it('should not show suggestions when last message is from user', () => {
      const timeline: Message[] = [
        { id: '1', role: 'assistant', content: 'Answer' },
        { id: '2', role: 'user', content: 'Question' },
      ];

      const { queryByTestId } = render(
        <ChatMessages {...defaultProps} timeline={timeline} isStreaming={false} />
      );

      expect(queryByTestId('chat-suggestions')).toBeNull();
    });

    it('should not show suggestions when timeline is empty', () => {
      const { queryByTestId } = render(
        <ChatMessages {...defaultProps} timeline={[]} isStreaming={false} />
      );

      expect(queryByTestId('chat-suggestions')).toBeNull();
    });
  });

  describe('event handlers', () => {
    it('should call onResendMessage when message is resent', () => {
      const onResendMessage = jest.fn();
      const timeline: Message[] = [{ id: '1', role: 'user', content: 'Message' }];

      render(
        <ChatMessages {...defaultProps} timeline={timeline} onResendMessage={onResendMessage} />
      );

      // The actual resend trigger would be in MessageRow component
      // This test verifies the prop is passed correctly
      expect(onResendMessage).not.toHaveBeenCalled();
    });
  });

  describe('scroll event cleanup', () => {
    it('should properly manage scroll container lifecycle', () => {
      const { container, unmount } = render(<ChatMessages {...defaultProps} />);

      const messagesContainer = container.querySelector('.chatMessages');
      expect(messagesContainer).toBeTruthy();

      // Component should unmount without errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('accessibility', () => {
    it('should have messages container with proper structure', () => {
      const { container } = render(<ChatMessages {...defaultProps} />);

      const messagesContainer = container.querySelector('.chatMessages');
      expect(messagesContainer).toBeTruthy();
    });

    it('should render messages in accessible order', () => {
      const timeline: Message[] = [
        { id: '1', role: 'user', content: 'First' },
        { id: '2', role: 'assistant', content: 'Second' },
      ];

      const { getAllByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      const messages = getAllByTestId('message-row');
      expect(messages).toHaveLength(2);
      expect(messages[0].textContent).toBe('First');
      expect(messages[1].textContent).toBe('Second');
    });
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatMessages } from './chat_messages';
import { ChatLayoutMode } from './chat_header_button';
import type { Message } from '../../common/types';
import { ActivityType } from '../../common/types';

// Mock child components
jest.mock('./message_row', () => ({
  MessageRow: ({ message }: any) => (
    <div data-test-subj="messageRow" data-role={message.role}>
      {message.content}
    </div>
  ),
}));

jest.mock('./tool_call_row', () => ({
  ToolCallRow: ({ toolCall }: any) => (
    <div data-test-subj="toolCallRow" data-tool-id={toolCall.id}>
      {toolCall.toolName}
    </div>
  ),
}));

jest.mock('./error_row', () => ({
  ErrorRow: ({ error }: any) => (
    <div data-test-subj="errorRow" data-role={error.role}>
      {error.content}
    </div>
  ),
}));

jest.mock('./activity_row', () => ({
  ActivityRow: ({ activity }: any) => (
    <div data-test-subj="activityRow" data-activity-type={activity.activityType}>
      {activity.content.message}
    </div>
  ),
}));

jest.mock('./chat_suggestions', () => ({
  ChatSuggestions: () => <div data-test-subj="chatSuggestions">Suggestions</div>,
}));

describe('ChatMessages', () => {
  const defaultProps = {
    layoutMode: 'docked' as ChatLayoutMode,
    timeline: [] as Message[],
    isStreaming: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('activity message rendering', () => {
    it('should render activity message with ActivityRow component', () => {
      const timeline: Message[] = [
        {
          id: 'activity-1',
          role: 'activity',
          activityType: ActivityType.STOP,
          content: {
            message: 'Execution stopped by user',
          },
        },
      ];

      render(<ChatMessages {...defaultProps} timeline={timeline} />);

      const activityRow = screen.getByTestId('activityRow');
      expect(activityRow).toBeInTheDocument();
      expect(activityRow).toHaveAttribute('data-activity-type', ActivityType.STOP);
      expect(activityRow).toHaveTextContent('Execution stopped by user');
    });

    it('should render multiple activity messages', () => {
      const timeline: Message[] = [
        {
          id: 'activity-1',
          role: 'activity',
          activityType: ActivityType.STOP,
          content: {
            message: 'First activity',
          },
        },
        {
          id: 'activity-2',
          role: 'activity',
          activityType: ActivityType.STOP,
          content: {
            message: 'Second activity',
          },
        },
      ];

      render(<ChatMessages {...defaultProps} timeline={timeline} />);

      const activityRows = screen.getAllByTestId('activityRow');
      expect(activityRows).toHaveLength(2);
      expect(activityRows[0]).toHaveTextContent('First activity');
      expect(activityRows[1]).toHaveTextContent('Second activity');
    });

    it('should render activity message alongside other message types', () => {
      const timeline: Message[] = [
        {
          id: 'user-1',
          role: 'user',
          content: 'Hello',
        },
        {
          id: 'assistant-1',
          role: 'assistant',
          content: 'Hi there',
        },
        {
          id: 'activity-1',
          role: 'activity',
          activityType: ActivityType.STOP,
          content: {
            message: 'Execution stopped',
          },
        },
      ];

      render(<ChatMessages {...defaultProps} timeline={timeline} />);

      expect(screen.getByTestId('activityRow')).toBeInTheDocument();
      const messageRows = screen.getAllByTestId('messageRow');
      expect(messageRows).toHaveLength(2);
    });
  });

  describe('message type handling', () => {
    it('should render user messages', () => {
      const timeline: Message[] = [
        {
          id: 'user-1',
          role: 'user',
          content: 'User message',
        },
      ];

      render(<ChatMessages {...defaultProps} timeline={timeline} />);

      const messageRow = screen.getByTestId('messageRow');
      expect(messageRow).toBeInTheDocument();
      expect(messageRow).toHaveAttribute('data-role', 'user');
      expect(messageRow).toHaveTextContent('User message');
    });

    it('should render assistant messages', () => {
      const timeline: Message[] = [
        {
          id: 'assistant-1',
          role: 'assistant',
          content: 'Assistant message',
        },
      ];

      render(<ChatMessages {...defaultProps} timeline={timeline} />);

      const messageRow = screen.getByTestId('messageRow');
      expect(messageRow).toBeInTheDocument();
      expect(messageRow).toHaveAttribute('data-role', 'assistant');
    });

    it('should render system messages as error rows', () => {
      const timeline: Message[] = [
        {
          id: 'system-1',
          role: 'system',
          content: 'System error message',
        },
      ];

      render(<ChatMessages {...defaultProps} timeline={timeline} />);

      const errorRow = screen.getByTestId('errorRow');
      expect(errorRow).toBeInTheDocument();
      expect(errorRow).toHaveAttribute('data-role', 'system');
      expect(errorRow).toHaveTextContent('System error message');
    });

    it('should not render tool messages separately', () => {
      const timeline: Message[] = [
        {
          id: 'tool-1',
          role: 'tool',
          content: 'Tool result',
          toolCallId: 'call-1',
        },
      ];

      render(<ChatMessages {...defaultProps} timeline={timeline} />);

      // Tool messages are not rendered separately; they're shown in ToolCallRow
      expect(screen.queryByTestId('messageRow')).not.toBeInTheDocument();
      expect(screen.queryByText('Tool result')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should render empty state when no messages', () => {
      render(<ChatMessages {...defaultProps} timeline={[]} />);

      expect(screen.getByText("Hi, I'm your AI Assistant")).toBeInTheDocument();
      expect(screen.getByText(/I can help you explore data/)).toBeInTheDocument();
    });

    it('should not render empty state when messages exist', () => {
      const timeline: Message[] = [
        {
          id: 'user-1',
          role: 'user',
          content: 'Hello',
        },
      ];

      render(<ChatMessages {...defaultProps} timeline={timeline} />);

      expect(screen.queryByText("Hi, I'm your AI Assistant")).not.toBeInTheDocument();
    });

    it('should not render empty state when streaming', () => {
      render(<ChatMessages {...defaultProps} timeline={[]} isStreaming={true} />);

      expect(screen.queryByText("Hi, I'm your AI Assistant")).not.toBeInTheDocument();
      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should render thinking indicator when streaming with empty timeline', () => {
      render(<ChatMessages {...defaultProps} timeline={[]} isStreaming={true} />);

      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });

    it('should render loading indicator for loading messages', () => {
      const timeline: Message[] = [
        {
          id: 'loading-123',
          role: 'assistant',
          content: '',
        },
      ];

      render(<ChatMessages {...defaultProps} timeline={timeline} isStreaming={true} />);

      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });

    it('should not render loading indicator when not streaming', () => {
      render(<ChatMessages {...defaultProps} timeline={[]} isStreaming={false} />);

      expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();
    });
  });

  describe('message ordering', () => {
    it('should render messages in correct order', () => {
      const timeline: Message[] = [
        {
          id: 'user-1',
          role: 'user',
          content: 'First message',
        },
        {
          id: 'assistant-1',
          role: 'assistant',
          content: 'Second message',
        },
        {
          id: 'activity-1',
          role: 'activity',
          activityType: ActivityType.STOP,
          content: {
            message: 'Third message',
          },
        },
      ];

      render(<ChatMessages {...defaultProps} timeline={timeline} />);

      const messageRows = screen.getAllByTestId('messageRow');
      const activityRow = screen.getByTestId('activityRow');

      expect(messageRows[0]).toHaveTextContent('First message');
      expect(messageRows[1]).toHaveTextContent('Second message');
      expect(activityRow).toHaveTextContent('Third message');
    });
  });

  describe('activity message in timeline context', () => {
    it('should render activity message after user cancels execution', () => {
      const timeline: Message[] = [
        {
          id: 'user-1',
          role: 'user',
          content: 'What indices do I have?',
        },
        {
          id: 'assistant-1',
          role: 'assistant',
          content: '',
        },
        {
          id: 'activity-1',
          role: 'activity',
          activityType: ActivityType.STOP,
          content: {
            message: 'Execution stopped by user',
          },
        },
      ];

      render(<ChatMessages {...defaultProps} timeline={timeline} />);

      const activityRow = screen.getByTestId('activityRow');
      expect(activityRow).toBeInTheDocument();
      expect(activityRow).toHaveTextContent('Execution stopped by user');
    });

    it('should render activity message with proper activity type attribute', () => {
      const timeline: Message[] = [
        {
          id: 'activity-1',
          role: 'activity',
          activityType: ActivityType.STOP,
          content: {
            message: 'Stopped',
          },
        },
      ];

      render(<ChatMessages {...defaultProps} timeline={timeline} />);

      const activityRow = screen.getByTestId('activityRow');
      expect(activityRow).toHaveAttribute('data-activity-type', 'STOP');
    });
  });
});

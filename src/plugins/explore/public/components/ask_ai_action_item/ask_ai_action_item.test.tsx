/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AskAIActionItem } from './ask_ai_action_item';
// @ts-expect-error TS2307 TODO(ts-error): fixme
import { ChatServiceStart } from '../../../../../../core/public';
import { LogActionContext } from '../../types/log_actions';

// Mock dependencies
jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      contextProvider: {
        hooks: {
          useDynamicContext: jest.fn().mockReturnValue('mock-context-id'),
        },
      },
    },
  }),
}));

describe('AskAIActionItem', () => {
  let mockChatService: jest.Mocked<ChatServiceStart>;
  let mockOnClose: jest.Mock;
  let mockOnResult: jest.Mock;
  let mockContext: LogActionContext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChatService = {
      isAvailable: jest.fn().mockReturnValue(true),
      sendMessageWithWindow: jest.fn().mockResolvedValue(undefined),
      isWindowOpen: jest.fn().mockReturnValue(false),
      getThreadId$: jest.fn(),
      getThreadId: jest.fn(),
      openWindow: jest.fn(),
      closeWindow: jest.fn(),
      sendMessage: jest.fn(),
      getWindowState$: jest.fn(),
      onWindowOpen: jest.fn(),
      onWindowClose: jest.fn(),
      suggestedActionsService: undefined,
    };

    mockOnClose = jest.fn();
    mockOnResult = jest.fn();

    mockContext = {
      document: {
        _id: 'test-log-1',
        message: 'Test log message',
        timestamp: '2024-01-01T00:00:00Z',
      },
      query: 'test query',
      indexPattern: 'logs-*',
      metadata: { index: 0 },
    };
  });

  describe('rendering', () => {
    it('should render with initial state', () => {
      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          onResult={mockOnResult}
          chatService={mockChatService}
        />
      );

      expect(
        screen.getByPlaceholderText('Ask a question about this log entry...')
      ).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Send to AI')).toBeInTheDocument();
    });

    it('should disable execute button when input is empty', () => {
      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          chatService={mockChatService}
        />
      );

      const executeButton = screen.getByTestId('askAiActionExecuteButton');
      expect(executeButton).toBeDisabled();
    });

    it('should enable execute button when input has text', () => {
      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          chatService={mockChatService}
        />
      );

      const input = screen.getByTestId('askAiActionInput');
      fireEvent.change(input, { target: { value: 'What caused this error?' } });

      const executeButton = screen.getByTestId('askAiActionExecuteButton');
      expect(executeButton).not.toBeDisabled();
    });
  });

  describe('user input handling', () => {
    it('should update input value on change', () => {
      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          chatService={mockChatService}
        />
      );

      const input = screen.getByTestId('askAiActionInput') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Test question' } });

      expect(input.value).toBe('Test question');
    });

    it('should execute on Enter key press', async () => {
      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          chatService={mockChatService}
        />
      );

      const input = screen.getByTestId('askAiActionInput');
      fireEvent.change(input, { target: { value: 'Test question' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(mockChatService.sendMessageWithWindow).toHaveBeenCalled();
      });
    });

    it('should not execute on Shift+Enter', async () => {
      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          chatService={mockChatService}
        />
      );

      const input = screen.getByTestId('askAiActionInput');
      fireEvent.change(input, { target: { value: 'Test question' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

      await waitFor(() => {
        expect(mockChatService.sendMessageWithWindow).not.toHaveBeenCalled();
      });
    });
  });

  describe('execution logic', () => {
    it('should send message with sendMessageWithWindow', async () => {
      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          chatService={mockChatService}
        />
      );

      const input = screen.getByTestId('askAiActionInput');
      fireEvent.change(input, { target: { value: 'What is this error?' } });

      const executeButton = screen.getByTestId('askAiActionExecuteButton');
      fireEvent.click(executeButton);

      await waitFor(() => {
        expect(mockChatService.sendMessageWithWindow).toHaveBeenCalledWith(
          'What is this error?',
          []
        );
      });
    });

    it('should send message regardless of chat window state', async () => {
      mockChatService.isWindowOpen.mockReturnValue(true);

      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          chatService={mockChatService}
        />
      );

      const input = screen.getByTestId('askAiActionInput');
      fireEvent.change(input, { target: { value: 'Follow-up question' } });

      const executeButton = screen.getByTestId('askAiActionExecuteButton');
      fireEvent.click(executeButton);

      await waitFor(() => {
        expect(mockChatService.sendMessageWithWindow).toHaveBeenCalledWith(
          'Follow-up question',
          []
        );
      });
    });

    it('should call onResult and onClose on successful execution', async () => {
      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          onResult={mockOnResult}
          chatService={mockChatService}
        />
      );

      const input = screen.getByTestId('askAiActionInput');
      fireEvent.change(input, { target: { value: 'Test question' } });

      const executeButton = screen.getByTestId('askAiActionExecuteButton');
      fireEvent.click(executeButton);

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith({
          success: true,
          data: { message: 'Question sent to AI assistant with log context' },
        });
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should trim whitespace from user input', async () => {
      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          chatService={mockChatService}
        />
      );

      const input = screen.getByTestId('askAiActionInput');
      fireEvent.change(input, { target: { value: '  Test question  ' } });

      const executeButton = screen.getByTestId('askAiActionExecuteButton');
      fireEvent.click(executeButton);

      await waitFor(() => {
        expect(mockChatService.sendMessageWithWindow).toHaveBeenCalledWith('Test question', []);
      });
    });

    it('should keep execute button disabled with whitespace-only input', () => {
      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          onResult={mockOnResult}
          chatService={mockChatService}
        />
      );

      const input = screen.getByTestId('askAiActionInput');
      fireEvent.change(input, { target: { value: '   ' } });

      const executeButton = screen.getByTestId('askAiActionExecuteButton');

      // Button should remain disabled for whitespace-only input
      expect(executeButton).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('should show loading state during execution', async () => {
      mockChatService.sendMessageWithWindow.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          chatService={mockChatService}
        />
      );

      const input = screen.getByTestId('askAiActionInput');
      fireEvent.change(input, { target: { value: 'Test question' } });

      const executeButton = screen.getByTestId('askAiActionExecuteButton');
      fireEvent.click(executeButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText('Sending...')).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Sending...')).not.toBeInTheDocument();
      });
    });

    it('should disable input during loading', async () => {
      mockChatService.sendMessageWithWindow.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          chatService={mockChatService}
        />
      );

      const input = screen.getByTestId('askAiActionInput');
      fireEvent.change(input, { target: { value: 'Test question' } });

      const executeButton = screen.getByTestId('askAiActionExecuteButton');
      fireEvent.click(executeButton);

      // Check input is disabled during loading
      await waitFor(() => {
        expect(input).toBeDisabled();
      });

      // Wait for completion
      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });
    });
  });

  describe('error handling', () => {
    it('should handle error from chatService', async () => {
      const error = new Error('Network error');
      mockChatService.sendMessageWithWindow.mockRejectedValue(error);

      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          onResult={mockOnResult}
          chatService={mockChatService}
        />
      );

      const input = screen.getByTestId('askAiActionInput');
      fireEvent.change(input, { target: { value: 'Test question' } });

      const executeButton = screen.getByTestId('askAiActionExecuteButton');
      fireEvent.click(executeButton);

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith({
          success: false,
          error: 'Failed to send message to AI: Network error',
        });
      });
    });

    it('should handle unknown error types', async () => {
      mockChatService.sendMessageWithWindow.mockRejectedValue('Unknown error');

      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          onResult={mockOnResult}
          chatService={mockChatService}
        />
      );

      const input = screen.getByTestId('askAiActionInput');
      fireEvent.change(input, { target: { value: 'Test question' } });

      const executeButton = screen.getByTestId('askAiActionExecuteButton');
      fireEvent.click(executeButton);

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith({
          success: false,
          error: 'Failed to send message to AI: Unknown error',
        });
      });
    });
  });

  describe('cancel button', () => {
    it('should call onClose when cancel is clicked', () => {
      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          chatService={mockChatService}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should disable cancel button during loading', async () => {
      mockChatService.sendMessageWithWindow.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <AskAIActionItem
          context={mockContext}
          action={{} as any}
          onClose={mockOnClose}
          chatService={mockChatService}
        />
      );

      const input = screen.getByTestId('askAiActionInput');
      fireEvent.change(input, { target: { value: 'Test question' } });

      const executeButton = screen.getByTestId('askAiActionExecuteButton');
      fireEvent.click(executeButton);

      // Find the cancel button element (not just the text)
      const cancelButton = screen.getByText('Cancel').closest('button');
      await waitFor(() => {
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  describe('context data', () => {
    it('should handle context with document ID', () => {
      const contextWithId = {
        ...mockContext,
        document: { _id: 'doc-123', message: 'test' },
        metadata: { index: 5 },
      };

      render(
        <AskAIActionItem
          context={contextWithId}
          action={{} as any}
          onClose={mockOnClose}
          chatService={mockChatService}
        />
      );

      expect(
        screen.getByPlaceholderText('Ask a question about this log entry...')
      ).toBeInTheDocument();
    });

    it('should handle context without document ID', () => {
      const contextWithoutId = {
        ...mockContext,
        document: { message: 'test' },
      };

      render(
        <AskAIActionItem
          context={contextWithoutId}
          action={{} as any}
          onClose={mockOnClose}
          chatService={mockChatService}
        />
      );

      expect(
        screen.getByPlaceholderText('Ask a question about this log entry...')
      ).toBeInTheDocument();
    });
  });
});

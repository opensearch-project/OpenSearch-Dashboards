/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatSuggestions } from './chat_suggestions';
import { useChatContext } from '../contexts/chat_context';
import { Message } from '../../common/types';

// Mock the chat context hook
jest.mock('../contexts/chat_context');

describe('ChatSuggestions', () => {
  let mockSuggestedActionsService: any;
  let mockChatService: any;
  let mockMessages: Message[];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock messages
    mockMessages = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
      },
    ] as Message[];

    // Setup mock services
    mockChatService = {
      getThreadId: jest.fn().mockReturnValue('thread-123'),
    };

    mockSuggestedActionsService = {
      getCustomSuggestions: jest.fn(),
    };

    // Setup mock context
    (useChatContext as jest.Mock).mockReturnValue({
      chatService: mockChatService,
      suggestedActionsService: mockSuggestedActionsService,
    });
  });

  it('should render suggestions when custom suggestions are available', async () => {
    const mockSuggestions = [
      {
        actionType: 'customize',
        message: 'Try this action',
        action: jest.fn(),
      },
      {
        actionType: 'default',
        message: 'Another suggestion',
        action: jest.fn(),
      },
    ];

    mockSuggestedActionsService.getCustomSuggestions.mockResolvedValue(mockSuggestions);

    render(<ChatSuggestions messages={mockMessages} />);

    // Wait for suggestions to load
    await waitFor(() => {
      expect(screen.getByText('Available suggestions')).toBeInTheDocument();
    });

    // Check that both suggestions are rendered
    expect(screen.getByText('Try this action')).toBeInTheDocument();
    expect(screen.getByText('Another suggestion')).toBeInTheDocument();
  });

  it('should not render anything when loading suggestions', () => {
    // Mock a promise that never resolves to simulate loading state
    mockSuggestedActionsService.getCustomSuggestions.mockReturnValue(new Promise(() => {}));

    const { container } = render(<ChatSuggestions messages={mockMessages} />);

    // Component should render nothing while loading
    expect(container.firstChild).toBeNull();
  });

  it('should not render anything when no custom suggestions are available', async () => {
    mockSuggestedActionsService.getCustomSuggestions.mockResolvedValue([]);

    const { container } = render(<ChatSuggestions messages={mockMessages} />);

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(mockSuggestedActionsService.getCustomSuggestions).toHaveBeenCalled();
    });

    // Component should render nothing when there are no suggestions
    expect(container.firstChild).toBeNull();
  });

  it('should handle errors gracefully when loading suggestions fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSuggestedActionsService.getCustomSuggestions.mockRejectedValue(
      new Error('Failed to load suggestions')
    );

    const { container } = render(<ChatSuggestions messages={mockMessages} />);

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading custom suggestions:',
        expect.any(Error)
      );
    });

    // Component should render nothing after error
    expect(container.firstChild).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  it('should call getCustomSuggestions with correct context', async () => {
    mockSuggestedActionsService.getCustomSuggestions.mockResolvedValue([]);

    render(<ChatSuggestions messages={mockMessages} />);

    await waitFor(() => {
      expect(mockSuggestedActionsService.getCustomSuggestions).toHaveBeenCalledWith({
        conversationId: 'thread-123',
        currentMessage: mockMessages[mockMessages.length - 1],
        messageHistory: mockMessages,
      });
    });
  });

  it('should invoke action callback when suggestion is clicked', async () => {
    const mockAction = jest.fn().mockResolvedValue(true);
    const mockSuggestions = [
      {
        actionType: 'default',
        message: 'Click me',
        action: mockAction,
      },
    ];

    mockSuggestedActionsService.getCustomSuggestions.mockResolvedValue(mockSuggestions);

    render(<ChatSuggestions messages={mockMessages} />);

    // Wait for suggestions to load
    await waitFor(() => {
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    // Click the suggestion
    const suggestionBubble = screen.getByText('Click me');
    await userEvent.click(suggestionBubble);

    // Verify action was called
    expect(mockAction).toHaveBeenCalled();
  });

  it('should render custom suggestions with different styling', async () => {
    const mockSuggestions = [
      {
        actionType: 'customize',
        message: 'Custom suggestion',
        action: jest.fn(),
      },
    ];

    mockSuggestedActionsService.getCustomSuggestions.mockResolvedValue(mockSuggestions);

    render(<ChatSuggestions messages={mockMessages} />);

    await waitFor(() => {
      expect(screen.getByText('Custom suggestion')).toBeInTheDocument();
    });

    // Check that the custom suggestion bubble has the correct data-test-subj
    const customBubble = screen.getByTestId('custom-suggestion-bubble');
    expect(customBubble).toBeInTheDocument();
    expect(customBubble).toHaveClass('chat-suggestion-bubble-panel--custom');
  });

  it('should render default suggestions with standard styling', async () => {
    const mockSuggestions = [
      {
        actionType: 'default',
        message: 'Default suggestion',
        action: jest.fn(),
      },
    ];

    mockSuggestedActionsService.getCustomSuggestions.mockResolvedValue(mockSuggestions);

    render(<ChatSuggestions messages={mockMessages} />);

    await waitFor(() => {
      expect(screen.getByText('Default suggestion')).toBeInTheDocument();
    });

    // Check that the default suggestion bubble has the correct data-test-subj
    const defaultBubble = screen.getByTestId('default-suggestion-bubble');
    expect(defaultBubble).toBeInTheDocument();
    expect(defaultBubble).toHaveClass('chat-suggestion-bubble-panel--default');
  });
});

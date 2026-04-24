/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecentSessions } from './recent_sessions';
import {
  ConversationHistoryService,
  SavedConversation,
} from '../services/conversation_history_service';

describe('RecentSessions', () => {
  const mockConversations: SavedConversation[] = [
    {
      id: '1',
      threadId: 'thread-1',
      name: 'First conversation',
      messages: [],
      createdAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
      updatedAt: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    },
    {
      id: '2',
      threadId: 'thread-2',
      name: 'Second conversation',
      messages: [],
      createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
      updatedAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    },
    {
      id: '3',
      threadId: 'thread-3',
      name: 'Third conversation',
      messages: [],
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
      updatedAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    },
  ];

  const mockConversationHistoryService = ({
    getConversations: jest.fn().mockResolvedValue({
      conversations: mockConversations,
      hasMore: false,
      total: 3,
    }),
  } as unknown) as ConversationHistoryService;

  const mockOnSelectConversation = jest.fn();
  const mockOnViewAll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state with EuiLoadingContent', async () => {
    const slowService = ({
      getConversations: jest.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  conversations: mockConversations,
                  hasMore: false,
                  total: 3,
                }),
              100
            )
          )
      ),
    } as unknown) as ConversationHistoryService;

    render(
      <RecentSessions
        conversationHistoryService={slowService}
        onSelectConversation={mockOnSelectConversation}
        onViewAll={mockOnViewAll}
      />
    );

    // Initially should show loading with title and loading content
    expect(screen.getByText('RECENT')).toBeInTheDocument();
    expect(document.querySelector('.euiLoadingContent')).toBeInTheDocument();

    // Wait for conversations to load
    await waitFor(() => {
      expect(screen.getByText('First conversation')).toBeInTheDocument();
      expect(document.querySelector('.euiLoadingContent')).not.toBeInTheDocument();
    });
  });

  it('should render conversation list after loading', async () => {
    render(
      <RecentSessions
        conversationHistoryService={mockConversationHistoryService}
        onSelectConversation={mockOnSelectConversation}
        onViewAll={mockOnViewAll}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('First conversation')).toBeInTheDocument();
      expect(screen.getByText('Second conversation')).toBeInTheDocument();
      expect(screen.getByText('Third conversation')).toBeInTheDocument();
    });

    expect(screen.getByText('View all')).toBeInTheDocument();
  });

  it('should call onSelectConversation when clicking a conversation', async () => {
    render(
      <RecentSessions
        conversationHistoryService={mockConversationHistoryService}
        onSelectConversation={mockOnSelectConversation}
        onViewAll={mockOnViewAll}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('First conversation')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('First conversation'));

    expect(mockOnSelectConversation).toHaveBeenCalledWith(mockConversations[0]);
  });

  it('should call onViewAll when clicking View all button', async () => {
    render(
      <RecentSessions
        conversationHistoryService={mockConversationHistoryService}
        onSelectConversation={mockOnSelectConversation}
        onViewAll={mockOnViewAll}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('View all')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('View all'));

    expect(mockOnViewAll).toHaveBeenCalled();
  });

  it('should not render when conversations list is empty', async () => {
    const emptyService = ({
      getConversations: jest.fn().mockResolvedValue({
        conversations: [],
        hasMore: false,
        total: 0,
      }),
    } as unknown) as ConversationHistoryService;

    const { container } = render(
      <RecentSessions
        conversationHistoryService={emptyService}
        onSelectConversation={mockOnSelectConversation}
        onViewAll={mockOnViewAll}
      />
    );

    await waitFor(() => {
      expect(emptyService.getConversations).toHaveBeenCalled();
    });

    expect(container.firstChild).toBeNull();
  });

  it('should not render when there is an error', async () => {
    const errorService = ({
      getConversations: jest.fn().mockRejectedValue(new Error('Failed to load')),
    } as unknown) as ConversationHistoryService;

    const { container } = render(
      <RecentSessions
        conversationHistoryService={errorService}
        onSelectConversation={mockOnSelectConversation}
        onViewAll={mockOnViewAll}
      />
    );

    await waitFor(() => {
      expect(errorService.getConversations).toHaveBeenCalled();
    });

    expect(container.firstChild).toBeNull();
  });

  it('should display relative time correctly using moment.fromNow()', async () => {
    render(
      <RecentSessions
        conversationHistoryService={mockConversationHistoryService}
        onSelectConversation={mockOnSelectConversation}
        onViewAll={mockOnViewAll}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('First conversation')).toBeInTheDocument();
    });

    // moment.fromNow() returns formats like "30 minutes ago", "2 hours ago", "a day ago"
    // Just verify that relative time text is present for at least one conversation
    const allText = screen.getByText('First conversation').closest('.recentSessions__item')
      ?.textContent;
    expect(allText).toContain('ago');
  });

  it('should apply ellipsis styles to long conversation titles', async () => {
    const longTitleConversations = [
      {
        id: '1',
        threadId: 'thread-1',
        name: 'This is a very long conversation title that should be truncated with ellipsis',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const serviceWithLongTitle = ({
      getConversations: jest.fn().mockResolvedValue({
        conversations: longTitleConversations,
        hasMore: false,
        total: 1,
      }),
    } as unknown) as ConversationHistoryService;

    render(
      <RecentSessions
        conversationHistoryService={serviceWithLongTitle}
        onSelectConversation={mockOnSelectConversation}
        onViewAll={mockOnViewAll}
      />
    );

    await waitFor(() => {
      const titleElement = screen.getByText(longTitleConversations[0].name);
      expect(titleElement).toBeInTheDocument();

      // Check that the parent has the ellipsis class
      const itemTitle = titleElement.closest('.recentSessions__itemTitle');
      expect(itemTitle).toBeInTheDocument();
    });
  });

  it('should hide date display for conversations with invalid timestamps', async () => {
    const conversationsWithInvalid = [
      {
        id: '1',
        threadId: 'thread-1',
        name: 'Valid conversation',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      },
      {
        id: '2',
        threadId: 'thread-2',
        name: 'Invalid timestamp conversation',
        messages: [],
        createdAt: Date.now(),
        updatedAt: NaN, // Invalid timestamp
      },
    ];

    const serviceWithInvalidTimestamp = ({
      getConversations: jest.fn().mockResolvedValue({
        conversations: conversationsWithInvalid,
        hasMore: false,
        total: 2,
      }),
    } as unknown) as ConversationHistoryService;

    render(
      <RecentSessions
        conversationHistoryService={serviceWithInvalidTimestamp}
        onSelectConversation={mockOnSelectConversation}
        onViewAll={mockOnViewAll}
      />
    );

    await waitFor(() => {
      // Both conversations should be displayed
      expect(screen.getByText('Valid conversation')).toBeInTheDocument();
      expect(screen.getByText('Invalid timestamp conversation')).toBeInTheDocument();
    });

    // Valid conversation should have a date
    const validConv = screen.getByText('Valid conversation').closest('.recentSessions__item');
    expect(validConv?.textContent).toContain('ago');

    // Invalid timestamp conversation should not have a date
    const invalidConv = screen
      .getByText('Invalid timestamp conversation')
      .closest('.recentSessions__item');
    expect(invalidConv?.textContent).toBe('Invalid timestamp conversation');
  });

  it('should not update state after component unmounts', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const delayedService = ({
      getConversations: jest.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  conversations: mockConversations,
                  hasMore: false,
                  total: 3,
                }),
              50
            )
          )
      ),
    } as unknown) as ConversationHistoryService;

    const { unmount } = render(
      <RecentSessions
        conversationHistoryService={delayedService}
        onSelectConversation={mockOnSelectConversation}
        onViewAll={mockOnViewAll}
      />
    );

    // Unmount before the async call completes
    unmount();

    // Wait for the async call to complete
    await waitFor(
      () => {
        expect(delayedService.getConversations).toHaveBeenCalled();
      },
      { timeout: 100 }
    );

    // No React state update warnings should be logged
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("Can't perform a React state update on an unmounted component")
    );

    consoleError.mockRestore();
  });
});

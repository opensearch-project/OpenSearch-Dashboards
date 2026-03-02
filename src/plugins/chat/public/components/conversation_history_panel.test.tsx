/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConversationHistoryPanel } from './conversation_history_panel';
import {
  ConversationHistoryService,
  SavedConversation,
} from '../services/conversation_history_service';
import { AgenticMemoryProvider } from '../services/agentic_memory_provider';

describe('ConversationHistoryPanel', () => {
  let mockService: jest.Mocked<ConversationHistoryService>;
  let mockOnSelectConversation: jest.Mock;

  const createMockConversations = (count: number, startIndex: number = 0): SavedConversation[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `conv-${startIndex + i}`,
      threadId: `thread-${startIndex + i}`,
      name: `Conversation ${startIndex + i}`,
      messages: [],
      createdAt: Date.now() - (startIndex + i) * 1000,
      updatedAt: Date.now() - (startIndex + i) * 1000,
    }));
  };

  beforeEach(() => {
    // Default mock provider (non-AgenticMemoryProvider)
    const mockDefaultProvider = {
      includeFullHistory: true,
      saveConversation: jest.fn(),
      getConversations: jest.fn(),
      getConversation: jest.fn(),
      deleteConversation: jest.fn().mockResolvedValue(undefined),
    };

    mockService = {
      getConversations: jest.fn(),
      deleteConversation: jest.fn(),
      getConversation: jest.fn(),
      saveConversation: jest.fn(),
      getMemoryProvider: jest.fn().mockReturnValue(mockDefaultProvider),
    } as any;

    mockOnSelectConversation = jest.fn();
  });

  describe('Initial loading state', () => {
    it('should show loading spinner when fetching initial conversations', async () => {
      mockService.getConversations.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <ConversationHistoryPanel
          conversationHistoryService={mockService}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      expect(screen.getByText('Loading conversations...')).toBeInTheDocument();
    });

    it('should display conversations after loading', async () => {
      const mockConversations = createMockConversations(3);
      mockService.getConversations.mockResolvedValue({
        conversations: mockConversations,
        hasMore: false,
        total: 1,
      });

      render(
        <ConversationHistoryPanel
          conversationHistoryService={mockService}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Conversation 0')).toBeInTheDocument();
        expect(screen.getByText('Conversation 1')).toBeInTheDocument();
        expect(screen.getByText('Conversation 2')).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no conversations exist', async () => {
      mockService.getConversations.mockResolvedValue({
        conversations: [],
        hasMore: false,
        total: 1,
      });

      render(
        <ConversationHistoryPanel
          conversationHistoryService={mockService}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No conversation history')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should show error state when initial load fails', async () => {
      mockService.getConversations.mockRejectedValue(new Error('Network error'));

      render(
        <ConversationHistoryPanel
          conversationHistoryService={mockService}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Unable to load conversations')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should retry loading when retry button is clicked', async () => {
      mockService.getConversations.mockRejectedValueOnce(new Error('Network error'));

      render(
        <ConversationHistoryPanel
          conversationHistoryService={mockService}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Unable to load conversations')).toBeInTheDocument();
      });

      const mockConversations = createMockConversations(2);
      mockService.getConversations.mockResolvedValue({
        conversations: mockConversations,
        hasMore: false,
        total: 1,
      });

      const retryButton = screen.getByText('Try again');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Conversation 0')).toBeInTheDocument();
      });
    });

    it('should show pagination error when loading more fails', async () => {
      const firstPage = createMockConversations(20);
      mockService.getConversations.mockResolvedValueOnce({
        conversations: firstPage,
        hasMore: true,
        total: 1,
      });

      const { container } = render(
        <ConversationHistoryPanel
          conversationHistoryService={mockService}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Conversation 0')).toBeInTheDocument();
      });

      // Mock pagination error
      mockService.getConversations.mockRejectedValueOnce(new Error('Pagination error'));

      // Trigger scroll to bottom
      const contentDiv = container.querySelector('.conversationHistoryPanel__content');
      if (contentDiv) {
        Object.defineProperty(contentDiv, 'scrollTop', { value: 1000, writable: true });
        Object.defineProperty(contentDiv, 'scrollHeight', { value: 1500, writable: true });
        Object.defineProperty(contentDiv, 'clientHeight', { value: 500, writable: true });
        fireEvent.scroll(contentDiv);
      }

      await waitFor(() => {
        expect(screen.getByText('Failed to load more conversations')).toBeInTheDocument();
      });
    });
  });

  describe('Conversation grouping', () => {
    it('should group conversations by date', async () => {
      const now = Date.now();
      const recentConv: SavedConversation = {
        id: 'conv-recent',
        threadId: 'thread-recent',
        name: 'Recent Conversation',
        messages: [],
        createdAt: now,
        updatedAt: now,
      };

      const oldConv: SavedConversation = {
        id: 'conv-old',
        threadId: 'thread-old',
        name: 'Old Conversation',
        messages: [],
        createdAt: now - 8 * 24 * 60 * 60 * 1000, // 8 days ago
        updatedAt: now - 8 * 24 * 60 * 60 * 1000,
      };

      mockService.getConversations.mockResolvedValue({
        conversations: [recentConv, oldConv],
        hasMore: false,
        total: 1,
      });

      render(
        <ConversationHistoryPanel
          conversationHistoryService={mockService}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Last 7 days')).toBeInTheDocument();
        expect(screen.getByText('Older')).toBeInTheDocument();
      });
    });
  });

  describe('Conversation selection', () => {
    it('should call onSelectConversation when conversation is clicked', async () => {
      const mockConversations = createMockConversations(2);
      mockService.getConversations.mockResolvedValue({
        conversations: mockConversations,
        hasMore: false,
        total: 1,
      });

      render(
        <ConversationHistoryPanel
          conversationHistoryService={mockService}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Conversation 0')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('Conversation 0');
      fireEvent.click(conversationItem);

      expect(mockOnSelectConversation).toHaveBeenCalledWith(mockConversations[0]);
    });
  });

  describe('Conversation deletion', () => {
    it('should delete conversation and reload list', async () => {
      const mockConversations = createMockConversations(2);
      mockService.getConversations.mockResolvedValue({
        conversations: mockConversations,
        hasMore: false,
        total: 1,
      });
      mockService.deleteConversation.mockResolvedValue();

      render(
        <ConversationHistoryPanel
          conversationHistoryService={mockService}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Conversation 0')).toBeInTheDocument();
      });

      // Find and click the actions button (this depends on implementation)
      const actionButtons = screen.getAllByLabelText('Actions');
      fireEvent.click(actionButtons[0]);

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockService.deleteConversation).toHaveBeenCalledWith('thread-0');
      });
    });

    it('should not show delete action when using AgenticMemoryProvider', async () => {
      const mockConversations = createMockConversations(2);
      mockService.getConversations.mockResolvedValue({
        conversations: mockConversations,
        hasMore: false,
        total: 1,
      });

      // Create a real AgenticMemoryProvider instance with mocked http
      const mockHttp = {
        post: jest.fn(),
      } as any;
      const agenticProvider = new AgenticMemoryProvider(mockHttp);
      mockService.getMemoryProvider = jest.fn().mockReturnValue(agenticProvider);

      render(
        <ConversationHistoryPanel
          conversationHistoryService={mockService}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Conversation 0')).toBeInTheDocument();
      });

      // Verify that action buttons (delete) are not present when using agentic memory
      const actionButtons = screen.queryAllByLabelText('Actions');
      expect(actionButtons).toHaveLength(0);
    });
  });

  describe('Pagination', () => {
    it('should load more conversations on scroll', async () => {
      const firstPage = createMockConversations(20, 0);
      const secondPage = createMockConversations(10, 20);

      mockService.getConversations
        .mockResolvedValueOnce({
          conversations: firstPage,
          hasMore: true,
          total: 1,
        })
        .mockResolvedValueOnce({
          conversations: secondPage,
          hasMore: false,
          total: 1,
        });

      const { container } = render(
        <ConversationHistoryPanel
          conversationHistoryService={mockService}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Conversation 0')).toBeInTheDocument();
      });

      // Trigger scroll to bottom
      const contentDiv = container.querySelector('.conversationHistoryPanel__content');
      if (contentDiv) {
        Object.defineProperty(contentDiv, 'scrollTop', { value: 1000, writable: true });
        Object.defineProperty(contentDiv, 'scrollHeight', { value: 1500, writable: true });
        Object.defineProperty(contentDiv, 'clientHeight', { value: 500, writable: true });
        fireEvent.scroll(contentDiv);
      }

      await waitFor(() => {
        expect(screen.getByText('Conversation 20')).toBeInTheDocument();
      });

      expect(mockService.getConversations).toHaveBeenCalledTimes(2);
      expect(mockService.getConversations).toHaveBeenNthCalledWith(2, {
        page: 1,
        pageSize: 20,
      });
    });

    it('should show loading spinner while loading more', async () => {
      const firstPage = createMockConversations(20);
      mockService.getConversations.mockResolvedValueOnce({
        conversations: firstPage,
        hasMore: true,
        total: 1,
      });

      const { container } = render(
        <ConversationHistoryPanel
          conversationHistoryService={mockService}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Conversation 0')).toBeInTheDocument();
      });

      // Mock slow second page load
      mockService.getConversations.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      // Trigger scroll
      const contentDiv = container.querySelector('.conversationHistoryPanel__content');
      if (contentDiv) {
        Object.defineProperty(contentDiv, 'scrollTop', { value: 1000, writable: true });
        Object.defineProperty(contentDiv, 'scrollHeight', { value: 1500, writable: true });
        Object.defineProperty(contentDiv, 'clientHeight', { value: 500, writable: true });
        fireEvent.scroll(contentDiv);
      }

      // Should show loading spinner while loading next page
      const loadingSpinners = container.querySelectorAll('.euiLoadingSpinner');
      expect(loadingSpinners.length).toBeGreaterThan(0);
    });

    it('should not trigger pagination when hasMore is false', async () => {
      const conversations = createMockConversations(5);
      mockService.getConversations.mockResolvedValue({
        conversations,
        hasMore: false,
        total: 1,
      });

      const { container } = render(
        <ConversationHistoryPanel
          conversationHistoryService={mockService}
          onSelectConversation={mockOnSelectConversation}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Conversation 0')).toBeInTheDocument();
      });

      // Trigger scroll
      const contentDiv = container.querySelector('.conversationHistoryPanel__content');
      if (contentDiv) {
        Object.defineProperty(contentDiv, 'scrollTop', { value: 1000, writable: true });
        Object.defineProperty(contentDiv, 'scrollHeight', { value: 1500, writable: true });
        Object.defineProperty(contentDiv, 'clientHeight', { value: 500, writable: true });
        fireEvent.scroll(contentDiv);
      }

      // Wait a bit to ensure no additional calls
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should only be called once (initial load)
      expect(mockService.getConversations).toHaveBeenCalledTimes(1);
    });
  });
});

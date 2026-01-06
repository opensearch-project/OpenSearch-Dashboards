/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AskAIEmbeddableAction } from './ask_ai_embeddable_action';
import { ExploreEmbeddable } from '../embeddable/explore_embeddable';
import html2canvas from 'html2canvas';

// Mock html2canvas
jest.mock('html2canvas');

// Mock the loading overlay component
jest.mock('./ask_ai_embeddable_action', () => {
  const actual = jest.requireActual('./ask_ai_embeddable_action');
  return {
    ...actual,
    LoadingOverlay: ({ onClose }: { onClose: () => void }) => (
      <div data-test-subj="loading-overlay">
        <button onClick={onClose}>Close</button>
      </div>
    ),
  };
});

describe('AskAIEmbeddableAction', () => {
  let action: AskAIEmbeddableAction;
  let mockCore: any;
  let mockContextProvider: any;
  let mockChat: any;
  let mockEmbeddable: any;

  beforeEach(() => {
    // Mock core
    mockCore = {
      http: {
        post: jest.fn(),
      },
      notifications: {
        toasts: {
          addSuccess: jest.fn(),
          addError: jest.fn(),
        },
      },
    };

    // Mock context provider
    mockContextProvider = {
      getAssistantContextStore: jest.fn().mockReturnValue({
        addContext: jest.fn().mockResolvedValue(undefined),
      }),
    };

    // Mock chat
    mockChat = {
      chatService: {
        updateCurrentMessages: jest.fn(),
        sendMessageWithWindow: jest.fn().mockResolvedValue(undefined),
        openWindow: jest.fn().mockResolvedValue(undefined),
      },
    };

    // Mock embeddable
    mockEmbeddable = ({
      id: 'test-embeddable-id',
      getTitle: jest.fn().mockReturnValue('Test Visualization'),
      type: 'explore',
      getInput: jest.fn().mockReturnValue({
        savedObjectId: 'test-saved-object-id',
        timeRange: { from: 'now-15m', to: 'now' },
        filters: [],
      }),
      savedExplore: {
        searchSource: {
          getFields: jest.fn().mockReturnValue({
            query: {
              query: 'test query',
              dataset: {
                title: 'test-index',
                dataSource: {
                  id: undefined,
                },
              },
            },
          }),
        },
      },
      node: document.createElement('div'),
    } as unknown) as ExploreEmbeddable;

    // Create action instance
    action = new AskAIEmbeddableAction(mockCore, mockContextProvider, mockChat);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDisplayName', () => {
    it('should return correct display name', () => {
      expect(action.getDisplayName()).toBe('Ask AI');
    });
  });

  describe('getIconType', () => {
    it('should return correct icon type', () => {
      expect(action.getIconType()).toBe('editorComment');
    });
  });

  describe('isCompatible', () => {
    it('should return true for ExploreEmbeddable', async () => {
      const result = await action.isCompatible({ embeddable: mockEmbeddable });
      expect(result).toBe(true);
    });

    it('should return false for non-ExploreEmbeddable', async () => {
      const nonExploreEmbeddable = {
        type: 'other_type',
        getInput: jest.fn(),
      };
      const result = await action.isCompatible({ embeddable: nonExploreEmbeddable as any });
      expect(result).toBe(false);
    });

    it('should return false when context provider is not available', async () => {
      const actionWithoutContext = new AskAIEmbeddableAction(mockCore, undefined, mockChat);
      const result = await actionWithoutContext.isCompatible({ embeddable: mockEmbeddable });
      expect(result).toBe(false);
    });
  });

  describe('execute', () => {
    beforeEach(() => {
      // Mock DOM element
      const mockElement = document.createElement('div');
      mockElement.className = 'embPanel__content';
      document.body.appendChild(mockElement);

      // Mock html2canvas
      (html2canvas as jest.Mock).mockResolvedValue({
        toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mockImageData'),
      });

      // Mock successful API response
      mockCore.http.post.mockResolvedValue({
        summary: 'This is a test summary of the visualization',
      });
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should capture visualization and send to API', async () => {
      await action.execute({ embeddable: mockEmbeddable });

      await waitFor(() => {
        expect(html2canvas).toHaveBeenCalled();
        expect(mockCore.http.post).toHaveBeenCalledWith(
          '/api/visualizations/summary',
          expect.objectContaining({
            body: JSON.stringify({
              visualization: 'mockImageData',
            }),
          })
        );
      });
    });

    it('should add context to context provider', async () => {
      await action.execute({ embeddable: mockEmbeddable });

      await waitFor(() => {
        expect(mockContextProvider.getAssistantContextStore).toHaveBeenCalled();
        expect(mockContextProvider.getAssistantContextStore().addContext).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.stringContaining('visualization-'),
            description: expect.stringContaining('Test Visualization'),
            categories: ['visualization', 'dashboard', 'chat'],
          })
        );
      });
    });

    it('should open chat window', async () => {
      await action.execute({ embeddable: mockEmbeddable });

      await waitFor(() => {
        expect(mockChat.chatService.sendMessageWithWindow).toHaveBeenCalled();
        expect(mockChat.chatService.openWindow).toHaveBeenCalled();
      });
    });

    it('should handle errors gracefully', async () => {
      mockCore.http.post.mockRejectedValue(new Error('API Error'));

      await action.execute({ embeddable: mockEmbeddable });

      // Should still try to add context even if API fails
      await waitFor(() => {
        expect(mockContextProvider.getAssistantContextStore).toHaveBeenCalled();
      });
    });

    it('should include dataSourceId in API call when available', async () => {
      const embeddableWithDataSource = ({
        ...mockEmbeddable,
        savedExplore: {
          searchSource: {
            getFields: jest.fn().mockReturnValue({
              query: {
                query: 'test query',
                dataset: {
                  title: 'test-index',
                  dataSource: {
                    id: 'ds-123',
                  },
                },
              },
            }),
          },
        },
      } as unknown) as ExploreEmbeddable;

      await action.execute({ embeddable: embeddableWithDataSource });

      await waitFor(() => {
        expect(mockCore.http.post).toHaveBeenCalledWith(
          '/api/visualizations/summary',
          expect.objectContaining({
            query: {
              dataSourceId: 'ds-123',
            },
          })
        );
      });
    });
  });
});

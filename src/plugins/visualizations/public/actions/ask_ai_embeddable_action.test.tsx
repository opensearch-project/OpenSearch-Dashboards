/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { waitFor } from '@testing-library/react';
import { AskAIVisualizeEmbeddableAction } from './ask_ai_embeddable_action';
import { VisualizeEmbeddable } from '../embeddable/visualize_embeddable';
import html2canvas from 'html2canvas-pro';

// Mock html2canvas
jest.mock('html2canvas-pro');

describe('AskAIVisualizeEmbeddableAction', () => {
  let action: AskAIVisualizeEmbeddableAction;
  let mockCore: any;
  let mockContextProvider: any;
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
          addDanger: jest.fn(),
        },
      },
      chat: {
        isAvailable: () => true,
        sendMessageWithWindow: jest.fn().mockResolvedValue(undefined),
      },
    };

    // Mock context provider
    mockContextProvider = {
      getAssistantContextStore: jest.fn().mockReturnValue({
        addContext: jest.fn().mockResolvedValue(undefined),
      }),
    };

    // Mock embeddable
    mockEmbeddable = ({
      id: 'test-embeddable-id',
      getTitle: jest.fn().mockReturnValue('Test Visualization'),
      type: 'visualization',
      getInput: jest.fn().mockReturnValue({
        savedObjectId: 'test-saved-object-id',
        timeRange: { from: 'now-15m', to: 'now' },
        filters: [],
      }),
      vis: {
        type: {
          name: 'line',
        },
        data: {
          searchSource: {
            getField: jest.fn().mockReturnValue({
              query: 'test query',
            }),
          },
          indexPattern: {
            title: 'test-index',
          },
        },
      },
      domNode: document.createElement('div'),
    } as unknown) as VisualizeEmbeddable;

    // Create action instance
    action = new AskAIVisualizeEmbeddableAction(mockCore, mockContextProvider);
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
    it('should return true for VisualizeEmbeddable', async () => {
      const result = await action.isCompatible({ embeddable: mockEmbeddable });
      expect(result).toBe(true);
    });

    it('should return false for non-VisualizeEmbeddable', async () => {
      const nonVisualizeEmbeddable = {
        type: 'other_type',
        getInput: jest.fn(),
      };
      const result = await action.isCompatible({ embeddable: nonVisualizeEmbeddable as any });
      expect(result).toBe(false);
    });

    it('should return false when context provider is not available', async () => {
      const actionWithoutContext = new AskAIVisualizeEmbeddableAction(mockCore, undefined);
      const result = await actionWithoutContext.isCompatible({ embeddable: mockEmbeddable });
      expect(result).toBe(false);
    });

    it('should return false when chat is not available', async () => {
      const actionWithoutContext = new AskAIVisualizeEmbeddableAction(
        {
          ...mockCore,
          chat: {
            isAvailable: () => false,
          },
        },
        undefined
      );
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
      const html2canvasMock = html2canvas as jest.MockedFunction<typeof html2canvas>;
      html2canvasMock.mockResolvedValue({
        toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mockImageData'),
      } as any);

      // Mock successful API response
      mockCore.http.post.mockResolvedValue({
        summary: 'This is a test summary of the visualization',
      });
    });

    afterEach(() => {
      document.body.innerHTML = '';
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

    it('should call sendMessageWithWindow', async () => {
      await action.execute({ embeddable: mockEmbeddable });

      await waitFor(() => {
        expect(mockCore.chat.sendMessageWithWindow).toHaveBeenCalled();
      });
    });
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AskAIAction, ACTION_ASK_AI } from './ask_ai_action';
import { coreMock } from '../../../../core/public/mocks';
import { IEmbeddable } from '../../../embeddable/public';

describe('AskAIAction', () => {
  let action: AskAIAction;
  let mockCore: ReturnType<typeof coreMock.createStart>;
  let mockEmbeddable: jest.Mocked<IEmbeddable>;
  let mockChatService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCore = coreMock.createStart();

    mockChatService = {
      isAvailable: jest.fn(() => true),
      openWindow: jest.fn(() => Promise.resolve()),
      setPendingImage: jest.fn(),
      setCapturingImage: jest.fn(),
    };

    mockCore.chat = mockChatService;

    mockEmbeddable = {
      id: 'test-embeddable-id',
      type: 'visualization',
      getTitle: jest.fn(() => 'Test Visualization'),
      getInput: jest.fn(),
      getOutput: jest.fn(),
      reload: jest.fn(),
      destroy: jest.fn(),
      updateInput: jest.fn(),
      render: jest.fn(),
      isContainer: false,
    } as any;

    action = new AskAIAction(mockCore);
  });

  describe('basic properties', () => {
    it('should have correct type and id', () => {
      expect(action.type).toBe(ACTION_ASK_AI);
      expect(action.id).toBe(ACTION_ASK_AI);
    });

    it('should have correct order', () => {
      expect(action.order).toBe(100);
    });

    it('should return correct display name', () => {
      const displayName = action.getDisplayName({ embeddable: mockEmbeddable });
      expect(displayName).toBe('Ask AI');
    });

    it('should return correct icon type', () => {
      const iconType = action.getIconType({ embeddable: mockEmbeddable });
      expect(iconType).toBe('discuss');
    });
  });

  describe('compatibility checks', () => {
    it('should be compatible with visualization embeddables when chat service is available', async () => {
      const isCompatible = await action.isCompatible({ embeddable: mockEmbeddable });
      expect(isCompatible).toBe(true);
    });

    it('should not be compatible when chat service is not available', async () => {
      mockChatService.isAvailable.mockReturnValue(false);

      const isCompatible = await action.isCompatible({ embeddable: mockEmbeddable });
      expect(isCompatible).toBe(false);
    });

    it('should not be compatible with error embeddables', async () => {
      const errorEmbeddable = {
        ...mockEmbeddable,
        error: new Error('Test error'),
      } as any;

      const isCompatible = await action.isCompatible({ embeddable: errorEmbeddable });
      expect(isCompatible).toBe(false);
    });

    it('should be compatible with various visualization types', async () => {
      const visualizationTypes = [
        'visualization',
        'lens',
        'map',
        'vega',
        'timelion',
        'input_control_vis',
        'metrics',
        'tagcloud',
        'region_map',
        'tile_map',
        'histogram',
        'line',
        'area',
        'bar',
        'pie',
        'metric',
        'table',
        'gauge',
        'goal',
        'heatmap',
      ];

      for (const type of visualizationTypes) {
        const embeddable = { ...mockEmbeddable, type };
        const isCompatible = await action.isCompatible({ embeddable });
        expect(isCompatible).toBe(true);
      }
    });

    it('should not be compatible with non-visualization types', async () => {
      const nonVisualizationEmbeddable = {
        ...mockEmbeddable,
        type: 'dashboard',
      };

      const isCompatible = await action.isCompatible({ embeddable: nonVisualizationEmbeddable });
      expect(isCompatible).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should show warning when chat service is unavailable', async () => {
      const coreWithoutChat = { ...mockCore, chat: undefined as any };
      const actionWithoutChat = new AskAIAction(coreWithoutChat);

      await actionWithoutChat.execute({ embeddable: mockEmbeddable });

      expect(coreWithoutChat.notifications.toasts.addWarning).toHaveBeenCalledWith({
        title: 'Chat service unavailable',
        text: 'The AI chat service is not available. Please check your configuration.',
      });
    });

    it('should show warning when chat service isAvailable returns false', async () => {
      mockChatService.isAvailable.mockReturnValue(false);

      await action.execute({ embeddable: mockEmbeddable });

      expect(mockCore.notifications.toasts.addWarning).toHaveBeenCalledWith({
        title: 'Chat service unavailable',
        text: 'The AI chat service is not available. Please check your configuration.',
      });
    });
  });
});

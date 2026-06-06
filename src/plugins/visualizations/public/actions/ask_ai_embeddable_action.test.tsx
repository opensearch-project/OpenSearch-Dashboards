/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
      savedObjects: {
        client: {
          get: jest.fn().mockResolvedValue({ attributes: {} }),
          find: jest.fn().mockResolvedValue({ savedObjects: [] }),
        },
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
            id: 'test-index-pattern-id',
            title: 'test-index',
          },
        },
      },
      domNode: document.createElement('div'),
    } as unknown) as VisualizeEmbeddable;

    // Create action instance
    const mockIndexPatterns = {
      getCache: jest.fn().mockResolvedValue([{ id: 'test-index-pattern-id' }]),
    } as any;
    action = new AskAIVisualizeEmbeddableAction(mockCore, mockIndexPatterns, mockContextProvider);
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

    it('should memoize the index pattern lookup for a normal visualization', async () => {
      const getCache = jest.fn().mockResolvedValue([{ id: 'test-index-pattern-id' }]);
      const memoAction = new AskAIVisualizeEmbeddableAction(
        mockCore,
        { getCache } as any,
        mockContextProvider
      );
      await memoAction.isCompatible({ embeddable: mockEmbeddable });
      await memoAction.isCompatible({ embeddable: mockEmbeddable });
      await memoAction.isCompatible({ embeddable: mockEmbeddable });
      // The index pattern classification is cached after the first lookup.
      expect(getCache).toHaveBeenCalledTimes(1);
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
      const mockIp = { getCache: jest.fn().mockResolvedValue([]) } as any;
      const actionWithoutContext = new AskAIVisualizeEmbeddableAction(mockCore, mockIp, undefined);
      const result = await actionWithoutContext.isCompatible({ embeddable: mockEmbeddable });
      expect(result).toBe(false);
    });

    it('should return false when chat is not available', async () => {
      const mockIp = { getCache: jest.fn().mockResolvedValue([]) } as any;
      const actionWithoutContext = new AskAIVisualizeEmbeddableAction(
        {
          ...mockCore,
          chat: {
            isAvailable: () => false,
          },
        },
        mockIp,
        undefined
      );
      const result = await actionWithoutContext.isCompatible({ embeddable: mockEmbeddable });
      expect(result).toBe(false);
    });

    const buildEmbeddable = (vis: any) =>
      (({ ...mockEmbeddable, vis } as unknown) as VisualizeEmbeddable);

    it('should hide for TSVB (metrics) backed by an AnalyticEngine data source', async () => {
      mockCore.savedObjects.client.get.mockResolvedValue({
        attributes: { dataSourceEngineType: 'AnalyticEngine' },
      });
      const embeddable = buildEmbeddable({
        type: { name: 'metrics' },
        params: { data_source_id: 'ae-id' },
        data: {},
      });
      const result = await action.isCompatible({ embeddable });
      expect(result).toBe(false);
      expect(mockCore.savedObjects.client.get).toHaveBeenCalledWith('data-source', 'ae-id');
    });

    it('should memoize the data source lookup across repeated isCompatible calls', async () => {
      mockCore.savedObjects.client.get.mockResolvedValue({
        attributes: { dataSourceEngineType: 'AnalyticEngine' },
      });
      const embeddable = buildEmbeddable({
        type: { name: 'metrics' },
        params: { data_source_id: 'ae-id' },
        data: {},
      });
      await action.isCompatible({ embeddable });
      await action.isCompatible({ embeddable });
      await action.isCompatible({ embeddable });
      // The engine type is cached after the first lookup, so the API is only hit once.
      expect(mockCore.savedObjects.client.get).toHaveBeenCalledTimes(1);
    });

    it('should show for TSVB (metrics) backed by a non-AnalyticEngine data source', async () => {
      mockCore.savedObjects.client.get.mockResolvedValue({
        attributes: { dataSourceEngineType: 'OpenSearch' },
      });
      const embeddable = buildEmbeddable({
        type: { name: 'metrics' },
        params: { data_source_id: 'os-id' },
        data: {},
      });
      expect(await action.isCompatible({ embeddable })).toBe(true);
    });

    it('should hide for Vega referencing an AnalyticEngine data source by name', async () => {
      mockCore.savedObjects.client.find.mockResolvedValue({
        savedObjects: [
          { attributes: { title: 'my source', dataSourceEngineType: 'AnalyticEngine' } },
        ],
      });
      const embeddable = buildEmbeddable({
        type: { name: 'vega' },
        params: { spec: JSON.stringify({ data: { url: { data_source_name: 'my source' } } }) },
        data: {},
      });
      expect(await action.isCompatible({ embeddable })).toBe(false);
    });

    it('should hide for Vega when the spec is authored in HJSON (unquoted keys)', async () => {
      mockCore.savedObjects.client.find.mockResolvedValue({
        savedObjects: [
          { attributes: { title: 'my source', dataSourceEngineType: 'AnalyticEngine' } },
        ],
      });
      // HJSON: unquoted keys and a comment, which strict JSON.parse cannot handle.
      const hjsonSpec = `{
        // an hjson spec
        data: {
          url: {
            index: my-index
            data_source_name: my source
          }
        }
      }`;
      const embeddable = buildEmbeddable({
        type: { name: 'vega' },
        params: { spec: hjsonSpec },
        data: {},
      });
      expect(await action.isCompatible({ embeddable })).toBe(false);
    });

    it('should hide for Timeline referencing an AnalyticEngine data source by name', async () => {
      mockCore.savedObjects.client.find.mockResolvedValue({
        savedObjects: [
          { attributes: { title: 'my source', dataSourceEngineType: 'AnalyticEngine' } },
        ],
      });
      const embeddable = buildEmbeddable({
        type: { name: 'timelion' },
        params: { expression: '.opensearch(index=*, data_source_name="my source")' },
        data: {},
      });
      expect(await action.isCompatible({ embeddable })).toBe(false);
    });

    it('should hide for input controls whose index pattern is AnalyticEngine-backed', async () => {
      const mockIndexPatterns = {
        // 'ae-ip' is intentionally excluded from the engine-filtered cache.
        getCache: jest.fn().mockResolvedValue([{ id: 'os-ip' }]),
      } as any;
      const controlsAction = new AskAIVisualizeEmbeddableAction(
        mockCore,
        mockIndexPatterns,
        mockContextProvider
      );
      const embeddable = buildEmbeddable({
        type: { name: 'input_control_vis' },
        params: { controls: [{ indexPattern: 'ae-ip' }] },
        data: {},
      });
      expect(await controlsAction.isCompatible({ embeddable })).toBe(false);
    });

    it('should show for input controls whose index pattern is allowed', async () => {
      const mockIndexPatterns = {
        getCache: jest.fn().mockResolvedValue([{ id: 'os-ip' }]),
      } as any;
      const controlsAction = new AskAIVisualizeEmbeddableAction(
        mockCore,
        mockIndexPatterns,
        mockContextProvider
      );
      const embeddable = buildEmbeddable({
        type: { name: 'input_control_vis' },
        params: { controls: [{ indexPattern: 'os-ip' }] },
        data: {},
      });
      expect(await controlsAction.isCompatible({ embeddable })).toBe(true);
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

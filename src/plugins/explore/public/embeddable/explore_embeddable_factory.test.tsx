/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreEmbeddableFactory } from './explore_embeddable_factory';
import { EXPLORE_EMBEDDABLE_TYPE } from './constants';
import { ErrorEmbeddable } from '../../../embeddable/public';
import { ExploreEmbeddable } from './explore_embeddable';
import * as OsdServices from '../application/legacy/discover/opensearch_dashboards_services';

jest.mock('./explore_embeddable', () => {
  return {
    ExploreEmbeddable: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

describe('ExploreEmbeddableFactory', () => {
  let factory: ExploreEmbeddableFactory;
  const mockedGetServicesResults = {
    getSavedExploreUrlById: jest.fn().mockResolvedValue('saved-explore-url'),
    getSavedExploreById: jest.fn().mockResolvedValue({
      id: 'test-id',
      title: 'Test Explore',
      description: 'Test description',
      searchSource: {
        getField: jest.fn((field) => {
          if (field === 'index') {
            return { id: 'test-index' };
          }
          if (field === 'query') {
            return { query: 'test', language: 'kuery' };
          }
          return null;
        }),
      },
      type: 'logs',
    }),
    addBasePath: jest.fn((path) => `/base${path}`),
    capabilities: {
      discover: {
        save: true,
      },
    },
    filterManager: {},
  };
  const mockVisualizationRegistryService = {
    getRegistry: jest.fn(() => ({
      getAvailableChartTypes: jest.fn(() => [
        { type: 'bar', icon: 'visBarVertical' },
        { type: 'line', icon: 'visLine' },
      ]),
    })),
  };
  const mockStartServices = {
    executeTriggerActions: jest.fn(),
    isEditable: jest.fn().mockReturnValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    factory = new ExploreEmbeddableFactory(
      jest.fn().mockResolvedValue(mockStartServices),
      mockVisualizationRegistryService as any
    );
    jest.spyOn(OsdServices, 'getServices').mockReturnValue(mockedGetServicesResults as any);
  });

  test('has the correct type', () => {
    expect(factory.type).toBe(EXPLORE_EMBEDDABLE_TYPE);
  });

  test('has the correct display name', () => {
    expect(factory.getDisplayName()).toBe('visualization');
  });

  test('cannot create new embeddables directly', () => {
    expect(factory.canCreateNew()).toBe(false);
  });

  test('isEditable returns the value from start services', async () => {
    const result = await factory.isEditable();
    expect(result).toBe(true);
    expect(mockStartServices.isEditable).toHaveBeenCalled();
  });

  test('create returns an error when attributes are missing', async () => {
    const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };
    const result = await factory.create(input as any);
    // Check that the result is an ErrorEmbeddable
    expect(result).toBeInstanceOf(ErrorEmbeddable);
  });

  test('create successfully creates by-value embeddable with attributes', async () => {
    const mockSearchSource = {
      getField: jest.fn((field) => {
        if (field === 'index') return { id: 'test-index' };
        return null;
      }),
    };

    jest.spyOn(OsdServices, 'getServices').mockReturnValue({
      ...mockedGetServicesResults,
      data: {
        search: {
          searchSource: {
            create: jest.fn().mockResolvedValue(mockSearchSource),
          },
        },
      },
    } as any);

    const input = {
      id: 'test',
      timeRange: { from: 'now-15m', to: 'now' },
      attributes: {
        title: 'Test Explore',
        description: 'Test description',
        type: 'logs',
        columns: ['column1'],
        sort: [['column1', 'asc']],
        visualization: JSON.stringify({ chartType: 'bar' }),
        uiState: JSON.stringify({ activeTab: 'visualization' }),
        kibanaSavedObjectMeta: {
          searchSourceJSON: JSON.stringify({ query: { query: '', language: 'PPL' } }),
        },
      },
      references: [],
    };

    await factory.create(input as any);

    expect(ExploreEmbeddable).toHaveBeenCalledWith(
      expect.objectContaining({
        savedExplore: expect.objectContaining({
          id: 'test',
          title: 'Test Explore',
        }),
        editUrl: '',
        editPath: '',
        editable: false,
      }),
      input,
      mockStartServices.executeTriggerActions,
      undefined
    );
  });

  test('create handles undefined index pattern in by-value embeddable', async () => {
    const mockSearchSource = {
      getField: jest.fn(() => null),
    };

    jest.spyOn(OsdServices, 'getServices').mockReturnValue({
      ...mockedGetServicesResults,
      data: {
        search: {
          searchSource: {
            create: jest.fn().mockResolvedValue(mockSearchSource),
          },
        },
      },
    } as any);

    const input = {
      id: 'test',
      timeRange: { from: 'now-15m', to: 'now' },
      attributes: {
        title: 'Test Explore',
        type: 'logs',
        kibanaSavedObjectMeta: {
          searchSourceJSON: JSON.stringify({ query: { query: '', language: 'PPL' } }),
        },
      },
      references: [],
    };

    await factory.create(input as any);

    expect(ExploreEmbeddable).toHaveBeenCalledWith(
      expect.objectContaining({
        indexPatterns: [],
      }),
      input,
      mockStartServices.executeTriggerActions,
      undefined
    );
  });

  test('create returns error embeddable on exception', async () => {
    jest.spyOn(OsdServices, 'getServices').mockReturnValue({
      ...mockedGetServicesResults,
      data: {
        search: {
          searchSource: {
            create: jest.fn().mockRejectedValue(new Error('Test error')),
          },
        },
      },
    } as any);

    const input = {
      id: 'test',
      timeRange: { from: 'now-15m', to: 'now' },
      attributes: {
        title: 'Test Explore',
        type: 'logs',
        kibanaSavedObjectMeta: {
          searchSourceJSON: JSON.stringify({ query: { query: '', language: 'PPL' } }),
        },
      },
      references: [],
    };

    const result = await factory.create(input as any);
    expect(result).toBeInstanceOf(ErrorEmbeddable);
  });

  test('createFromSavedObject creates an ExploreEmbeddable', async () => {
    const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };

    await factory.createFromSavedObject('test-id', input as any);
    expect(ExploreEmbeddable).toHaveBeenCalledWith(
      expect.objectContaining({
        savedExplore: expect.objectContaining({
          id: 'test-id',
          title: 'Test Explore',
        }),
        editUrl: '/base/app/explore/logs/saved-explore-url',
        editPath: 'saved-explore-url',
        editable: true,
        indexPatterns: [{ id: 'test-index' }],
        editApp: 'explore/logs',
      }),
      input,
      mockStartServices.executeTriggerActions,
      undefined
    );
  });

  test('createFromSavedObject returns error object when saved object not found', async () => {
    jest.spyOn(OsdServices, 'getServices').mockReturnValue({
      ...mockedGetServicesResults,
      getSavedExploreById: jest.fn().mockResolvedValue(null),
    } as any);

    const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };
    const result = await factory.createFromSavedObject('not-found', input as any);

    // Check that the result is an error object (has an error property)
    expect(result).toBeInstanceOf(ErrorEmbeddable);
  });

  test('createFromSavedObject returns error object on error', async () => {
    jest.spyOn(OsdServices, 'getServices').mockReturnValue({
      ...mockedGetServicesResults,
      getSavedExploreById: jest.fn().mockRejectedValueOnce(new Error('Test error')),
    } as any);

    const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };
    const result = await factory.createFromSavedObject('error-id', input as any);

    // Check for properties that would be on an ErrorEmbeddable
    expect(result).toBeInstanceOf(ErrorEmbeddable);
  });

  test('getIconForSavedObject returns the correct icon type', () => {
    const savedObject = {
      attributes: {
        visualization: JSON.stringify({ chartType: 'bar' }),
      },
    };

    const iconType = factory.savedObjectMetaData.getIconForSavedObject(savedObject as any);
    expect(iconType).toBe('visBarVertical');
  });

  test('getIconForSavedObject returns empty string for invalid visualization', () => {
    const savedObject = {
      attributes: {
        visualization: 'invalid-json',
      },
    };

    const iconType = factory.savedObjectMetaData.getIconForSavedObject(savedObject as any);
    expect(iconType).toBe('');
  });

  test('getIconForSavedObject returns empty string for unknown chart type', () => {
    const savedObject = {
      attributes: {
        visualization: JSON.stringify({ chartType: 'unknown' }),
      },
    };

    const iconType = factory.savedObjectMetaData.getIconForSavedObject(savedObject as any);
    expect(iconType).toBe('');
  });

  test('createFromSavedObject returns error object when exception thrown', async () => {
    jest.spyOn(OsdServices, 'getServices').mockReturnValue({
      ...mockedGetServicesResults,
      getSavedExploreById: jest.fn().mockImplementation(() => {
        throw new Error('fail');
      }),
    } as any);
    const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };
    const result = await factory.createFromSavedObject('error-id', input as any);
    expect(result).toBeInstanceOf(ErrorEmbeddable);
  });

  describe('hydrates non-INDEX_PATTERN dataset index', () => {
    const hydratedPattern = { id: 'indexes-id', title: 'train-ticket-logs', fields: [] };
    const dataset = { id: 'indexes-id', title: 'train-ticket-logs', type: 'INDEXES' };

    const buildServicesWithDataset = (overrides: Record<string, unknown> = {}) => {
      const searchSourceState: Record<string, unknown> = {
        index: 'indexes-id',
        query: { query: '', language: 'PPL', dataset },
      };
      const setField = jest.fn((field: string, value: unknown) => {
        searchSourceState[field] = value;
      });
      const getField = jest.fn((field: string) => searchSourceState[field] ?? null);
      const cacheDataset = jest.fn().mockResolvedValue(undefined);
      const getIndexPattern = jest.fn().mockResolvedValue(hydratedPattern);

      const services = {
        ...mockedGetServicesResults,
        getSavedExploreById: jest.fn().mockResolvedValue({
          id: 'test-id',
          title: 'Test Explore',
          type: 'logs',
          searchSource: { getField, setField },
        }),
        uiSettings: {},
        savedObjects: {},
        toastNotifications: {},
        http: {},
        data: {
          indexPatterns: { get: getIndexPattern },
          query: {
            queryString: {
              getDatasetService: () => ({ cacheDataset }),
            },
          },
        },
        ...overrides,
      };

      return { services, setField, getField, cacheDataset, getIndexPattern };
    };

    test('caches the dataset and swaps searchSource.index for a hydrated IndexPattern', async () => {
      const { services, setField, cacheDataset, getIndexPattern } = buildServicesWithDataset();
      jest.spyOn(OsdServices, 'getServices').mockReturnValue(services as any);

      const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };
      await factory.createFromSavedObject('test-id', input as any);

      expect(cacheDataset).toHaveBeenCalledWith(
        dataset,
        expect.objectContaining({
          uiSettings: services.uiSettings,
          savedObjects: services.savedObjects,
          notifications: services.toastNotifications,
          http: services.http,
          data: services.data,
        })
      );
      expect(getIndexPattern).toHaveBeenCalledWith('indexes-id', true);
      expect(setField).toHaveBeenCalledWith('index', hydratedPattern);
      expect(ExploreEmbeddable).toHaveBeenCalledWith(
        expect.objectContaining({ indexPatterns: [hydratedPattern] }),
        input,
        mockStartServices.executeTriggerActions,
        undefined
      );
    });

    test('skips hydration for INDEX_PATTERN datasets', async () => {
      const getField = jest.fn((field) => {
        if (field === 'index') return 'pattern-id';
        if (field === 'query')
          return {
            query: '',
            language: 'PPL',
            dataset: { id: 'pattern-id', type: 'INDEX_PATTERN' },
          };
        return null;
      });
      const cacheDataset = jest.fn();
      jest.spyOn(OsdServices, 'getServices').mockReturnValue({
        ...mockedGetServicesResults,
        getSavedExploreById: jest.fn().mockResolvedValue({
          id: 'test-id',
          title: 'Test Explore',
          type: 'logs',
          searchSource: { getField, setField: jest.fn() },
        }),
        data: {
          indexPatterns: { get: jest.fn() },
          query: { queryString: { getDatasetService: () => ({ cacheDataset }) } },
        },
      } as any);

      const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };
      await factory.createFromSavedObject('test-id', input as any);

      expect(cacheDataset).not.toHaveBeenCalled();
    });

    test('falls through without crashing if cacheDataset throws', async () => {
      const { services, setField } = buildServicesWithDataset({
        data: {
          indexPatterns: { get: jest.fn() },
          query: {
            queryString: {
              getDatasetService: () => ({
                cacheDataset: jest.fn().mockRejectedValue(new Error('boom')),
              }),
            },
          },
        },
      });
      jest.spyOn(OsdServices, 'getServices').mockReturnValue(services as any);

      const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };
      const result = await factory.createFromSavedObject('test-id', input as any);

      expect(setField).not.toHaveBeenCalled();
      expect(result).not.toBeInstanceOf(ErrorEmbeddable);
    });
  });

  test('createFromSavedObject works when indexPattern is null', async () => {
    jest.spyOn(OsdServices, 'getServices').mockReturnValue({
      ...mockedGetServicesResults,
      getSavedExploreById: jest.fn().mockResolvedValue({
        ...mockedGetServicesResults.getSavedExploreById(),
        searchSource: {
          getField: jest.fn(() => null),
        },
      }),
    } as any);
    const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };
    await factory.createFromSavedObject('test-id', input as any);
    expect(ExploreEmbeddable).toHaveBeenCalledWith(
      expect.objectContaining({
        indexPatterns: [],
      }),
      input,
      mockStartServices.executeTriggerActions,
      undefined
    );
  });
});

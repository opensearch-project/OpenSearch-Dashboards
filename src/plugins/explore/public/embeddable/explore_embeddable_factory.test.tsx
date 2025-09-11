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
    expect(factory.getDisplayName()).toBe('visualization in discover');
  });

  test('cannot create new embeddables directly', () => {
    expect(factory.canCreateNew()).toBe(false);
  });

  test('isEditable returns the value from start services', async () => {
    const result = await factory.isEditable();
    expect(result).toBe(true);
    expect(mockStartServices.isEditable).toHaveBeenCalled();
  });

  test('create returns an error object', async () => {
    const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };
    const result = await factory.create(input as any);
    // Check that the result is an error object (has an error property)
    expect(result).toHaveProperty('error');
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

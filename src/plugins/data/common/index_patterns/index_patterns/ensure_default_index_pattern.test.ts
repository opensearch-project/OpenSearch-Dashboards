/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createEnsureDefaultIndexPattern } from './ensure_default_index_pattern';
import { IndexPatternsContract } from './index_patterns';
import { UiSettingsCommon, SavedObjectsClientCommon, SavedObject } from '../types';
import { IndexPattern } from './index_pattern';

describe('ensureDefaultIndexPattern', () => {
  let uiSettings: jest.Mocked<UiSettingsCommon>;
  let onRedirectNoIndexPattern: jest.Mock;
  let savedObjectsClient: jest.Mocked<SavedObjectsClientCommon>;
  let indexPatterns: jest.Mocked<IndexPatternsContract>;
  let ensureDefaultIndexPattern: () => Promise<unknown | void> | undefined;

  beforeEach(() => {
    uiSettings = {
      get: jest.fn(),
      set: jest.fn(),
      getAll: jest.fn(),
      remove: jest.fn(),
    };

    onRedirectNoIndexPattern = jest.fn();
    savedObjectsClient = {
      find: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    indexPatterns = ({
      getIds: jest.fn(),
      get: jest.fn(),
      getDataSource: jest.fn(),
    } as unknown) as jest.Mocked<IndexPatternsContract>;
  });

  test('should return early if canUpdateUiSetting is false', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      false,
      savedObjectsClient
    );

    await ensureDefaultIndexPattern.call(indexPatterns);
    expect(uiSettings.get).not.toHaveBeenCalled();
    expect(indexPatterns.getIds).not.toHaveBeenCalled();
  });

  test('should set first available pattern as default when no valid default exists', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    indexPatterns.getIds.mockResolvedValue(['pattern1']);
    uiSettings.get.mockImplementation(async (key) => {
      if (key === 'defaultIndex') return 'invalid-pattern';
      return false;
    });
    (indexPatterns.get as jest.Mock).mockResolvedValue({
      dataSourceRef: { id: 'ds1' },
    });
    (indexPatterns.getDataSource as jest.Mock).mockResolvedValue({
      error: { statusCode: 404 },
    });
    (savedObjectsClient.find as jest.Mock).mockImplementation((params) => {
      if (params.type === 'data-source') {
        return Promise.resolve([{ id: 'ds1' }]);
      }
      if (params.type === 'index-pattern') {
        return Promise.resolve([
          {
            id: 'pattern1',
            references: [{ id: 'ds1' }],
          },
        ]);
      }
    });

    await ensureDefaultIndexPattern.call(indexPatterns);
    expect(indexPatterns.getIds).toHaveBeenCalled();
    expect(uiSettings.set).toHaveBeenCalledWith('defaultIndex', 'pattern1');
  });

  test('should redirect when no patterns available and enhancements disabled', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    (indexPatterns.getIds as jest.Mock).mockResolvedValue([]);
    (uiSettings.get as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(false);
    (savedObjectsClient.find as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await ensureDefaultIndexPattern.call(indexPatterns);
    expect(onRedirectNoIndexPattern).toHaveBeenCalled();
  });

  test('should handle invalid data source', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    const defaultId = 'pattern1';
    (indexPatterns.getIds as jest.Mock).mockResolvedValue([defaultId]);
    (uiSettings.get as jest.Mock).mockResolvedValue(defaultId);
    (indexPatterns.get as jest.Mock).mockResolvedValue({
      dataSourceRef: { id: 'ds1' },
    });
    (indexPatterns.getDataSource as jest.Mock).mockResolvedValue({
      error: { statusCode: 404 },
    });

    await ensureDefaultIndexPattern.call(indexPatterns);
    expect(savedObjectsClient.find).toHaveBeenCalledWith({ type: 'data-source' });
  });

  test('should return early if index pattern has no dataSourceRef', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    const defaultId = 'pattern1';
    (indexPatterns.getIds as jest.Mock).mockResolvedValue([defaultId]);
    (uiSettings.get as jest.Mock).mockResolvedValue(defaultId);
    (indexPatterns.get as jest.Mock).mockResolvedValue({});

    await ensureDefaultIndexPattern.call(indexPatterns);
    expect(indexPatterns.getDataSource).not.toHaveBeenCalled();
  });

  test('should handle successful data source lookup', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    const defaultId = 'pattern1';
    (indexPatterns.getIds as jest.Mock).mockResolvedValue([defaultId]);
    (uiSettings.get as jest.Mock).mockResolvedValue(defaultId);
    (indexPatterns.get as jest.Mock).mockResolvedValue({
      dataSourceRef: { id: 'ds1' },
    });
    (indexPatterns.getDataSource as jest.Mock).mockResolvedValue({
      data: {},
    });

    await ensureDefaultIndexPattern.call(indexPatterns);
    expect(savedObjectsClient.find).not.toHaveBeenCalled();
  });

  test('should process available patterns when data source lookup fails', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    const defaultId = 'pattern1';
    (indexPatterns.getIds as jest.Mock).mockResolvedValue([defaultId]);
    (uiSettings.get as jest.Mock).mockResolvedValue(defaultId);
    (indexPatterns.get as jest.Mock).mockResolvedValue({
      dataSourceRef: { id: 'ds1' },
    });
    (indexPatterns.getDataSource as jest.Mock).mockResolvedValue({
      error: { statusCode: 403 },
    });
    (savedObjectsClient.find as jest.Mock).mockImplementation((params) => {
      if (params.type === 'data-source') {
        return Promise.resolve([{ id: 'ds1' }]);
      }
      if (params.type === 'index-pattern') {
        return Promise.resolve([
          {
            id: 'pattern1',
            references: [{ id: 'ds1' }],
          },
        ]);
      }
    });

    await ensureDefaultIndexPattern.call(indexPatterns);
    expect(uiSettings.set).toHaveBeenCalledWith('defaultIndex', 'pattern1');
  });

  test('should handle error in savedObjectsClient.find', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    (indexPatterns.getIds as jest.Mock).mockResolvedValue([]);
    (uiSettings.get as jest.Mock).mockResolvedValue(null);
    (indexPatterns.get as jest.Mock).mockResolvedValue({
      dataSourceRef: { id: 'ds1' },
    });
    (indexPatterns.getDataSource as jest.Mock).mockResolvedValue({
      error: { statusCode: 403 },
    });
    (savedObjectsClient.find as jest.Mock).mockRejectedValue(new Error('Failed to find'));

    await ensureDefaultIndexPattern.call(indexPatterns);
    expect(onRedirectNoIndexPattern).toHaveBeenCalled();
  });

  test('should handle index patterns with invalid references', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    const defaultId = 'pattern1';
    (indexPatterns.getIds as jest.Mock).mockResolvedValue([defaultId]);
    (uiSettings.get as jest.Mock).mockResolvedValue(defaultId);
    (indexPatterns.get as jest.Mock).mockResolvedValue({
      dataSourceRef: { id: 'ds1' },
    });
    (indexPatterns.getDataSource as jest.Mock).mockResolvedValue({
      error: { statusCode: 403 },
    });
    (savedObjectsClient.find as jest.Mock).mockImplementation((params) => {
      if (params.type === 'data-source') {
        return Promise.resolve([{ id: 'ds2' }]);
      }
      if (params.type === 'index-pattern') {
        return Promise.resolve([
          {
            id: 'pattern1',
            references: [],
          },
          {
            id: 'pattern2',
            references: [{ id: 'ds3' }],
          },
        ]);
      }
    });

    await ensureDefaultIndexPattern.call(indexPatterns);
    expect(uiSettings.set).toHaveBeenCalledWith('defaultIndex', 'pattern1');
  });

  test("should handle index patterns without throwing error when data sources reference's id is empty", async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    const defaultId = 'pattern1';
    indexPatterns.getIds.mockResolvedValue([defaultId]);
    uiSettings.get.mockResolvedValue(defaultId);
    indexPatterns.get.mockResolvedValue({
      dataSourceRef: { id: '', type: 'data-source' },
    } as IndexPattern);
    indexPatterns.getDataSource.mockResolvedValue({
      id: '',
      type: '',
      attributes: {
        title: '',
        endpoint: '',
        dataSourceVersion: '',
        auth: {
          type: '',
          credentials: undefined,
        },
      },
      references: [],
      error: { statusCode: 403, error: '', message: '' },
    });

    savedObjectsClient.find.mockImplementation(async (params) => {
      if (params.type === 'data-source') {
        return Promise.resolve([{ id: 'ds2' }] as Array<SavedObject<unknown>>);
      }
      if (params.type === 'index-pattern') {
        return Promise.resolve([
          {
            id: 'pattern1',
            references: [],
          },
          {
            id: 'pattern2',
            references: [{ id: 'ds3' }],
          },
        ] as Array<SavedObject<unknown>>);
      }

      return [] as Array<SavedObject<unknown>>;
    });

    await ensureDefaultIndexPattern.call(indexPatterns);
    expect(uiSettings.set).toHaveBeenCalledWith('defaultIndex', 'pattern1');
    uiSettings.set.mockClear();

    savedObjectsClient.find.mockImplementation(async (params) => {
      if (params.type === 'data-source') {
        return Promise.resolve([{ id: 'ds2' }] as Array<SavedObject<unknown>>);
      }
      if (params.type === 'index-pattern') {
        return Promise.resolve([
          {
            id: 'pattern1',
            references: [{ id: '', type: 'data-source' }],
          },
          {
            id: 'pattern2',
            references: [{ id: 'ds3' }],
          },
        ] as Array<SavedObject<unknown>>);
      }

      return [] as Array<SavedObject<unknown>>;
    });

    await ensureDefaultIndexPattern.call(indexPatterns);
    expect(uiSettings.set).toHaveBeenCalledWith('defaultIndex', 'pattern2');
    uiSettings.set.mockClear();

    savedObjectsClient.find.mockImplementation(async (params) => {
      if (params.type === 'data-source') {
        return Promise.resolve([{ id: 'ds2' }] as Array<SavedObject<unknown>>);
      }
      if (params.type === 'index-pattern') {
        return Promise.resolve([
          {
            id: 'pattern1',
            references: [{ id: 'ds2', type: 'data-source' }],
          },
        ] as Array<SavedObject<unknown>>);
      }

      return [] as Array<SavedObject<unknown>>;
    });

    await ensureDefaultIndexPattern.call(indexPatterns);
    expect(uiSettings.set).toHaveBeenCalledWith('defaultIndex', 'pattern1');
  });

  test('should not throw error when getDataSource throws error', async () => {
    ensureDefaultIndexPattern = createEnsureDefaultIndexPattern(
      uiSettings,
      onRedirectNoIndexPattern,
      true,
      savedObjectsClient
    );

    uiSettings.get.mockResolvedValue('pattern1');
    indexPatterns.get.mockResolvedValue({
      dataSourceRef: { id: 'datasource1', type: 'data-source' },
    } as IndexPattern);
    indexPatterns.getIds.mockResolvedValue(['pattern1']);
    indexPatterns.getDataSource.mockRejectedValue(new Error('Failed to get data source'));

    await expect(
      async () => await ensureDefaultIndexPattern.call(indexPatterns)
    ).not.toThrowError();
  });
});

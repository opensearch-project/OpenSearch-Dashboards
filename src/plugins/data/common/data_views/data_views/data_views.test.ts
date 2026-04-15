/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { defaults } from 'lodash';
import { DataViewsService, DataView } from '.';
import { fieldFormatsMock } from '../../field_formats/mocks';
import { stubbedSavedObjectIndexPattern } from '../../../../../fixtures/stubbed_saved_object_index_pattern';
import { DataViewUiSettingsCommon, DataViewSavedObjectsClientCommon, SavedObject } from '../types';
import { UI_SETTINGS } from '../../constants';
import { IndexPatternsService } from '../../index_patterns';
import { DuplicateDataViewError } from '../errors/duplicate_data_view';

const createFieldsFetcher = jest.fn().mockImplementation(() => ({
  getFieldsForWildcard: jest.fn().mockImplementation(() => {
    return new Promise((resolve) => resolve([]));
  }),
  every: jest.fn(),
}));

const fieldFormats = fieldFormatsMock;
let object: any = {};

const indexPatternsMock = ({
  clearCache: jest.fn(),
  get: jest.fn().mockImplementation((id, onlyCheckCache) => {
    return onlyCheckCache ? null : Promise.resolve(null);
  }),
  getByTitle: jest.fn(),
  saveToCache: jest.fn(),
} as unknown) as IndexPatternsService;

function setDocsourcePayload(id: string | null, providedPayload: any) {
  object = defaults(providedPayload || {}, stubbedSavedObjectIndexPattern(id));
}

describe('DataViews', () => {
  let dataViews: DataViewsService;
  let savedObjectsClient: DataViewSavedObjectsClientCommon;
  const uiSettingsGet = jest.fn();

  beforeEach(() => {
    const indexPatternObj = { id: 'id', version: 'a', attributes: { title: 'title' } };
    savedObjectsClient = {} as DataViewSavedObjectsClientCommon;
    savedObjectsClient.find = jest.fn(
      () => Promise.resolve([indexPatternObj]) as Promise<Array<SavedObject<any>>>
    );
    savedObjectsClient.delete = jest.fn(() => Promise.resolve({}) as Promise<any>);
    savedObjectsClient.create = jest.fn();
    savedObjectsClient.get = jest.fn().mockImplementation(async (type, id) => ({
      id: object.id,
      version: object.version,
      attributes: object.attributes,
    }));
    savedObjectsClient.update = jest
      .fn()
      .mockImplementation(async (type, id, body, { version }) => {
        if (object.version !== version) {
          throw new Object({
            res: {
              status: 409,
            },
          });
        }
        object.attributes.title = body.title;
        object.version += 'a';
        return {
          id: object.id,
          version: object.version,
        };
      });

    uiSettingsGet.mockClear();
    uiSettingsGet.mockReturnValue(Promise.resolve(false));

    dataViews = new DataViewsService({
      patterns: indexPatternsMock,
      uiSettings: ({
        get: uiSettingsGet,
        getAll: () => {},
      } as any) as DataViewUiSettingsCommon,
      savedObjectsClient: (savedObjectsClient as unknown) as DataViewSavedObjectsClientCommon,
      apiClient: createFieldsFetcher(),
      fieldFormats,
      onNotification: () => {},
      onError: () => {},
      onRedirectNoDataView: () => {},
      onUnsupportedTimePattern: () => {},
    });
  });

  test('does cache gets for the same id', async () => {
    const id = '1';
    setDocsourcePayload(id, {
      id: 'foo',
      version: 'foo',
      attributes: {
        title: 'something',
      },
    });

    const indexPattern = await dataViews.get(id);

    expect(indexPattern).toBeDefined();
  });

  test('savedObjectCache pre-fetches only title', async () => {
    expect(await dataViews.getIds()).toEqual(['id']);
    expect(savedObjectsClient.find).toHaveBeenCalledWith({
      type: 'index-pattern',
      fields: ['title'],
      perPage: 10000,
    });
  });

  test('caches saved objects', async () => {
    await dataViews.getIds();
    await dataViews.getTitles();
    expect(savedObjectsClient.find).toHaveBeenCalledTimes(1);
  });

  test('can refresh the saved objects caches', async () => {
    await dataViews.getIds();
    await dataViews.getTitles(true);
    expect(savedObjectsClient.find).toHaveBeenCalledTimes(2);
  });

  test('deletes the index pattern', async () => {
    const id = '1';
    const indexPattern = await dataViews.get(id);

    expect(indexPattern).toBeDefined();
    await dataViews.delete(id);
    expect(indexPattern).not.toBe(await dataViews.get(id));
  });

  test('should handle version conflicts', async () => {
    setDocsourcePayload(null, {
      id: 'foo',
      version: 'foo',
      attributes: {
        title: 'something',
      },
    });

    // get() is read-only and does not trigger a save
    const pattern = await dataViews.get('foo');
    expect(pattern.version).toBe('foo');
    dataViews.clearCache();

    const samePattern = await dataViews.get('foo');
    expect(samePattern.version).toBe('foo');

    // First save succeeds and bumps the version
    pattern.title = 'foo2';
    await dataViews.updateSavedObject(pattern);
    expect(pattern.version).toBe('fooa');

    // Second save conflicts because samePattern still has the old version
    samePattern.title = 'foo3';

    let result;
    try {
      await dataViews.updateSavedObject(samePattern);
    } catch (err) {
      result = err;
    }

    expect(result.res.status).toBe(409);
  });

  test('create', async () => {
    const title = 'opensearch-dashboards-*';
    dataViews.refreshFields = jest.fn();

    const indexPattern = await dataViews.create({ title }, true);
    expect(indexPattern).toBeInstanceOf(DataView);
    expect(indexPattern.title).toBe(title);
    expect(dataViews.refreshFields).not.toBeCalled();

    await dataViews.create({ title });
    expect(dataViews.refreshFields).toBeCalled();
  });

  test('createAndSave', async () => {
    const title = 'opensearch-dashboards-*';
    dataViews.createSavedObject = jest.fn();
    dataViews.setDefault = jest.fn();
    await dataViews.createAndSave({ title });
    expect(dataViews.createSavedObject).toBeCalled();
    expect(dataViews.setDefault).toBeCalled();
  });

  test('savedObjectToSpec', () => {
    const savedObject = {
      id: 'id',
      version: 'version',
      attributes: {
        title: 'opensearch-dashboards-*',
        timeFieldName: '@timestamp',
        fields: '[]',
        sourceFilters: '[{"value":"item1"},{"value":"item2"}]',
        fieldFormatMap: '{"field":{}}',
        typeMeta: '{}',
        type: '',
        signalType: undefined,
      },
      type: 'index-pattern',
      references: [],
    };

    expect(dataViews.savedObjectToSpec(savedObject)).toMatchSnapshot();
  });

  test('savedObjectToSpecWithDataSource', () => {
    const savedObject = {
      id: 'id',
      version: 'version',
      attributes: {
        title: 'opensearch-dashboards-*',
        timeFieldName: '@timestamp',
        fields: '[]',
        sourceFilters: '[{"value":"item1"},{"value":"item2"}]',
        fieldFormatMap: '{"field":{}}',
        typeMeta: '{}',
        type: '',
        signalType: undefined,
      },
      type: 'index-pattern',
      references: [
        {
          id: 'id',
          type: 'data-source',
          name: 'dataSource',
        },
      ],
    };

    expect(dataViews.savedObjectToSpec(savedObject)).toMatchSnapshot();
  });

  test('correctly detects long-numerals support', async () => {
    expect(await dataViews.isLongNumeralsSupported()).toBe(false);

    uiSettingsGet.mockImplementation((key: string) =>
      Promise.resolve(key === UI_SETTINGS.DATA_WITH_LONG_NUMERALS ? true : undefined)
    );
    expect(await dataViews.isLongNumeralsSupported()).toBe(true);
  });

  describe('createSavedObject error handling', () => {
    test('throws DuplicateDataViewError on 409 conflict with statusCode', async () => {
      const title = 'test-pattern-*';
      // Mock findByTitle to return nothing (no dupe check)
      savedObjectsClient.find = jest.fn().mockResolvedValue([]);
      // Mock create to throw 409 error
      savedObjectsClient.create = jest.fn().mockRejectedValue({
        statusCode: 409,
        message: 'document already exists',
      });

      const dataView = await dataViews.create({ title }, true);

      await expect(dataViews.createSavedObject(dataView)).rejects.toThrow(DuplicateDataViewError);
      await expect(dataViews.createSavedObject(dataView)).rejects.toThrow(
        `Duplicate data view: ${title}`
      );
    });

    test('throws DuplicateDataViewError on 409 conflict with status', async () => {
      const title = 'test-pattern-*';
      savedObjectsClient.find = jest.fn().mockResolvedValue([]);
      savedObjectsClient.create = jest.fn().mockRejectedValue({
        status: 409,
        message: 'version conflict',
      });

      const dataView = await dataViews.create({ title }, true);

      await expect(dataViews.createSavedObject(dataView)).rejects.toThrow(DuplicateDataViewError);
    });

    test('throws DuplicateDataViewError on 409 conflict with body.statusCode', async () => {
      const title = 'test-pattern-*';
      savedObjectsClient.find = jest.fn().mockResolvedValue([]);
      savedObjectsClient.create = jest.fn().mockRejectedValue({
        body: {
          statusCode: 409,
          message: 'document already exists',
        },
      });

      const dataView = await dataViews.create({ title }, true);

      await expect(dataViews.createSavedObject(dataView)).rejects.toThrow(DuplicateDataViewError);
    });

    test('throws DuplicateDataViewError on 409 conflict with body.message', async () => {
      const title = 'test-pattern-*';
      savedObjectsClient.find = jest.fn().mockResolvedValue([]);
      savedObjectsClient.create = jest.fn().mockRejectedValue({
        statusCode: 409,
        body: {
          message: 'version conflict, required seqNo',
        },
      });

      const dataView = await dataViews.create({ title }, true);

      await expect(dataViews.createSavedObject(dataView)).rejects.toThrow(DuplicateDataViewError);
    });

    test('re-throws other errors without wrapping', async () => {
      const title = 'test-pattern-*';
      const originalError = new Error('Network error');
      savedObjectsClient.find = jest.fn().mockResolvedValue([]);
      savedObjectsClient.create = jest.fn().mockRejectedValue(originalError);

      const dataView = await dataViews.create({ title }, true);

      await expect(dataViews.createSavedObject(dataView)).rejects.toThrow('Network error');
      await expect(dataViews.createSavedObject(dataView)).rejects.not.toThrow(
        DuplicateDataViewError
      );
    });

    test('re-throws 409 errors that are not duplicate-related', async () => {
      const title = 'test-pattern-*';
      savedObjectsClient.find = jest.fn().mockResolvedValue([]);
      const error409 = { statusCode: 409, message: 'some other conflict' };
      savedObjectsClient.create = jest.fn().mockRejectedValue(error409);

      const dataView = await dataViews.create({ title }, true);

      // Should throw the original error, not a DuplicateDataViewError
      await expect(dataViews.createSavedObject(dataView)).rejects.toEqual(error409);
    });

    test('successfully creates saved object when no conflict', async () => {
      const title = 'test-pattern-*';
      const mockResponse = { id: 'test-id' };
      savedObjectsClient.find = jest.fn().mockResolvedValue([]);
      savedObjectsClient.create = jest.fn().mockResolvedValue(mockResponse);

      const dataView = await dataViews.create({ title }, true);
      const result = await dataViews.createSavedObject(dataView);

      expect(result).toBe(dataView);
      expect(result.id).toBe('test-id');
    });
  });

  describe('plain IndexPattern cache poisoning', () => {
    // DatasetService.fetchDefaultDataset() calls IndexPatternsService.get() during plugin
    // start(), which caches a plain IndexPattern (no toDataset, no initializeDataSourceRef)
    // into the shared indexPatternCache. DataViewsService.get() and getMultiple() must
    // treat such entries as cache misses so they re-fetch and create a proper DataView,
    // ensuring dataSource.title is populated from the saved object rather than the raw
    // saved-object reference name "dataSource".

    const plainIndexPattern = { id: 'test-id', title: 'test-*' }; // no toDataset

    const properDataView = ({
      id: 'test-id',
      title: 'test-*',
      toDataset: jest.fn(),
    } as unknown) as DataView;

    test('get() bypasses cache when cached entry is a plain IndexPattern', async () => {
      const localPatternsMock = ({
        clearCache: jest.fn(),
        get: jest.fn().mockResolvedValue(plainIndexPattern),
        getByTitle: jest.fn(),
        saveToCache: jest.fn(),
      } as unknown) as IndexPatternsService;

      const localDataViews = new DataViewsService({
        patterns: localPatternsMock,
        uiSettings: { get: jest.fn().mockResolvedValue(false), getAll: () => {} } as any,
        savedObjectsClient: (savedObjectsClient as unknown) as DataViewSavedObjectsClientCommon,
        apiClient: createFieldsFetcher(),
        fieldFormats,
        onNotification: () => {},
        onError: () => {},
        onRedirectNoDataView: () => {},
        onUnsupportedTimePattern: () => {},
      });

      setDocsourcePayload('test-id', {
        id: 'test-id',
        version: '1',
        attributes: { title: 'test-*' },
      });

      const result = await localDataViews.get('test-id');

      // Should have fetched from savedObjects, not returned the plain IndexPattern
      expect(savedObjectsClient.get).toHaveBeenCalled();
      expect(result).toBeInstanceOf(DataView);
    });

    test('get() with onlyCheckCache returns undefined when cached entry is a plain IndexPattern', async () => {
      const localPatternsMock = ({
        clearCache: jest.fn(),
        get: jest.fn().mockResolvedValue(plainIndexPattern),
        getByTitle: jest.fn(),
        saveToCache: jest.fn(),
      } as unknown) as IndexPatternsService;

      const localDataViews = new DataViewsService({
        patterns: localPatternsMock,
        uiSettings: { get: jest.fn().mockResolvedValue(false), getAll: () => {} } as any,
        savedObjectsClient: (savedObjectsClient as unknown) as DataViewSavedObjectsClientCommon,
        apiClient: createFieldsFetcher(),
        fieldFormats,
        onNotification: () => {},
        onError: () => {},
        onRedirectNoDataView: () => {},
        onUnsupportedTimePattern: () => {},
      });

      const result = await localDataViews.get('test-id', true);

      expect(result).toBeUndefined();
      expect(savedObjectsClient.get).not.toHaveBeenCalled();
    });

    test('get() uses cache when entry is a proper DataView', async () => {
      const localPatternsMock = ({
        clearCache: jest.fn(),
        get: jest.fn().mockResolvedValue(properDataView),
        getByTitle: jest.fn(),
        saveToCache: jest.fn(),
      } as unknown) as IndexPatternsService;

      const localDataViews = new DataViewsService({
        patterns: localPatternsMock,
        uiSettings: { get: jest.fn().mockResolvedValue(false), getAll: () => {} } as any,
        savedObjectsClient: (savedObjectsClient as unknown) as DataViewSavedObjectsClientCommon,
        apiClient: createFieldsFetcher(),
        fieldFormats,
        onNotification: () => {},
        onError: () => {},
        onRedirectNoDataView: () => {},
        onUnsupportedTimePattern: () => {},
      });

      const result = await localDataViews.get('test-id');

      expect(result).toBe(properDataView);
      expect(savedObjectsClient.get).not.toHaveBeenCalled();
    });

    test('getMultiple() bypasses cache when cached entry is a plain IndexPattern', async () => {
      const localPatternsMock = ({
        clearCache: jest.fn(),
        get: jest.fn().mockResolvedValue(plainIndexPattern),
        getByTitle: jest.fn(),
        saveToCache: jest.fn(),
      } as unknown) as IndexPatternsService;

      const localDataViews = new DataViewsService({
        patterns: localPatternsMock,
        uiSettings: { get: jest.fn().mockResolvedValue(false), getAll: () => {} } as any,
        savedObjectsClient: (savedObjectsClient as unknown) as DataViewSavedObjectsClientCommon,
        apiClient: createFieldsFetcher(),
        fieldFormats,
        onNotification: () => {},
        onError: () => {},
        onRedirectNoDataView: () => {},
        onUnsupportedTimePattern: () => {},
      });

      setDocsourcePayload('test-id', {
        id: 'test-id',
        version: '1',
        attributes: { title: 'test-*' },
      });
      savedObjectsClient.bulkGet = jest.fn().mockResolvedValue({
        savedObjects: [
          { id: 'test-id', version: '1', attributes: { title: 'test-*' }, references: [] },
        ],
      });

      const results = await localDataViews.getMultiple(['test-id']);

      // Should have gone to bulkGet, not used the plain IndexPattern from cache
      expect(savedObjectsClient.bulkGet).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(DataView);
    });

    test('getMultiple() uses cache when entry is a proper DataView', async () => {
      const localPatternsMock = ({
        clearCache: jest.fn(),
        get: jest.fn().mockResolvedValue(properDataView),
        getByTitle: jest.fn(),
        saveToCache: jest.fn(),
      } as unknown) as IndexPatternsService;

      const localDataViews = new DataViewsService({
        patterns: localPatternsMock,
        uiSettings: { get: jest.fn().mockResolvedValue(false), getAll: () => {} } as any,
        savedObjectsClient: (savedObjectsClient as unknown) as DataViewSavedObjectsClientCommon,
        apiClient: createFieldsFetcher(),
        fieldFormats,
        onNotification: () => {},
        onError: () => {},
        onRedirectNoDataView: () => {},
        onUnsupportedTimePattern: () => {},
      });

      savedObjectsClient.bulkGet = jest.fn();

      const results = await localDataViews.getMultiple(['test-id']);

      expect(savedObjectsClient.bulkGet).not.toHaveBeenCalled();
      expect(results[0]).toBe(properDataView);
    });

    test('getMultiple() skips not-found saved objects instead of throwing', async () => {
      const localPatternsMock = ({
        clearCache: jest.fn(),
        get: jest.fn().mockResolvedValue(undefined),
        getByTitle: jest.fn(),
        saveToCache: jest.fn(),
      } as unknown) as IndexPatternsService;

      const localDataViews = new DataViewsService({
        patterns: localPatternsMock,
        uiSettings: { get: jest.fn().mockResolvedValue(false), getAll: () => {} } as any,
        savedObjectsClient: (savedObjectsClient as unknown) as DataViewSavedObjectsClientCommon,
        apiClient: createFieldsFetcher(),
        fieldFormats,
        onNotification: () => {},
        onError: () => {},
        onRedirectNoDataView: () => {},
        onUnsupportedTimePattern: () => {},
      });

      setDocsourcePayload('valid-id', {
        id: 'valid-id',
        version: '1',
        attributes: { title: 'valid-*' },
      });

      savedObjectsClient.bulkGet = jest.fn().mockResolvedValue({
        savedObjects: [
          { id: 'valid-id', version: '1', attributes: { title: 'valid-*' }, references: [] },
          {
            id: 'orphaned-id',
            attributes: {},
            type: 'index-pattern',
            error: { statusCode: 404, message: 'Not found' },
            references: [],
          },
        ],
      });

      const results = await localDataViews.getMultiple(['valid-id', 'orphaned-id']);

      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(DataView);
      expect(results[0].id).toBe('valid-id');
    });

    test('getMultiple() skips objects that throw during processing without breaking others', async () => {
      const onErrorMock = jest.fn();
      const localPatternsMock = ({
        clearCache: jest.fn(),
        get: jest.fn().mockResolvedValue(undefined),
        getByTitle: jest.fn(),
        saveToCache: jest.fn(),
      } as unknown) as IndexPatternsService;

      const localDataViews = new DataViewsService({
        patterns: localPatternsMock,
        uiSettings: { get: jest.fn().mockResolvedValue(false), getAll: () => {} } as any,
        savedObjectsClient: (savedObjectsClient as unknown) as DataViewSavedObjectsClientCommon,
        apiClient: createFieldsFetcher(),
        fieldFormats,
        onNotification: () => {},
        onError: onErrorMock,
        onRedirectNoDataView: () => {},
        onUnsupportedTimePattern: () => {},
      });

      setDocsourcePayload('valid-id', {
        id: 'valid-id',
        version: '1',
        attributes: { title: 'valid-*' },
      });

      savedObjectsClient.bulkGet = jest.fn().mockResolvedValue({
        savedObjects: [
          { id: 'valid-id', version: '1', attributes: { title: 'valid-*' }, references: [] },
          {
            id: 'corrupt-id',
            version: '1',
            attributes: { title: 'corrupt-*', fieldFormatMap: '{invalid json' },
            references: [],
          },
        ],
      });

      const results = await localDataViews.getMultiple(['valid-id', 'corrupt-id']);

      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(DataView);
      expect(results[0].id).toBe('valid-id');
      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ title: 'Failed to load data view "corrupt-id"' })
      );
    });
  });
});

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

    // Create a normal index patterns
    const pattern = await dataViews.get('foo');

    expect(pattern.version).toBe('fooa');
    dataViews.clearCache();

    // Create the same one - we're going to handle concurrency
    const samePattern = await dataViews.get('foo');

    expect(samePattern.version).toBe('fooaa');

    // This will conflict because samePattern did a save (from refreshFields)
    // but the resave should work fine
    pattern.title = 'foo2';
    await dataViews.updateSavedObject(pattern);

    // This should not be able to recover
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
});

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

const createFieldsFetcher = jest.fn().mockImplementation(() => ({
  getFieldsForWildcard: jest.fn().mockImplementation(() => {
    return new Promise((resolve) => resolve([]));
  }),
  every: jest.fn(),
}));

const fieldFormats = fieldFormatsMock;
let object: any = {};

function setDocsourcePayload(id: string | null, providedPayload: any) {
  object = defaults(providedPayload || {}, stubbedSavedObjectIndexPattern(id));
}

describe('DataViews', () => {
  let indexPatterns: DataViewsService;
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

    indexPatterns = new DataViewsService({
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

    const indexPattern = await indexPatterns.get(id);

    expect(indexPattern).toBeDefined();
    expect(indexPattern).toBe(await indexPatterns.get(id));
  });

  test('savedObjectCache pre-fetches only title', async () => {
    expect(await indexPatterns.getIds()).toEqual(['id']);
    expect(savedObjectsClient.find).toHaveBeenCalledWith({
      type: 'index-pattern',
      fields: ['title'],
      perPage: 10000,
    });
  });

  test('caches saved objects', async () => {
    await indexPatterns.getIds();
    await indexPatterns.getTitles();
    expect(savedObjectsClient.find).toHaveBeenCalledTimes(1);
  });

  test('can refresh the saved objects caches', async () => {
    await indexPatterns.getIds();
    await indexPatterns.getTitles(true);
    expect(savedObjectsClient.find).toHaveBeenCalledTimes(2);
  });

  test('deletes the index pattern', async () => {
    const id = '1';
    const indexPattern = await indexPatterns.get(id);

    expect(indexPattern).toBeDefined();
    await indexPatterns.delete(id);
    expect(indexPattern).not.toBe(await indexPatterns.get(id));
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
    const pattern = await indexPatterns.get('foo');

    expect(pattern.version).toBe('fooa');
    indexPatterns.clearCache();

    // Create the same one - we're going to handle concurrency
    const samePattern = await indexPatterns.get('foo');

    expect(samePattern.version).toBe('fooaa');

    // This will conflict because samePattern did a save (from refreshFields)
    // but the resave should work fine
    pattern.title = 'foo2';
    await indexPatterns.updateSavedObject(pattern);

    // This should not be able to recover
    samePattern.title = 'foo3';

    let result;
    try {
      await indexPatterns.updateSavedObject(samePattern);
    } catch (err) {
      result = err;
    }

    expect(result.res.status).toBe(409);
  });

  test('create', async () => {
    const title = 'opensearch-dashboards-*';
    indexPatterns.refreshFields = jest.fn();

    const indexPattern = await indexPatterns.create({ title }, true);
    expect(indexPattern).toBeInstanceOf(DataView);
    expect(indexPattern.title).toBe(title);
    expect(indexPatterns.refreshFields).not.toBeCalled();

    await indexPatterns.create({ title });
    expect(indexPatterns.refreshFields).toBeCalled();
  });

  test('createAndSave', async () => {
    const title = 'opensearch-dashboards-*';
    indexPatterns.createSavedObject = jest.fn();
    indexPatterns.setDefault = jest.fn();
    await indexPatterns.createAndSave({ title });
    expect(indexPatterns.createSavedObject).toBeCalled();
    expect(indexPatterns.setDefault).toBeCalled();
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
      },
      type: 'index-pattern',
      references: [],
    };

    expect(indexPatterns.savedObjectToSpec(savedObject)).toMatchSnapshot();
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

    expect(indexPatterns.savedObjectToSpec(savedObject)).toMatchSnapshot();
  });

  test('correctly detects long-numerals support', async () => {
    expect(await indexPatterns.isLongNumeralsSupported()).toBe(false);

    uiSettingsGet.mockImplementation((key: string) =>
      Promise.resolve(key === UI_SETTINGS.DATA_WITH_LONG_NUMERALS ? true : undefined)
    );
    expect(await indexPatterns.isLongNumeralsSupported()).toBe(true);
  });
});

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { defaults } from 'lodash';
import { IndexPatternsService, IndexPattern } from '.';
import { fieldFormatsMock } from '../../field_formats/mocks';
import { stubbedSavedObjectIndexPattern } from '../../../../../fixtures/stubbed_saved_object_index_pattern';
import { UiSettingsCommon, SavedObjectsClientCommon, SavedObject } from '../types';
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

describe('IndexPatterns', () => {
  let indexPatterns: IndexPatternsService;
  let newService: (apiClient?: any) => IndexPatternsService;
  let onNotification: jest.Mock;
  let savedObjectsClient: SavedObjectsClientCommon;
  const uiSettingsGet = jest.fn();

  beforeEach(() => {
    const indexPatternObj = { id: 'id', version: 'a', attributes: { title: 'title' } };
    savedObjectsClient = {} as SavedObjectsClientCommon;
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

    onNotification = jest.fn();
    newService = (apiClient: any = createFieldsFetcher()) =>
      new IndexPatternsService({
        uiSettings: {
          get: uiSettingsGet,
          getAll: () => {},
        } as any as UiSettingsCommon,
        savedObjectsClient: savedObjectsClient as unknown as SavedObjectsClientCommon,
        apiClient,
        fieldFormats,
        onNotification,
        onError: () => {},
        onRedirectNoIndexPattern: () => {},
        onUnsupportedTimePattern: () => {},
      });

    indexPatterns = newService();
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

  test('refreshes a stale field list when timeFieldName is missing from it', async () => {
    const id = 'stale-time-field';
    // What an index-pattern saved object looks like after being imported from
    // another cluster, or cached before the time-series mappings existed: the
    // time field it names is absent from its own cached field list.
    setDocsourcePayload(id, {
      id,
      version: 'v1',
      attributes: {
        title: 'metrics-index',
        timeFieldName: '@timestamp',
        fields: JSON.stringify([
          { name: '_id', type: 'string', aggregatable: false, searchable: true },
          { name: '_index', type: 'string', aggregatable: true, searchable: true },
        ]),
      },
    });
    const apiClient = createFieldsFetcher();
    apiClient.getFieldsForWildcard = jest.fn().mockResolvedValue([
      { name: '@timestamp', type: 'date', aggregatable: true, searchable: true },
      { name: 'host', type: 'string', aggregatable: true, searchable: true },
    ]);
    indexPatterns = newService(apiClient);

    const indexPattern = await indexPatterns.get(id);

    // Without reconciliation the agg/time-filter paths see no @timestamp, which
    // blanks dashboard panels and silently drops the time range filter.
    expect(apiClient.getFieldsForWildcard).toHaveBeenCalled();
    expect(indexPattern.getTimeField()).toBeDefined();
    expect(indexPattern.getFieldByName('@timestamp')).toBeDefined();
  });

  test('does not refresh when the cached field list already has the time field', async () => {
    const id = 'fresh-time-field';
    setDocsourcePayload(id, {
      id,
      version: 'v1',
      attributes: {
        title: 'metrics-index',
        timeFieldName: '@timestamp',
        fields: JSON.stringify([
          { name: '@timestamp', type: 'date', aggregatable: true, searchable: true },
        ]),
      },
    });
    const apiClient = createFieldsFetcher();
    apiClient.getFieldsForWildcard = jest.fn().mockResolvedValue([]);
    indexPatterns = newService(apiClient);

    await indexPatterns.get(id);

    // Refreshing on every get() would add a field-caps round trip to every
    // dashboard load, so it must only happen on a real mismatch.
    expect(apiClient.getFieldsForWildcard).not.toHaveBeenCalled();
  });

  test('does not refresh a pattern with no time field at all', async () => {
    const id = 'no-time-field';
    setDocsourcePayload(id, {
      id,
      version: 'v1',
      attributes: { title: 'logs-*', fields: JSON.stringify([]) },
    });
    const apiClient = createFieldsFetcher();
    apiClient.getFieldsForWildcard = jest.fn().mockResolvedValue([]);
    indexPatterns = newService(apiClient);

    await indexPatterns.get(id);

    expect(apiClient.getFieldsForWildcard).not.toHaveBeenCalled();
  });

  test('reports an actionable message when the time field is absent from the index', async () => {
    const id = 'absent-time-field';
    // Shape seen on a time series collection that defaulted its time field to
    // @timestamp while the documents carry a different one: the field is not
    // stale in the snapshot, it does not exist upstream either.
    setDocsourcePayload(id, {
      id,
      version: 'v1',
      attributes: {
        title: 'ocsf-test',
        timeFieldName: '@timestamp',
        fields: JSON.stringify([
          { name: 'time_dt', type: 'date', aggregatable: true, searchable: true },
        ]),
      },
    });
    const apiClient = createFieldsFetcher();
    apiClient.getFieldsForWildcard = jest
      .fn()
      .mockResolvedValue([{ name: 'time_dt', type: 'date', aggregatable: true, searchable: true }]);
    indexPatterns = newService(apiClient);

    const indexPattern = await indexPatterns.get(id);

    // Refresh cannot invent the field, so the user is told instead of being
    // left with an opaque aggregation failure.
    expect(indexPattern.getTimeField()).toBeUndefined();
    expect(onNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('@timestamp'),
        text: expect.stringContaining('date fields'),
        color: 'warning',
      })
    );
  });

  test('reports the missing time field once, not once per resolver', async () => {
    const id = 'absent-once';
    setDocsourcePayload(id, {
      id,
      version: 'v1',
      attributes: {
        title: 'ocsf-test',
        timeFieldName: '@timestamp',
        fields: JSON.stringify([{ name: 'time_dt', type: 'date' }]),
      },
    });
    const apiClient = createFieldsFetcher();
    apiClient.getFieldsForWildcard = jest
      .fn()
      .mockResolvedValue([{ name: 'time_dt', type: 'date' }]);
    indexPatterns = newService(apiClient);

    // Several components resolve the same pattern around first render.
    await Promise.all([indexPatterns.get(id), indexPatterns.get(id), indexPatterns.get(id)]);
    indexPatterns.clearCache(id);
    await indexPatterns.get(id);

    // Once for the concurrent burst, once after the cache was explicitly
    // cleared -- never one per caller.
    expect(onNotification).toHaveBeenCalledTimes(2);
  });

  test('does not report when a refresh repairs the field list', async () => {
    const id = 'repairable';
    setDocsourcePayload(id, {
      id,
      version: 'v1',
      attributes: {
        title: 'metrics-index',
        timeFieldName: '@timestamp',
        fields: JSON.stringify([{ name: '_id', type: 'string' }]),
      },
    });
    const apiClient = createFieldsFetcher();
    apiClient.getFieldsForWildcard = jest
      .fn()
      .mockResolvedValue([
        { name: '@timestamp', type: 'date', aggregatable: true, searchable: true },
      ]);
    indexPatterns = newService(apiClient);

    const indexPattern = await indexPatterns.get(id);

    expect(indexPattern.getTimeField()).toBeDefined();
    expect(onNotification).not.toHaveBeenCalled();
  });

  test('savedObjectCache pre-fetches fields required for source compatibility filtering', async () => {
    expect(await indexPatterns.getIds()).toEqual(['id']);
    expect(savedObjectsClient.find).toHaveBeenCalledWith({
      type: 'index-pattern',
      fields: ['title', 'displayName', 'type'],
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

    // get() is read-only and does not trigger a save
    const pattern = await indexPatterns.get('foo');
    expect(pattern.version).toBe('foo');
    indexPatterns.clearCache();

    const samePattern = await indexPatterns.get('foo');
    expect(samePattern.version).toBe('foo');

    // First save succeeds and bumps the version
    pattern.title = 'foo2';
    await indexPatterns.updateSavedObject(pattern);
    expect(pattern.version).toBe('fooa');

    // Second save conflicts because samePattern still has the old version
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
    expect(indexPattern).toBeInstanceOf(IndexPattern);
    expect(indexPattern.title).toBe(title);
    expect(indexPatterns.refreshFields).not.toHaveBeenCalled();

    await indexPatterns.create({ title });
    expect(indexPatterns.refreshFields).toHaveBeenCalled();
  });

  test('createAndSave', async () => {
    const title = 'opensearch-dashboards-*';
    indexPatterns.createSavedObject = jest.fn();
    indexPatterns.setDefault = jest.fn();
    await indexPatterns.createAndSave({ title });
    expect(indexPatterns.createSavedObject).toHaveBeenCalled();
    expect(indexPatterns.setDefault).toHaveBeenCalled();
  });

  describe('payload too large (HTTP 413)', () => {
    const payloadTooLarge = { res: { status: 413 } };

    beforeEach(() => {
      setDocsourcePayload(null, {
        id: 'foo',
        version: 'foo',
        attributes: { title: 'big-*' },
      });
    });

    test('updateSavedObject shows a toast naming the size limit and rethrows', async () => {
      const pattern = await indexPatterns.get('foo');
      savedObjectsClient.update = jest.fn().mockRejectedValue(payloadTooLarge);

      await expect(indexPatterns.updateSavedObject(pattern)).rejects.toBe(payloadTooLarge);
      expect(onNotification).toHaveBeenCalledTimes(1);
      const toast = onNotification.mock.calls[0][0];
      expect(toast.title).toContain(pattern.title);
      expect(toast.text).toContain('server.maxPayloadBytes');
      expect(toast.color).toBe('danger');
    });

    test('updateSavedObject stays silent when ignoreErrors is set', async () => {
      const pattern = await indexPatterns.get('foo');
      savedObjectsClient.update = jest.fn().mockRejectedValue(payloadTooLarge);

      await expect(indexPatterns.updateSavedObject(pattern, 0, true)).rejects.toBe(payloadTooLarge);
      expect(onNotification).not.toHaveBeenCalled();
    });

    test('createSavedObject shows a toast and rethrows', async () => {
      const pattern = await indexPatterns.create({ title: 'new-big-*' }, true);
      savedObjectsClient.find = jest.fn().mockResolvedValue([]);
      savedObjectsClient.create = jest.fn().mockRejectedValue(payloadTooLarge);

      await expect(indexPatterns.createSavedObject(pattern)).rejects.toBe(payloadTooLarge);
      expect(onNotification).toHaveBeenCalledTimes(1);
      expect(onNotification.mock.calls[0][0].title).toContain('new-big-*');
    });

    test('other errors do not show the payload toast', async () => {
      const pattern = await indexPatterns.get('foo');
      const serverError = { res: { status: 500 } };
      savedObjectsClient.update = jest.fn().mockRejectedValue(serverError);

      await expect(indexPatterns.updateSavedObject(pattern)).rejects.toBe(serverError);
      expect(onNotification).not.toHaveBeenCalled();
    });
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
        schemaMappings: '{"otelLogs":{"traceId":"trace.id"}}',
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
        schemaMappings: '{"otelLogs":{"spanId":"span.id"}}',
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

  describe('getCache filtering', () => {
    const buildPattern = (id: string, dataSourceId?: string, datasetType?: string) => ({
      id,
      type: 'index-pattern',
      version: '1',
      attributes: { title: id, ...(datasetType && { type: datasetType }) },
      references: dataSourceId ? [{ id: dataSourceId, type: 'data-source', name: 'ds' }] : [],
    });

    const setupClientWithDataSources = (
      patterns: Array<ReturnType<typeof buildPattern>>,
      dataSourceEngineTypes: Record<string, string | undefined>
    ) => {
      savedObjectsClient.find = jest.fn(
        () => Promise.resolve(patterns) as Promise<Array<SavedObject<any>>>
      );
      const buildDsObject = (id: string) => {
        const engineType = dataSourceEngineTypes[id];
        return {
          id,
          type: 'data-source',
          version: '1',
          attributes: { title: id, ...(engineType && { dataSourceEngineType: engineType }) },
          references: [],
        } as SavedObject<any>;
      };
      // getDataSource (called from refreshSavedObjectsCache to resolve titles) uses get()
      savedObjectsClient.get = jest.fn(async (_type, id) => buildDsObject(id as string));
      // applyEngineTypeFilter uses bulkGet()
      // @ts-expect-error TS2339 bulkGet is on SavedObjectsClientCommon but not strongly typed in this mock
      savedObjectsClient.bulkGet = jest.fn(async (objs) => ({
        savedObjects: (objs as Array<{ id: string; type: string }>).map((o) => buildDsObject(o.id)),
      }));
    };

    test('returns full cache when options omitted', async () => {
      setupClientWithDataSources([buildPattern('a', 'ds-os'), buildPattern('b', 'ds-ae')], {
        'ds-os': 'OpenSearch',
        'ds-ae': 'AnalyticEngine',
      });
      const cache = await indexPatterns.getCache();
      expect(cache?.map((o) => o.id)).toEqual(['a', 'b']);
    });

    test('returns full cache when excludeEngineTypes is empty', async () => {
      setupClientWithDataSources([buildPattern('a', 'ds-os'), buildPattern('b', 'ds-ae')], {
        'ds-os': 'OpenSearch',
        'ds-ae': 'AnalyticEngine',
      });
      const cache = await indexPatterns.getCache({ excludeEngineTypes: [] });
      expect(cache?.map((o) => o.id)).toEqual(['a', 'b']);
    });

    test('excludes saved objects whose dataset type is blocked', async () => {
      setupClientWithDataSources(
        [
          buildPattern('index-pattern'),
          buildPattern('indexes-dataset', undefined, 'INDEXES'),
          buildPattern('rollup', undefined, 'rollup'),
        ],
        {}
      );
      const cache = await indexPatterns.getCache({ excludeDatasetTypes: ['INDEXES'] });
      expect(cache?.map((o) => o.id)).toEqual(['index-pattern', 'rollup']);
    });

    test('combines engine-type and dataset-type filters', async () => {
      setupClientWithDataSources(
        [
          buildPattern('supported', 'ds-os'),
          buildPattern('blocked-engine', 'ds-ae'),
          buildPattern('blocked-dataset', 'ds-os', 'INDEXES'),
        ],
        {
          'ds-os': 'OpenSearch',
          'ds-ae': 'AnalyticEngine',
        }
      );
      const cache = await indexPatterns.getCache({
        excludeEngineTypes: ['AnalyticEngine'],
        excludeDatasetTypes: ['INDEXES'],
      });
      expect(cache?.map((o) => o.id)).toEqual(['supported']);
    });

    test('excludes patterns whose data source has a blocked engine type', async () => {
      setupClientWithDataSources([buildPattern('a', 'ds-os'), buildPattern('b', 'ds-ae')], {
        'ds-os': 'OpenSearch',
        'ds-ae': 'AnalyticEngine',
      });
      const cache = await indexPatterns.getCache({ excludeEngineTypes: ['AnalyticEngine'] });
      expect(cache?.map((o) => o.id)).toEqual(['a']);
    });

    test('keeps patterns with no data-source reference', async () => {
      setupClientWithDataSources([buildPattern('local'), buildPattern('a', 'ds-ae')], {
        'ds-ae': 'AnalyticEngine',
      });
      const cache = await indexPatterns.getCache({ excludeEngineTypes: ['AnalyticEngine'] });
      expect(cache?.map((o) => o.id)).toEqual(['local']);
    });

    test('keeps patterns when bulkGet returns an error per object', async () => {
      const patterns = [buildPattern('a', 'ds-missing')];
      savedObjectsClient.find = jest.fn(
        () => Promise.resolve(patterns) as Promise<Array<SavedObject<any>>>
      );
      // getDataSource (title resolution) needs to succeed
      savedObjectsClient.get = jest.fn(async (_type, id) => ({
        id,
        type: 'data-source',
        version: '1',
        attributes: { title: id as string },
        references: [],
      })) as any;
      // bulkGet reports the SO as having an error — applyEngineTypeFilter should skip it
      // @ts-expect-error TS2339 bulkGet typing
      savedObjectsClient.bulkGet = jest.fn(async (objs) => ({
        savedObjects: (objs as Array<{ id: string; type: string }>).map((o) => ({
          id: o.id,
          type: o.type,
          attributes: {},
          references: [],
          error: { error: 'Not Found', message: 'not found', statusCode: 404 },
        })),
      }));
      const cache = await indexPatterns.getCache({ excludeEngineTypes: ['AnalyticEngine'] });
      expect(cache?.map((o) => o.id)).toEqual(['a']);
    });

    test('keeps all patterns when bulkGet itself throws', async () => {
      const patterns = [buildPattern('a', 'ds-ae')];
      savedObjectsClient.find = jest.fn(
        () => Promise.resolve(patterns) as Promise<Array<SavedObject<any>>>
      );
      savedObjectsClient.get = jest.fn(async (_type, id) => ({
        id,
        type: 'data-source',
        version: '1',
        attributes: { title: id as string },
        references: [],
      })) as any;
      // @ts-expect-error TS2339 bulkGet typing
      savedObjectsClient.bulkGet = jest.fn(async () => {
        throw new Error('network error');
      });
      const cache = await indexPatterns.getCache({ excludeEngineTypes: ['AnalyticEngine'] });
      expect(cache?.map((o) => o.id)).toEqual(['a']);
    });
  });
});

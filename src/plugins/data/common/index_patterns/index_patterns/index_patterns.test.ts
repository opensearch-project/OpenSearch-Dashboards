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

    indexPatterns = new IndexPatternsService({
      uiSettings: ({
        get: uiSettingsGet,
        getAll: () => {},
      } as any) as UiSettingsCommon,
      savedObjectsClient: (savedObjectsClient as unknown) as SavedObjectsClientCommon,
      apiClient: createFieldsFetcher(),
      fieldFormats,
      onNotification: () => {},
      onError: () => {},
      onRedirectNoIndexPattern: () => {},
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

  test('savedObjectCache pre-fetches title and displayName', async () => {
    expect(await indexPatterns.getIds()).toEqual(['id']);
    expect(savedObjectsClient.find).toHaveBeenCalledWith({
      type: 'index-pattern',
      fields: ['title', 'displayName'],
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

  describe('auto-refresh of fields', () => {
    const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

    const buildField = (name: string) => ({
      name,
      type: 'string',
      searchable: true,
      aggregatable: true,
    });

    const enableAutoRefresh = (interval: number = 300000, notify: boolean = true) => {
      uiSettingsGet.mockImplementation((key: string) => {
        if (key === UI_SETTINGS.INDEXPATTERN_AUTO_REFRESH_FIELDS) return Promise.resolve(true);
        if (key === UI_SETTINGS.INDEXPATTERN_AUTO_REFRESH_FIELDS_INTERVAL_MS) {
          return Promise.resolve(interval);
        }
        if (key === UI_SETTINGS.INDEXPATTERN_NOTIFY_ON_NEW_FIELDS) return Promise.resolve(notify);
        return Promise.resolve(undefined);
      });
    };

    const mockApi = (
      fields: Array<{ name: string; type: string; searchable: boolean; aggregatable: boolean }>
    ) => {
      const fetcher = jest.fn().mockResolvedValue(fields);
      (indexPatterns as any).apiClient.getFieldsForWildcard = fetcher;
      return fetcher;
    };

    beforeEach(() => {
      indexPatterns.clearCache();
      setDocsourcePayload('auto-id', {
        id: 'auto-id',
        version: 'v1',
        attributes: {
          title: 'auto-pattern-*',
          fields: JSON.stringify([buildField('existing')]),
        },
      });
    });

    test('does not refresh when the setting is disabled', async () => {
      uiSettingsGet.mockResolvedValue(false);
      const fetcher = mockApi([buildField('existing'), buildField('brand-new')]);

      await indexPatterns.get('auto-id');
      await flushPromises();

      expect(fetcher).not.toHaveBeenCalled();
    });

    test('refreshes fields in the background on first access', async () => {
      enableAutoRefresh();
      const fetcher = mockApi([buildField('existing')]);

      await indexPatterns.get('auto-id');
      await flushPromises();

      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    test('respects the TTL between consecutive get() calls', async () => {
      enableAutoRefresh(300000);
      const fetcher = mockApi([buildField('existing')]);

      await indexPatterns.get('auto-id');
      await flushPromises();
      await indexPatterns.get('auto-id');
      await flushPromises();

      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    test('refreshes again once the TTL has elapsed', async () => {
      enableAutoRefresh(1000);
      const fetcher = mockApi([buildField('existing')]);
      const realNow = Date.now.bind(Date);
      const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1000);

      await indexPatterns.get('auto-id');
      await flushPromises();

      nowSpy.mockImplementation(() => 3000);
      await indexPatterns.get('auto-id');
      await flushPromises();

      expect(fetcher).toHaveBeenCalledTimes(2);
      nowSpy.mockRestore();
      // Sanity check no test left a frozen clock around.
      expect(typeof realNow()).toBe('number');
    });

    test('does not persist when the field list has not changed', async () => {
      enableAutoRefresh();
      mockApi([buildField('existing')]);

      await indexPatterns.get('auto-id');
      await flushPromises();

      expect(savedObjectsClient.update).not.toHaveBeenCalled();
    });

    test('persists and notifies once when a new field is discovered', async () => {
      enableAutoRefresh();
      mockApi([buildField('existing'), buildField('brand-new')]);
      const notify = jest.fn();
      (indexPatterns as any).onNotification = notify;

      await indexPatterns.get('auto-id');
      await flushPromises();

      expect(savedObjectsClient.update).toHaveBeenCalledTimes(1);
      expect(notify).toHaveBeenCalledTimes(1);
      expect(notify.mock.calls[0][0].color).toBe('primary');
    });

    test('does not re-notify for the same pattern within a session', async () => {
      enableAutoRefresh(1);
      const fetcher = mockApi([buildField('existing'), buildField('brand-new')]);
      const notify = jest.fn();
      (indexPatterns as any).onNotification = notify;
      const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1000);

      await indexPatterns.get('auto-id');
      await flushPromises();

      nowSpy.mockImplementation(() => 5000);
      fetcher.mockResolvedValue([
        buildField('existing'),
        buildField('brand-new'),
        buildField('another-one'),
      ]);
      await indexPatterns.get('auto-id');
      await flushPromises();

      expect(notify).toHaveBeenCalledTimes(1);
      nowSpy.mockRestore();
    });

    test('get() does not block on the background refresh', async () => {
      enableAutoRefresh();
      const neverResolves = new Promise(() => {});
      (indexPatterns as any).apiClient.getFieldsForWildcard = jest
        .fn()
        .mockReturnValue(neverResolves);

      const result = await indexPatterns.get('auto-id');
      expect(result).toBeDefined();
      expect(result.id).toBe('auto-id');
    });

    test('claims the in-flight slot synchronously to coalesce concurrent invocations', () => {
      enableAutoRefresh();
      // A fetcher that never resolves keeps the work promise pending.
      (indexPatterns as any).apiClient.getFieldsForWildcard = jest
        .fn()
        .mockReturnValue(new Promise(() => {}));

      // A minimal stand-in pattern; we only invoke the private dedup entry point so it
      // doesn't need a full IndexPattern instance.
      const fakePattern: any = {
        id: 'race-id',
        title: 'race-pattern-*',
        version: 'v1',
        fields: { getAll: () => [], replaceAll: jest.fn() },
        getScriptedFields: () => [],
      };

      const p1 = (indexPatterns as any).maybeRefreshFieldsInBackground(fakePattern);
      const p2 = (indexPatterns as any).maybeRefreshFieldsInBackground(fakePattern);

      // Same promise => slot was claimed synchronously between p1 and p2.
      expect(p1).toBe(p2);
    });

    test('coalesces persistence: skips the write when another client already wrote a superset', async () => {
      enableAutoRefresh();
      // Simulate another client persisting a superset between our fetch and our write.
      (indexPatterns as any).apiClient.getFieldsForWildcard = jest
        .fn()
        .mockImplementation(async () => {
          object.version = 'v2';
          object.attributes.fields = JSON.stringify([
            buildField('existing'),
            buildField('brand-new'),
          ]);
          return [buildField('existing'), buildField('brand-new')];
        });

      await indexPatterns.get('auto-id');
      await flushPromises();

      expect(savedObjectsClient.update).not.toHaveBeenCalled();
      // The coalescer must have observed the newer saved object via an explicit get.
      // Two calls expected: one from the initial indexPatterns.get(id), one from the
      // coalescer's freshness check.
      expect((savedObjectsClient.get as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    test('coalesces persistence: still writes when the remote superset changes a field type', async () => {
      enableAutoRefresh();
      // The peer client persisted the SAME field names but with a different type for
      // `existing`. Our local fetcher still sees the canonical `string` type, so the
      // coalescer must NOT skip the write — the saved object would otherwise drift
      // from the real cluster schema.
      (indexPatterns as any).apiClient.getFieldsForWildcard = jest
        .fn()
        .mockImplementation(async () => {
          object.version = 'v2';
          object.attributes.fields = JSON.stringify([
            { ...buildField('existing'), type: 'text' },
            buildField('brand-new'),
          ]);
          return [buildField('existing'), buildField('brand-new')];
        });

      await indexPatterns.get('auto-id');
      await flushPromises();

      expect(savedObjectsClient.update).toHaveBeenCalled();
    });

    test('swallows fetcher errors without raising onError or onNotification', async () => {
      enableAutoRefresh();
      (indexPatterns as any).apiClient.getFieldsForWildcard = jest
        .fn()
        .mockRejectedValue(new Error('cluster unreachable'));
      const notify = jest.fn();
      const onError = jest.fn();
      (indexPatterns as any).onNotification = notify;
      (indexPatterns as any).onError = onError;

      await expect(indexPatterns.get('auto-id')).resolves.toBeDefined();
      await flushPromises();

      expect(notify).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(savedObjectsClient.update).not.toHaveBeenCalled();
    });
  });
});

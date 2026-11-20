/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import supertest from 'supertest';
import { UnwrapPromise } from '@osd/utility-types';
import { SavedObjectsErrorHelpers } from '../../../core/server';
import { dynamicConfigServiceMock } from '../../../core/server/mocks';
import { setupServer } from '../../../core/server/test_utils';
import { registerRoutes } from '../server/index_patterns/routes';
import { IndexPatternsService, SavedObjectsClientCommon, UiSettingsCommon } from '../common';
import { fieldFormatsMock } from '../common/field_formats/mocks';
import { IndexPatternsApiClient } from '../public/index_patterns/index_patterns/index_patterns_api_client';

/**
 * The test HTTP server accepts request bodies of at most 1 KiB, the same way
 * `server.maxPayloadBytes` limits real ones. The index pattern here has a field list several
 * times that size, so any request that carried it would fail with HTTP 413.
 */
const MAX_PAYLOAD_BYTES = 1024;
const ID = 'logs';
const FIELD_NAMES = Array.from(
  { length: 60 },
  (_, i) => `resource.attributes.service.instance.custom_attribute_${i}`
);
const fieldCapsResponse = {
  indices: ['logs-1'],
  fields: FIELD_NAMES.reduce<Record<string, object>>((fields, name) => {
    fields[name] = { keyword: { type: 'keyword', searchable: true, aggregatable: true } };
    return fields;
  }, {}),
};

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;

describe('index pattern saves with a field list larger than the request limit', () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let service: IndexPatternsService;
  // Saved object store behind both the generic saved-objects client and the routes.
  let store: { version: number; attributes: Record<string, unknown> };
  // Body sizes of every request the browser-side code sends.
  let requests: Array<{ path: string; bytes: number; status: number }>;
  let errors: Error[];
  // field_caps on the test cluster; a test can change what a refresh discovers.
  let fieldCaps: jest.Mock;

  const storedFields = () => JSON.parse(store.attributes.fields as string);

  beforeEach(async () => {
    store = { version: 0, attributes: {} };
    requests = [];
    errors = [];

    let handlerContext: SetupServerReturn['handlerContext'];
    ({ server, httpSetup, handlerContext } = await setupServer());
    const serverClient = handlerContext.savedObjects.client;
    serverClient.get.mockImplementation(async (type, id) => ({
      id,
      type,
      version: `v${store.version}`,
      attributes: { ...store.attributes },
      references: [],
    }));
    serverClient.update.mockImplementation(async (type, id, attributes, options) => {
      if (options?.version && options.version !== `v${store.version}`) {
        throw SavedObjectsErrorHelpers.createConflictError(type, id);
      }
      store = { version: store.version + 1, attributes: { ...store.attributes, ...attributes } };
      return { id, type, version: `v${store.version}`, attributes, references: [] };
    });
    fieldCaps = handlerContext.opensearch.legacy.client.callAsCurrentUser as jest.Mock;
    fieldCaps.mockResolvedValue(fieldCapsResponse);

    registerRoutes({ createRouter: () => httpSetup.createRouter('') } as any);
    await server.start({
      dynamicConfigService: dynamicConfigServiceMock.createInternalStartContract(),
    });

    // The browser's http.fetch, sent to the test server.
    const http = {
      fetch: async (
        path: string,
        { method = 'GET', query = {}, body }: { method?: string; query?: object; body?: string }
      ) => {
        const search = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) =>
          [value].flat().forEach((item) => item !== undefined && search.append(key, item))
        );
        const url = search.toString() ? `${path}?${search}` : path;
        const req = supertest(httpSetup.server.listener)
          [method === 'POST' ? 'post' : 'get'](url)
          .set('content-type', 'application/json');
        const res = await (body === undefined ? req : req.send(body));
        requests.push({ path, bytes: Buffer.byteLength(body ?? ''), status: res.status });
        if (res.status >= 400) {
          throw Object.assign(new Error(res.body.message), { res, body: res.body });
        }
        return res.body;
      },
    };

    // The generic saved-objects API. Its own route is core's; its request size is recorded here.
    const savedObjectsClient = {
      find: async () => [],
      get: (type: string, id: string) => serverClient.get(type, id),
      create: async (type: string, attributes: Record<string, unknown>) => {
        requests.push({
          path: 'create',
          bytes: Buffer.byteLength(JSON.stringify({ attributes })),
          status: 200,
        });
        store = { version: 1, attributes };
        return { id: ID, type, version: 'v1', attributes, references: [] };
      },
      update: async (
        type: string,
        id: string,
        attributes: object,
        options?: { version?: string }
      ) => {
        const bytes = Buffer.byteLength(JSON.stringify({ attributes, version: options?.version }));
        try {
          const saved = await serverClient.update(type, id, attributes, options);
          requests.push({ path: 'update', bytes, status: 200 });
          return saved;
        } catch (error) {
          requests.push({ path: 'update', bytes, status: error.output.statusCode });
          throw Object.assign(error, { res: { status: error.output.statusCode } });
        }
      },
    };

    // Two meta fields: a single one is sent as a plain query value, which the routes can't parse.
    const settings: Record<string, unknown> = { metaFields: ['_id', '_index'], defaultIndex: ID };
    service = new IndexPatternsService({
      uiSettings: { get: async (key: string) => settings[key] } as unknown as UiSettingsCommon,
      savedObjectsClient: savedObjectsClient as unknown as SavedObjectsClientCommon,
      apiClient: new IndexPatternsApiClient(http as any),
      fieldFormats: fieldFormatsMock,
      onNotification: () => {},
      onError: (error) => errors.push(error),
      onRedirectNoIndexPattern: () => {},
      onUnsupportedTimePattern: () => {},
    });
  });

  afterEach(async () => {
    await server.stop();
  });

  it('the test server rejects a request as large as the field list', async () => {
    const pattern = await service.createAndSave({ id: ID, title: 'logs-*' });
    const fieldList = JSON.stringify(pattern.fields);
    expect(Buffer.byteLength(fieldList)).toBeGreaterThan(MAX_PAYLOAD_BYTES * 4);

    const res = await supertest(httpSetup.server.listener)
      .post(`/api/index_patterns/${ID}/_update_fields`)
      .send({ attributes: { description: fieldList } });

    expect(res.status).toBe(413);
  });

  it('creates, edits and refreshes the pattern without uploading the field list', async () => {
    const pattern = await service.createAndSave({ id: ID, title: 'logs-*' });
    expect(storedFields()).toHaveLength(FIELD_NAMES.length + 2);

    pattern.displayName = 'Logs';
    await service.updateSavedObject(pattern);

    pattern.fields.getByName(FIELD_NAMES[0])!.count++;
    await service.updateSavedObject(pattern);

    await pattern.addScriptedField('attribute_length', "doc['_id'].size()", 'number');
    pattern.fieldFormatMap.attribute_length = { toJSON: () => ({ id: 'number' }) };
    await service.updateSavedObject(pattern);

    await service.refreshFieldsAndSave(pattern);

    pattern.removeScriptedField('attribute_length');
    await service.updateSavedObject(pattern);

    expect(errors).toEqual([]);
    expect(requests.every(({ status }) => status === 200)).toBe(true);
    expect(Math.max(...requests.map(({ bytes }) => bytes))).toBeLessThan(MAX_PAYLOAD_BYTES);

    expect(store.attributes.displayName).toBe('Logs');
    expect(JSON.parse(store.attributes.fieldFormatMap as string)).toEqual({
      attribute_length: { id: 'number' },
    });
    expect(storedFields().find(({ name }: { name: string }) => name === FIELD_NAMES[0]).count).toBe(
      1
    );
    expect(storedFields().some(({ name }: { name: string }) => name === 'attribute_length')).toBe(
      false
    );
  });

  it('keeps a change saved elsewhere when a save conflicts', async () => {
    const pattern = await service.createAndSave({ id: ID, title: 'logs-*' });
    store = {
      version: store.version + 1,
      attributes: { ...store.attributes, description: 'saved elsewhere' },
    };

    pattern.fields.getByName(FIELD_NAMES[1])!.count++;
    await service.updateSavedObject(pattern);

    expect(errors).toEqual([]);
    expect(store.attributes.description).toBe('saved elsewhere');
    expect(storedFields().find(({ name }: { name: string }) => name === FIELD_NAMES[1]).count).toBe(
      1
    );
    expect(Math.max(...requests.map(({ bytes }) => bytes))).toBeLessThan(MAX_PAYLOAD_BYTES);
  });

  describe('a scripted field with the name of a mapped field', () => {
    interface StoredField {
      name: string;
      scripted?: boolean;
      script?: string;
    }
    const entries = (name: string) =>
      storedFields().filter((field: StoredField) => field.name === name);
    const scriptedEntry = (script: string) => expect.objectContaining({ scripted: true, script });

    it('is saved in place of the mapped field', async () => {
      const pattern = await service.createAndSave({ id: ID, title: 'logs-*' });
      const name = FIELD_NAMES[0];

      await pattern.addScriptedField(name, 'return 1;', 'number');
      await service.updateSavedObject(pattern);

      expect(errors).toEqual([]);
      expect(entries(name)).toEqual([scriptedEntry('return 1;')]);
      expect(storedFields()).toHaveLength(FIELD_NAMES.length + 2);
    });

    it('can be edited after a refresh discovers a field with its name', async () => {
      const pattern = await service.createAndSave({ id: ID, title: 'logs-*' });
      await pattern.addScriptedField('added_later', 'return 1;', 'number');
      await service.updateSavedObject(pattern);
      fieldCaps.mockResolvedValue({
        ...fieldCapsResponse,
        fields: {
          ...fieldCapsResponse.fields,
          added_later: { keyword: { type: 'keyword', searchable: true, aggregatable: true } },
        },
      });

      await service.refreshFieldsAndSave(pattern);
      expect(entries('added_later')).toEqual([scriptedEntry('return 1;')]);

      pattern.fields.update({
        ...pattern.fields.getByName('added_later')!.spec,
        script: 'return 2;',
      });
      await service.updateSavedObject(pattern);

      expect(errors).toEqual([]);
      expect(entries('added_later')).toEqual([scriptedEntry('return 2;')]);
    });

    it('keeps the mapped field when an earlier save put it after the scripted one', async () => {
      await service.createAndSave({ id: ID, title: 'logs-*' });
      const name = FIELD_NAMES[0];
      store.attributes.fields = JSON.stringify([
        {
          name,
          type: 'number',
          script: 'return 1;',
          lang: 'painless',
          scripted: true,
          searchable: true,
          aggregatable: true,
          count: 0,
        },
        ...storedFields(),
      ]);
      service.clearCache(ID);
      const pattern = await service.get(ID);
      expect(pattern.fields.getByName(name)!.scripted).toBe(false);

      await pattern.addScriptedField('unrelated', 'return 3;', 'number');
      await service.updateSavedObject(pattern);

      expect(errors).toEqual([]);
      expect(entries(name)).toEqual([expect.objectContaining({ scripted: false })]);
      expect(entries('unrelated')).toEqual([scriptedEntry('return 3;')]);
    });

    it('can be edited when an earlier save kept both entries', async () => {
      await service.createAndSave({ id: ID, title: 'logs-*' });
      const name = FIELD_NAMES[0];
      store.attributes.fields = JSON.stringify([
        ...storedFields(),
        {
          name,
          type: 'number',
          script: 'return 1;',
          lang: 'painless',
          scripted: true,
          searchable: true,
          aggregatable: true,
          count: 0,
        },
      ]);
      service.clearCache(ID);
      const pattern = await service.get(ID);

      pattern.fields.update({ ...pattern.fields.getByName(name)!.spec, script: 'return 2;' });
      await service.updateSavedObject(pattern);

      expect(errors).toEqual([]);
      expect(entries(name)).toEqual([scriptedEntry('return 2;')]);
    });
  });
});

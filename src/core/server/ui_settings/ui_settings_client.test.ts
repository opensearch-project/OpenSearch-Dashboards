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

import Chance from 'chance';
import { schema } from '@osd/config-schema';

import { loggingSystemMock } from '../logging/logging_system.mock';
import { createOrUpgradeSavedConfigMock } from './create_or_upgrade_saved_config/create_or_upgrade_saved_config.test.mock';

import { SavedObjectsClient } from '../saved_objects';
import { savedObjectsClientMock } from '../saved_objects/service/saved_objects_client.mock';
import { UiSettingsClient } from './ui_settings_client';
import { CannotOverrideError } from './ui_settings_errors';

const logger = loggingSystemMock.create().get();

const TYPE = 'config';
const ID = 'opensearch-dashboards-version';
const BUILD_NUM = 1234;
const chance = new Chance();

interface SetupOptions {
  defaults?: Record<string, any>;
  opensearchDocSource?: Record<string, any>;
  overrides?: Record<string, any>;
}

describe('ui settings', () => {
  function setup(options: SetupOptions = {}) {
    const { defaults = {}, overrides = {}, opensearchDocSource = {} } = options;

    const savedObjectsClient = savedObjectsClientMock.create();
    savedObjectsClient.get.mockReturnValue({ attributes: opensearchDocSource } as any);

    const uiSettings = new UiSettingsClient({
      type: TYPE,
      id: ID,
      buildNum: BUILD_NUM,
      defaults,
      savedObjectsClient,
      overrides,
      log: logger,
    });

    const createOrUpgradeSavedConfig = createOrUpgradeSavedConfigMock;

    return {
      uiSettings,
      savedObjectsClient,
      createOrUpgradeSavedConfig,
    };
  }

  afterEach(() => jest.clearAllMocks());

  describe('#setMany()', () => {
    it('returns a promise', () => {
      const { uiSettings } = setup();
      expect(uiSettings.setMany({ a: 'b' })).toBeInstanceOf(Promise);
    });

    it('updates a single value in one operation', async () => {
      const { uiSettings, savedObjectsClient } = setup();
      await uiSettings.setMany({ one: 'value' });

      expect(savedObjectsClient.update).toHaveBeenCalledTimes(1);
      expect(savedObjectsClient.update).toHaveBeenCalledWith(TYPE, ID, { one: 'value' });
    });

    it('updates several values in one operation', async () => {
      const { uiSettings, savedObjectsClient } = setup();
      await uiSettings.setMany({ one: 'value', another: 'val' });

      expect(savedObjectsClient.update).toHaveBeenCalledTimes(1);
      expect(savedObjectsClient.update).toHaveBeenCalledWith(TYPE, ID, {
        one: 'value',
        another: 'val',
      });
    });

    it('automatically creates the savedConfig if it is missing', async () => {
      const { uiSettings, savedObjectsClient, createOrUpgradeSavedConfig } = setup();
      savedObjectsClient.update
        .mockRejectedValueOnce(SavedObjectsClient.errors.createGenericNotFoundError())
        .mockResolvedValueOnce({} as any);

      await uiSettings.setMany({ foo: 'bar' });

      expect(savedObjectsClient.update).toHaveBeenCalledTimes(2);
      expect(createOrUpgradeSavedConfig).toHaveBeenCalledTimes(1);
      expect(createOrUpgradeSavedConfig).toHaveBeenCalledWith(
        expect.objectContaining({ handleWriteErrors: false })
      );
    });

    it('only tried to auto create once and throws NotFound', async () => {
      const { uiSettings, savedObjectsClient, createOrUpgradeSavedConfig } = setup();
      savedObjectsClient.update.mockRejectedValue(
        SavedObjectsClient.errors.createGenericNotFoundError()
      );

      try {
        await uiSettings.setMany({ foo: 'bar' });
        throw new Error('expected setMany to throw a NotFound error');
      } catch (error) {
        expect(SavedObjectsClient.errors.isNotFoundError(error)).toBe(true);
      }

      expect(savedObjectsClient.update).toHaveBeenCalledTimes(2);
      expect(createOrUpgradeSavedConfig).toHaveBeenCalledTimes(1);
      expect(createOrUpgradeSavedConfig).toHaveBeenCalledWith(
        expect.objectContaining({ handleWriteErrors: false })
      );
    });

    it('throws CannotOverrideError if the key is overridden', async () => {
      const { uiSettings } = setup({
        overrides: {
          foo: 'bar',
        },
      });

      try {
        await uiSettings.setMany({
          bar: 'box',
          foo: 'baz',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(CannotOverrideError);
        expect(error.message).toBe('Unable to update "foo" because it is overridden');
      }
    });

    it('validates value if a schema presents', async () => {
      const defaults = { foo: { schema: schema.string() } };
      const { uiSettings, savedObjectsClient } = setup({ defaults });

      await expect(
        uiSettings.setMany({
          bar: 2,
          foo: 1,
        })
      ).rejects.toMatchInlineSnapshot(
        `[ValidationError: [validation [foo]]: expected value of type [string] but got [number]]`
      );

      expect(savedObjectsClient.update).toHaveBeenCalledTimes(0);
    });
  });

  describe('#set()', () => {
    it('returns a promise', () => {
      const { uiSettings } = setup();
      expect(uiSettings.set('a', 'b')).toBeInstanceOf(Promise);
    });

    it('updates single values by (key, value)', async () => {
      const { uiSettings, savedObjectsClient } = setup();
      await uiSettings.set('one', 'value');

      expect(savedObjectsClient.update).toHaveBeenCalledTimes(1);
      expect(savedObjectsClient.update).toHaveBeenCalledWith(TYPE, ID, {
        one: 'value',
      });
    });

    it('validates value if a schema presents', async () => {
      const defaults = { foo: { schema: schema.string() } };
      const { uiSettings, savedObjectsClient } = setup({ defaults });

      await expect(uiSettings.set('foo', 1)).rejects.toMatchInlineSnapshot(
        `[ValidationError: [validation [foo]]: expected value of type [string] but got [number]]`
      );

      expect(savedObjectsClient.update).toHaveBeenCalledTimes(0);
    });

    it('throws CannotOverrideError if the key is overridden', async () => {
      const { uiSettings } = setup({
        overrides: {
          foo: 'bar',
        },
      });

      try {
        await uiSettings.set('foo', 'baz');
      } catch (error) {
        expect(error).toBeInstanceOf(CannotOverrideError);
        expect(error.message).toBe('Unable to update "foo" because it is overridden');
      }
    });
  });

  describe('#remove()', () => {
    it('returns a promise', () => {
      const { uiSettings } = setup();
      expect(uiSettings.remove('one')).toBeInstanceOf(Promise);
    });

    it('removes single values by key', async () => {
      const { uiSettings, savedObjectsClient } = setup();
      await uiSettings.remove('one');

      expect(savedObjectsClient.update).toHaveBeenCalledTimes(1);
      expect(savedObjectsClient.update).toHaveBeenCalledWith(TYPE, ID, { one: null });
    });

    it('does not fail validation', async () => {
      const defaults = {
        foo: {
          schema: schema.string(),
          value: '1',
        },
      };
      const { uiSettings, savedObjectsClient } = setup({ defaults });

      await uiSettings.remove('foo');

      expect(savedObjectsClient.update).toHaveBeenCalledTimes(1);
    });

    it('throws CannotOverrideError if the key is overridden', async () => {
      const { uiSettings } = setup({
        overrides: {
          foo: 'bar',
        },
      });

      try {
        await uiSettings.remove('foo');
      } catch (error) {
        expect(error).toBeInstanceOf(CannotOverrideError);
        expect(error.message).toBe('Unable to update "foo" because it is overridden');
      }
    });
  });

  describe('#removeMany()', () => {
    it('returns a promise', () => {
      const { uiSettings } = setup();
      expect(uiSettings.removeMany(['one'])).toBeInstanceOf(Promise);
    });

    it('removes a single value', async () => {
      const { uiSettings, savedObjectsClient } = setup();
      await uiSettings.removeMany(['one']);

      expect(savedObjectsClient.update).toHaveBeenCalledTimes(1);
      expect(savedObjectsClient.update).toHaveBeenCalledWith(TYPE, ID, { one: null });
    });

    it('updates several values in one operation', async () => {
      const { uiSettings, savedObjectsClient } = setup();
      await uiSettings.removeMany(['one', 'two', 'three']);

      expect(savedObjectsClient.update).toHaveBeenCalledTimes(1);
      expect(savedObjectsClient.update).toHaveBeenCalledWith(TYPE, ID, {
        one: null,
        two: null,
        three: null,
      });
    });

    it('does not fail validation', async () => {
      const defaults = {
        foo: {
          schema: schema.string(),
          value: '1',
        },
      };
      const { uiSettings, savedObjectsClient } = setup({ defaults });

      await uiSettings.removeMany(['foo', 'bar']);

      expect(savedObjectsClient.update).toHaveBeenCalledTimes(1);
    });

    it('throws CannotOverrideError if any key is overridden', async () => {
      const { uiSettings } = setup({
        overrides: {
          foo: 'bar',
        },
      });

      try {
        await uiSettings.setMany({ baz: 'baz', foo: 'foo' });
      } catch (error) {
        expect(error).toBeInstanceOf(CannotOverrideError);
        expect(error.message).toBe('Unable to update "foo" because it is overridden');
      }
    });
  });

  describe('#getRegistered()', () => {
    it('returns the registered settings passed to the constructor', () => {
      const value = chance.word();
      const defaults = { key: { value } };
      const { uiSettings } = setup({ defaults });
      expect(uiSettings.getRegistered()).toEqual(defaults);
    });
    it('does not leak validation schema outside', () => {
      const value = chance.word();
      const defaults = { key: { value, schema: schema.string() } };
      const { uiSettings } = setup({ defaults });
      expect(uiSettings.getRegistered()).toStrictEqual({ key: { value } });
    });
  });

  describe('#getOverrideOrDefault()', () => {
    it('returns the non-overridden default settings passed within the constructor', () => {
      const value = chance.word();
      const defaults = { key: { value } };
      const { uiSettings } = setup({ defaults });
      expect(uiSettings.getOverrideOrDefault('key')).toEqual(value);
      expect(uiSettings.getOverrideOrDefault('unknown')).toBeUndefined();
    });

    it('returns the overridden settings passed within the constructor', () => {
      const value = chance.word();
      const override = chance.word();
      const defaults = { key: { value } };
      const overrides = { key: { value: override } };
      const { uiSettings } = setup({ defaults, overrides });
      expect(uiSettings.getOverrideOrDefault('key')).toEqual(override);
    });
  });

  describe('#getUserProvided()', () => {
    it('pulls user configuration from OpenSearch', async () => {
      const { uiSettings, savedObjectsClient } = setup();
      await uiSettings.getUserProvided();

      expect(savedObjectsClient.get).toHaveBeenCalledTimes(1);
      expect(savedObjectsClient.get).toHaveBeenCalledWith(TYPE, ID);
    });

    it('returns user configuration', async () => {
      const opensearchDocSource = { user: 'customized' };
      const { uiSettings } = setup({ opensearchDocSource });
      const result = await uiSettings.getUserProvided();

      expect(result).toStrictEqual({
        user: {
          userValue: 'customized',
        },
      });
    });

    it('ignores null user configuration (because default values)', async () => {
      const opensearchDocSource = { user: 'customized', usingDefault: null, something: 'else' };
      const { uiSettings } = setup({ opensearchDocSource });
      const result = await uiSettings.getUserProvided();

      expect(result).toStrictEqual({
        user: {
          userValue: 'customized',
        },
        something: {
          userValue: 'else',
        },
      });
    });

    it('ignores user-configured value if it fails validation', async () => {
      const opensearchDocSource = { user: 'foo', id: 'bar' };
      const defaults = {
        id: {
          value: 42,
          schema: schema.number(),
        },
      };
      const { uiSettings } = setup({ opensearchDocSource, defaults });
      const result = await uiSettings.getUserProvided();

      expect(result).toStrictEqual({
        user: {
          userValue: 'foo',
        },
      });

      expect(loggingSystemMock.collect(logger).warn).toMatchInlineSnapshot(`
        Array [
          Array [
            "Ignore invalid UiSettings value. ValidationError: [validation [id]]: expected value of type [number] but got [string].",
          ],
        ]
      `);
    });

    it('automatically creates the savedConfig if it is missing and returns empty object', async () => {
      const { uiSettings, savedObjectsClient, createOrUpgradeSavedConfig } = setup();
      savedObjectsClient.get = jest
        .fn()
        .mockRejectedValueOnce(SavedObjectsClient.errors.createGenericNotFoundError())
        .mockResolvedValueOnce({ attributes: {} });

      expect(await uiSettings.getUserProvided()).toStrictEqual({});

      expect(savedObjectsClient.get).toHaveBeenCalledTimes(2);

      expect(createOrUpgradeSavedConfig).toHaveBeenCalledTimes(1);
      expect(createOrUpgradeSavedConfig).toHaveBeenCalledWith(
        expect.objectContaining({ handleWriteErrors: true })
      );
    });

    it('returns result of savedConfig creation in case of notFound error', async () => {
      const { uiSettings, savedObjectsClient, createOrUpgradeSavedConfig } = setup();
      createOrUpgradeSavedConfig.mockResolvedValue({ foo: 'bar ' });
      savedObjectsClient.get.mockRejectedValue(
        SavedObjectsClient.errors.createGenericNotFoundError()
      );

      expect(await uiSettings.getUserProvided()).toStrictEqual({ foo: { userValue: 'bar ' } });
    });

    it('returns an empty object on Forbidden responses', async () => {
      const { uiSettings, savedObjectsClient, createOrUpgradeSavedConfig } = setup();

      const error = SavedObjectsClient.errors.decorateForbiddenError(new Error());
      savedObjectsClient.get.mockRejectedValue(error);

      expect(await uiSettings.getUserProvided()).toStrictEqual({});
      expect(createOrUpgradeSavedConfig).toHaveBeenCalledTimes(0);
    });

    it('returns an empty object on OpenSearchUnavailable responses', async () => {
      const { uiSettings, savedObjectsClient, createOrUpgradeSavedConfig } = setup();

      const error = SavedObjectsClient.errors.decorateOpenSearchUnavailableError(new Error());
      savedObjectsClient.get.mockRejectedValue(error);

      expect(await uiSettings.getUserProvided()).toStrictEqual({});
      expect(createOrUpgradeSavedConfig).toHaveBeenCalledTimes(0);
    });

    it('throws Unauthorized errors', async () => {
      const { uiSettings, savedObjectsClient } = setup();

      const error = SavedObjectsClient.errors.decorateNotAuthorizedError(new Error());
      savedObjectsClient.get.mockRejectedValue(error);

      try {
        await uiSettings.getUserProvided();
        throw new Error('expect getUserProvided() to throw');
      } catch (err) {
        expect(err).toBe(error);
      }
    });

    it('throw when SavedObjectsClient throws in some unexpected way', async () => {
      const { uiSettings, savedObjectsClient } = setup();

      const error = new Error('unexpected');
      savedObjectsClient.get.mockRejectedValue(error);

      try {
        await uiSettings.getUserProvided();
        throw new Error('expect getUserProvided() to throw');
      } catch (err) {
        expect(err).toBe(error);
      }
    });

    it('includes overridden values for overridden keys', async () => {
      const opensearchDocSource = {
        user: 'customized',
      };

      const overrides = {
        foo: 'bar',
        baz: null,
      };

      const { uiSettings } = setup({ opensearchDocSource, overrides });
      expect(await uiSettings.getUserProvided()).toStrictEqual({
        user: {
          userValue: 'customized',
        },
        foo: {
          userValue: 'bar',
          isOverridden: true,
        },
        baz: { isOverridden: true },
      });
    });
  });

  describe('#getAll()', () => {
    it('pulls user configuration from OpenSearch', async () => {
      const opensearchDocSource = {};
      const { uiSettings, savedObjectsClient } = setup({ opensearchDocSource });
      await uiSettings.getAll();
      expect(savedObjectsClient.get).toHaveBeenCalledTimes(1);
      expect(savedObjectsClient.get).toHaveBeenCalledWith(TYPE, ID);
    });

    it('returns defaults when opensearch doc is empty', async () => {
      const opensearchDocSource = {};
      const defaults = { foo: { value: 'bar' } };
      const { uiSettings } = setup({ opensearchDocSource, defaults });
      expect(await uiSettings.getAll()).toStrictEqual({
        foo: 'bar',
      });
    });

    it('ignores user-configured value if it fails validation', async () => {
      const opensearchDocSource = { user: 'foo', id: 'bar' };
      const defaults = {
        id: {
          value: 42,
          schema: schema.number(),
        },
      };
      const { uiSettings } = setup({ opensearchDocSource, defaults });
      const result = await uiSettings.getAll();

      expect(result).toStrictEqual({
        id: 42,
        user: 'foo',
      });

      expect(loggingSystemMock.collect(logger).warn).toMatchInlineSnapshot(`
        Array [
          Array [
            "Ignore invalid UiSettings value. ValidationError: [validation [id]]: expected value of type [number] but got [string].",
          ],
        ]
      `);
    });

    it(`merges user values, including ones without defaults, into key value pairs`, async () => {
      const opensearchDocSource = {
        foo: 'user-override',
        bar: 'user-provided',
      };

      const defaults = {
        foo: {
          value: 'default',
        },
      };

      const { uiSettings } = setup({ opensearchDocSource, defaults });

      expect(await uiSettings.getAll()).toStrictEqual({
        foo: 'user-override',
        bar: 'user-provided',
      });
    });

    it('includes the values for overridden keys', async () => {
      const opensearchDocSource = {
        foo: 'user-override',
        bar: 'user-provided',
      };

      const defaults = {
        foo: {
          value: 'default',
        },
      };

      const overrides = {
        foo: 'bax',
      };

      const { uiSettings } = setup({ opensearchDocSource, defaults, overrides });

      expect(await uiSettings.getAll()).toStrictEqual({
        foo: 'bax',
        bar: 'user-provided',
      });
    });
  });

  describe('#get()', () => {
    it('pulls user configuration from OpenSearch', async () => {
      const opensearchDocSource = {};
      const { uiSettings, savedObjectsClient } = setup({ opensearchDocSource });
      await uiSettings.get('any');

      expect(savedObjectsClient.get).toHaveBeenCalledTimes(1);
      expect(savedObjectsClient.get).toHaveBeenCalledWith(TYPE, ID);
    });

    it(`returns the promised value for a key`, async () => {
      const opensearchDocSource = {};
      const defaults = { dateFormat: { value: chance.word() } };
      const { uiSettings } = setup({ opensearchDocSource, defaults });
      const result = await uiSettings.get('dateFormat');

      expect(result).toBe(defaults.dateFormat.value);
    });

    it(`returns the user-configured value for a custom key`, async () => {
      const opensearchDocSource = { custom: 'value' };
      const { uiSettings } = setup({ opensearchDocSource });
      const result = await uiSettings.get('custom');

      expect(result).toBe('value');
    });

    it(`returns the user-configured value for a modified key`, async () => {
      const opensearchDocSource = { dateFormat: 'YYYY-MM-DD' };
      const { uiSettings } = setup({ opensearchDocSource });
      const result = await uiSettings.get('dateFormat');
      expect(result).toBe('YYYY-MM-DD');
    });

    it('returns the overridden value for an overrided key', async () => {
      const opensearchDocSource = { dateFormat: 'YYYY-MM-DD' };
      const overrides = { dateFormat: 'foo' };
      const { uiSettings } = setup({ opensearchDocSource, overrides });

      expect(await uiSettings.get('dateFormat')).toBe('foo');
    });

    it('returns the overridden value for key theme:version', async () => {
      const opensearchDocSource = { 'theme:version': 'Next (preview)' };
      const overrides = { 'theme:version': 'v7' };
      const { uiSettings } = setup({ opensearchDocSource, overrides });

      expect(await uiSettings.get('theme:version')).toBe('v7');
    });

    it('returns the overridden value for key theme:version when doc source is empty', async () => {
      const opensearchDocSource = {};
      const overrides = { 'theme:version': 'v7' };
      const { uiSettings } = setup({ opensearchDocSource, overrides });

      expect(await uiSettings.get('theme:version')).toBe('v7');
    });

    it('rewrites the key theme:version value without override', async () => {
      const opensearchDocSource = { 'theme:version': 'Next (preview)' };
      const { uiSettings } = setup({ opensearchDocSource });

      expect(await uiSettings.get('theme:version')).toBe('Next (preview)');
    });

    it('returns the default value for an override with value null', async () => {
      const opensearchDocSource = { dateFormat: 'YYYY-MM-DD' };
      const overrides = { dateFormat: null };
      const defaults = { dateFormat: { value: 'foo' } };
      const { uiSettings } = setup({ opensearchDocSource, overrides, defaults });

      expect(await uiSettings.get('dateFormat')).toBe('foo');
    });

    it('returns the overridden value if the document does not exist', async () => {
      const overrides = { dateFormat: 'foo' };
      const { uiSettings, savedObjectsClient } = setup({ overrides });
      savedObjectsClient.get.mockRejectedValueOnce(
        SavedObjectsClient.errors.createGenericNotFoundError()
      );

      expect(await uiSettings.get('dateFormat')).toBe('foo');
    });

    it('returns the default value if user-configured value fails validation', async () => {
      const opensearchDocSource = { id: 'bar' };
      const defaults = {
        id: {
          value: 42,
          schema: schema.number(),
        },
      };

      const { uiSettings } = setup({ opensearchDocSource, defaults });

      expect(await uiSettings.get('id')).toBe(42);

      expect(loggingSystemMock.collect(logger).warn).toMatchInlineSnapshot(`
        Array [
          Array [
            "Ignore invalid UiSettings value. ValidationError: [validation [id]]: expected value of type [number] but got [string].",
          ],
        ]
      `);
    });
  });

  describe('#isOverridden()', () => {
    it('returns false if no overrides defined', () => {
      const { uiSettings } = setup();
      expect(uiSettings.isOverridden('foo')).toBe(false);
    });

    it('returns false if overrides defined but key is not included', () => {
      const { uiSettings } = setup({ overrides: { foo: true, bar: true } });
      expect(uiSettings.isOverridden('baz')).toBe(false);
    });

    it('returns false for object prototype properties', () => {
      const { uiSettings } = setup({ overrides: { foo: true, bar: true } });
      expect(uiSettings.isOverridden('hasOwnProperty')).toBe(false);
    });

    it('returns true if overrides defined and key is overridden', () => {
      const { uiSettings } = setup({ overrides: { foo: true, bar: true } });
      expect(uiSettings.isOverridden('bar')).toBe(true);
    });
  });
});

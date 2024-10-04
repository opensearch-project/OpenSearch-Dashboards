/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createLocalStore,
  extractVersionFromDynamicConfigIndex,
  isDynamicConfigIndex,
  mergeConfigs,
  pathToString,
} from './utils';
import { Request } from 'hapi__hapi';
import { loggerMock } from '../../logging/logger.mock';
import { DYNAMIC_APP_CONFIG_INDEX_PREFIX } from './constants';

describe('Utils', () => {
  test.each([
    {
      name: '',
      pluginConfigPath: undefined,
      expected: '',
    },
    {
      name: 'somePlugin',
      pluginConfigPath: undefined,
      expected: 'some_plugin',
    },
    {
      name: undefined,
      pluginConfigPath: '',
      expected: '',
    },
    {
      name: undefined,
      pluginConfigPath: 'someOtherPlugin',
      expected: 'someOtherPlugin',
    },
    {
      name: undefined,
      pluginConfigPath: 'some_other_plugin',
      expected: 'some_other_plugin',
    },
    {
      name: undefined,
      pluginConfigPath: ['some'],
      expected: 'some',
    },
    {
      name: undefined,
      pluginConfigPath: ['some', 'Path'],
      expected: 'some.Path',
    },
    {
      name: undefined,
      pluginConfigPath: ['some', 'path'],
      expected: 'some.path',
    },
  ])(
    'pathToString() should correctly parse name objects',
    ({ name, pluginConfigPath, expected }) => {
      const result = name
        ? pathToString({ name })
        : pathToString({ pluginConfigPath: pluginConfigPath! });
      expect(result).toBe(expected);
    }
  );

  test.each([
    {
      updatedConfig: { x: 10, y: 20 },
      oldConfig: { y: 15, z: 25 },
      finalConfig: { x: 10, y: 20, z: 25 },
    },
    {
      updatedConfig: { x: 10, y: { z: 20, w: 30 } },
      oldConfig: { x: 5, y: { z: 15, v: 25 }, q: 50 },
      finalConfig: { x: 10, y: { z: 20, v: 25, w: 30 }, q: 50 },
    },
    {
      updatedConfig: { x: [1, 2, 3], y: 20 },
      oldConfig: { x: [4, 5], y: 15 },
      finalConfig: { x: [1, 2, 3], y: 20 },
    },
    {
      updatedConfig: { x: { y: [1, 2, 3], z: 30 } },
      oldConfig: { x: { y: [4, 5], w: 25 } },
      finalConfig: { x: { y: [1, 2, 3], z: 30, w: 25 } },
    },
    {
      updatedConfig: { a: { b: { c: { d: 10 } } } },
      oldConfig: { a: { b: { c: { e: 20 } } } },
      finalConfig: { a: { b: { c: { d: 10, e: 20 } } } },
    },
    // This test case demonstrates that if updated configs have undefined fields, they will not be applied
    {
      updatedConfig: { a: null, b: undefined, c: 30 },
      oldConfig: { a: 10, b: 20, c: null },
      finalConfig: { a: null, b: 20, c: 30 },
    },
    {
      updatedConfig: {},
      oldConfig: { x: 10, y: 20 },
      finalConfig: { x: 10, y: 20 },
    },
    {
      updatedConfig: { x: 10, y: 20 },
      oldConfig: {},
      finalConfig: { x: 10, y: 20 },
    },
  ])(
    'mergeConfigs() should override all oldConfigs with newConfigs for specified fields except for undefined fields',
    ({ oldConfig, updatedConfig, finalConfig }) => {
      expect(mergeConfigs(oldConfig, updatedConfig)).toMatchObject(finalConfig);
    }
  );

  test.each([
    {
      headers: [],
      requestMock: {
        headers: {
          foo: 'bar',
        },
      },
      expectedMap: new Map(),
    },
    {
      headers: ['some-header'],
      requestMock: {
        headers: {
          'some-header': 'some-value',
          foo: 'bar',
        },
      },
      expectedMap: new Map([['some-header', 'some-value']]),
    },
    {
      headers: ['some-header'],
      requestMock: {
        headers: {
          foo: 'bar',
        },
      },
      expectedMap: new Map([['some-header', undefined]]),
    },
    {
      headers: ['some-header', 'some-other-header'],
      requestMock: {
        headers: {
          foo: 'bar',
          'some-header': 'some-value',
        },
      },
      expectedMap: new Map([
        ['some-header', 'some-value'],
        ['some-other-header', undefined],
      ]),
    },
    {
      headers: ['some-header', 'some-other-header'],
      requestMock: {
        headers: {
          foo: 'bar',
          'some-header': 'some-value',
          'some-other-header': 'some-other-value',
        },
      },
      expectedMap: new Map([
        ['some-header', 'some-value'],
        ['some-other-header', 'some-other-value'],
      ]),
    },
  ])(
    'createLocalStore() should create a local store from the following headers: $headers',
    ({ headers, requestMock, expectedMap }) => {
      const actualMap = createLocalStore(
        loggerMock.create(),
        (requestMock as unknown) as Request,
        headers
      );
      expect(actualMap.size).toEqual(expectedMap.size);
      expectedMap.forEach((value, key) => {
        expect(actualMap.get(key)).toEqual(value);
      });
    }
  );

  test.each([
    {
      index: `.sanity_check_2`,
      result: false,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_144b`,
      result: false,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_354.4`,
      result: false,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_-4`,
      result: false,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_asdfasdfasdf`,
      result: false,
    },
    {
      index: `opensearch_dashboards_dynamic_config_2`,
      result: false,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}3`,
      result: false,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}`,
      result: false,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_0`,
      result: true,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_1`,
      result: true,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_141515`,
      result: true,
    },
  ])('isDynamicConfigIndex() should return $result when index is $index', ({ index, result }) => {
    expect(isDynamicConfigIndex(index)).toBe(result);
  });

  test.each([
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_-10`,
      result: 0,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_0`,
      result: 0,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_1`,
      result: 1,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_5732`,
      result: 5732,
    },
  ])(
    'extractVersionFromDynamicConfigIndex() should extract number $result from index $index',
    ({ index, result }) => {
      expect(extractVersionFromDynamicConfigIndex(index)).toBe(result);
    }
  );
});

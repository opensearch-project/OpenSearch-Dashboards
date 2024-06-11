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

import { Field } from '../mappings';
import '../../../application/models/sense_editor/sense_editor.test.mocks';
import * as opensearch from '../../opensearch/opensearch';
import * as mappings from '../mappings';
import { createMockHttpResponse } from '../../opensearch/http_response.mock';
import { serviceContextMock } from '../../../application/contexts/services_context.mock';

describe('Mappings', () => {
  beforeEach(() => {
    mappings.clear();
  });
  afterEach(() => {
    mappings.clear();
  });

  function fc(f1: Field, f2: Field) {
    if (f1.name < f2.name) {
      return -1;
    }
    if (f1.name > f2.name) {
      return 1;
    }
    return 0;
  }

  function f(name: string, type?: string) {
    return { name, type: type || 'string' };
  }

  test('Multi fields 1.0 style', function () {
    mappings.loadMappings({
      index: {
        properties: {
          first_name: {
            type: 'string',
            index: 'analyzed',
            path: 'just_name',
            fields: {
              any_name: { type: 'string', index: 'analyzed' },
            },
          },
          last_name: {
            type: 'string',
            index: 'no',
            fields: {
              raw: { type: 'string', index: 'analyzed' },
            },
          },
        },
      },
    });

    expect(mappings.getFields('index').sort(fc)).toEqual([
      f('any_name', 'string'),
      f('first_name', 'string'),
      f('last_name', 'string'),
      f('last_name.raw', 'string'),
    ]);
  });

  test('Simple fields', function () {
    mappings.loadMappings({
      index: {
        properties: {
          str: {
            type: 'string',
          },
          number: {
            type: 'int',
          },
        },
      },
    });

    expect(mappings.getFields('index').sort(fc)).toEqual([f('number', 'int'), f('str', 'string')]);
  });

  test('Simple fields - 1.0 style', function () {
    mappings.loadMappings({
      index: {
        mappings: {
          properties: {
            str: {
              type: 'string',
            },
            number: {
              type: 'int',
            },
          },
        },
      },
    });

    expect(mappings.getFields('index').sort(fc)).toEqual([f('number', 'int'), f('str', 'string')]);
  });

  test('Nested fields', function () {
    mappings.loadMappings({
      index: {
        properties: {
          person: {
            type: 'object',
            properties: {
              name: {
                properties: {
                  first_name: { type: 'string' },
                  last_name: { type: 'string' },
                },
              },
              sid: { type: 'string', index: 'not_analyzed' },
            },
          },
          message: { type: 'string' },
        },
      },
    });

    expect(mappings.getFields('index', []).sort(fc)).toEqual([
      f('message'),
      f('person.name.first_name'),
      f('person.name.last_name'),
      f('person.sid'),
    ]);
  });

  test('Enabled fields', function () {
    mappings.loadMappings({
      index: {
        properties: {
          person: {
            type: 'object',
            properties: {
              name: {
                type: 'object',
                enabled: false,
              },
              sid: { type: 'string', index: 'not_analyzed' },
            },
          },
          message: { type: 'string' },
        },
      },
    });

    expect(mappings.getFields('index', []).sort(fc)).toEqual([f('message'), f('person.sid')]);
  });

  test('Path tests', function () {
    mappings.loadMappings({
      index: {
        properties: {
          name1: {
            type: 'object',
            path: 'just_name',
            properties: {
              first1: { type: 'string' },
              last1: { type: 'string', index_name: 'i_last_1' },
            },
          },
          name2: {
            type: 'object',
            path: 'full',
            properties: {
              first2: { type: 'string' },
              last2: { type: 'string', index_name: 'i_last_2' },
            },
          },
        },
      },
    });

    expect(mappings.getFields().sort(fc)).toEqual([
      f('first1'),
      f('i_last_1'),
      f('name2.first2'),
      f('name2.i_last_2'),
    ]);
  });

  test('Use index_name tests', function () {
    mappings.loadMappings({
      index: {
        properties: {
          last1: { type: 'string', index_name: 'i_last_1' },
        },
      },
    });

    expect(mappings.getFields().sort(fc)).toEqual([f('i_last_1')]);
  });

  test('Aliases', function () {
    mappings.loadAliases({
      test_index1: {
        aliases: {
          alias1: {},
        },
      },
      test_index2: {
        aliases: {
          alias2: {
            filter: {
              term: {
                FIELD: 'VALUE',
              },
            },
          },
          alias1: {},
        },
      },
    });
    mappings.loadMappings({
      test_index1: {
        properties: {
          last1: { type: 'string', index_name: 'i_last_1' },
        },
      },
      test_index2: {
        properties: {
          last1: { type: 'string', index_name: 'i_last_1' },
        },
      },
    });

    expect(mappings.getIndices().sort()).toEqual([
      '_all',
      'alias1',
      'alias2',
      'test_index1',
      'test_index2',
    ]);
    expect(mappings.getIndices(false).sort()).toEqual(['test_index1', 'test_index2']);
    expect((mappings.expandAliases(['alias1', 'test_index2']) as string[]).sort()).toEqual([
      'test_index1',
      'test_index2',
    ]);
    expect(mappings.expandAliases('alias2')).toEqual('test_index2');
  });

  test('Multi types', function () {
    mappings.loadMappings({
      index: {
        properties: {
          name1: {
            type: 'object',
            path: 'just_name',
            properties: {
              first1: { type: 'string' },
              last1: { type: 'string', index_name: 'i_last_1' },
            },
          },
          name2: {
            type: 'object',
            path: 'full',
            properties: {
              first2: { type: 'string' },
              last2: { type: 'string', index_name: 'i_last_2' },
            },
          },
        },
      },
    });

    expect(mappings.getTypes()).toEqual(['properties']);
  });
});

describe('Auto Complete Info', () => {
  let response = {};

  const mockHttpResponse = createMockHttpResponse(
    200,
    'ok',
    [['Content-Type', 'application/json, utf-8']],
    response
  );

  beforeEach(() => {
    mappings.clear();
    response = {
      body: {
        'sample-ecommerce': {
          mappings: {
            properties: {
              timestamp: {
                type: 'date',
              },
            },
          },
        },
      },
    };
    jest.resetAllMocks();
    jest.useFakeTimers(); // Enable automatic mocking of timers
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('Retrieve AutoComplete Info for Mappings, Aliases and Templates', async () => {
    const dataSourceId = 'mock-data-source-id';
    const sendSpy = jest.spyOn(opensearch, 'send').mockResolvedValue(mockHttpResponse);

    const {
      services: { http, settings: settingsService },
    } = serviceContextMock.create();

    mappings.retrieveAutoCompleteInfo(
      http,
      settingsService,
      {
        fields: true,
        indices: true,
        templates: true,
      },
      dataSourceId
    );

    // Fast-forward until all timers have been executed
    jest.runAllTimers();

    expect(sendSpy).toHaveBeenCalledTimes(3);

    // Ensure send is called with different arguments
    expect(sendSpy).toHaveBeenCalledWith(http, 'GET', '_mapping', null, dataSourceId);
    expect(sendSpy).toHaveBeenCalledWith(http, 'GET', '_aliases', null, dataSourceId);
    expect(sendSpy).toHaveBeenCalledWith(http, 'GET', '_template', null, dataSourceId);
  });

  test('Retrieve AutoComplete Info for Specified Fields from the Settings', async () => {
    const dataSourceId = 'mock-data-source-id';
    const sendSpy = jest.spyOn(opensearch, 'send').mockResolvedValue(mockHttpResponse);

    const {
      services: { http, settings: settingsService },
    } = serviceContextMock.create();

    mappings.retrieveAutoCompleteInfo(
      http,
      settingsService,
      {
        fields: true,
        indices: false,
        templates: false,
      },
      dataSourceId
    );

    // Fast-forward until all timers have been executed
    jest.runAllTimers();

    // Resolve the promise chain
    await Promise.resolve();

    expect(sendSpy).toHaveBeenCalledTimes(1);

    // Ensure send is called with different arguments
    expect(sendSpy).toHaveBeenCalledWith(http, 'GET', '_mapping', null, dataSourceId);
  });
});

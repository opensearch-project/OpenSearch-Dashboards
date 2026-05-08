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

import { UI_SETTINGS } from '../../../constants';
import { GetConfigFn } from '../../../types';
import { getSearchParams, getExternalSearchParamsFromRequest } from './get_search_params';

function getConfigStub(config: any = {}): GetConfigFn {
  return (key) => config[key];
}

describe('getSearchParams', () => {
  test('includes custom preference', () => {
    const config = getConfigStub({
      [UI_SETTINGS.COURIER_SET_REQUEST_PREFERENCE]: 'custom',
      [UI_SETTINGS.COURIER_CUSTOM_REQUEST_PREFERENCE]: 'aaa',
    });
    const searchParams = getSearchParams(config);
    expect(searchParams.preference).toBe('aaa');
  });
});

describe('getExternalSearchParamsFromRequest', () => {
  const getConfig = getConfigStub({});

  test('handles index with title property', () => {
    const searchRequest = {
      index: { title: 'my-index' },
      body: { query: {} },
    };
    const result = getExternalSearchParamsFromRequest(searchRequest as any, { getConfig });
    expect(result.index).toBe('my-index');
  });

  test('handles index as string', () => {
    const searchRequest = {
      index: 'my-index-string',
      body: { query: {} },
    };
    const result = getExternalSearchParamsFromRequest(searchRequest as any, { getConfig });
    expect(result.index).toBe('my-index-string');
  });

  test('handles undefined index with optional chaining', () => {
    const searchRequest = {
      index: undefined,
      body: { query: {} },
    };
    const result = getExternalSearchParamsFromRequest(searchRequest as any, { getConfig });
    expect(result.index).toBeUndefined();
  });

  test('handles null index with optional chaining', () => {
    const searchRequest = {
      index: null,
      body: { query: {} },
    };
    const result = getExternalSearchParamsFromRequest(searchRequest as any, { getConfig });
    expect(result.index).toBeNull();
  });
});

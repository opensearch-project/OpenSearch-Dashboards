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

import { renderHook, act } from '@testing-library/react-hooks';
import {
  buildSearchBody,
  useOpenSearchDocSearch,
  OpenSearchRequestState,
} from './use_opensearch_doc_search';
import { DocProps } from './doc';
import { Observable } from 'rxjs';

const mockSearchResult = new Observable();
const mockDataSearchSearch = jest.fn(() => {
  return mockSearchResult;
});

jest.mock('../../../opensearch_dashboards_services', () => ({
  getServices: () => ({
    data: {
      search: {
        search: mockDataSearchSearch,
      },
    },
  }),
}));

const mockIndexPatternService = {
  get: jest.fn(),
  isLongNumeralsSupported: jest.fn(),
} as any;

describe('Test of <Doc /> helper / hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('buildSearchBody', () => {
    const indexPattern = {
      getComputedFields: () => ({ storedFields: [], scriptFields: [], docvalueFields: [] }),
    } as any;
    const actual = buildSearchBody('1', indexPattern);
    expect(actual).toMatchInlineSnapshot(`
      Object {
        "_source": true,
        "docvalue_fields": Array [],
        "query": Object {
          "ids": Object {
            "values": Array [
              "1",
            ],
          },
        },
        "script_fields": Array [],
        "stored_fields": Array [],
      }
    `);
  });

  test('useOpenSearchDocSearch', async () => {
    const indexPattern = {
      getComputedFields: () => [],
    };
    (mockIndexPatternService.get as jest.Mock).mockResolvedValue(indexPattern);

    const props = {
      id: '1',
      index: 'index1',
      indexPatternId: 'xyz',
      indexPatternService: mockIndexPatternService,
    } as DocProps;
    let hook;
    await act(async () => {
      hook = renderHook((p: DocProps) => useOpenSearchDocSearch(p), { initialProps: props });
    });

    // @ts-ignore
    expect(hook.result.current).toEqual([OpenSearchRequestState.Loading, null, indexPattern]);
    expect(mockIndexPatternService.get).toHaveBeenCalled();
  });

  test('useOpenSearchDocSearch using withLongNumeralsSupport when configured to', async () => {
    (mockIndexPatternService.isLongNumeralsSupported as jest.Mock).mockReturnValue(
      Promise.resolve(true)
    );

    const props = {
      id: '1',
      index: 'index1',
      indexPatternId: 'xyz',
      indexPatternService: mockIndexPatternService,
    } as DocProps;

    await act(async () => {
      renderHook((p: DocProps) => useOpenSearchDocSearch(p), { initialProps: props });
    });

    expect(mockDataSearchSearch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        withLongNumeralsSupport: true,
      })
    );
  });

  test('useOpenSearchDocSearch without withLongNumeralsSupport when configured not to', async () => {
    (mockIndexPatternService.isLongNumeralsSupported as jest.Mock).mockReturnValue(
      Promise.resolve(false)
    );

    const props = {
      id: '1',
      index: 'index1',
      indexPatternId: 'xyz',
      indexPatternService: mockIndexPatternService,
    } as DocProps;

    await act(async () => {
      renderHook((p: DocProps) => useOpenSearchDocSearch(p), { initialProps: props });
    });

    expect(mockDataSearchSearch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        withLongNumeralsSupport: false,
      })
    );
  });
});

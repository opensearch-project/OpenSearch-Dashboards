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

import { Plugin, IndexPatternsContract } from '.';
import { fieldFormatsServiceMock } from './field_formats/mocks';
import { searchServiceMock } from './search/mocks';
import { queryServiceMock } from './query/mocks';
import { AutocompleteStart, AutocompleteSetup } from './autocomplete';
import { uiServiceMock } from './ui/mocks';
import { dataSourceServiceMock } from './data_sources/datasource_services/mocks';

export type Setup = jest.Mocked<ReturnType<Plugin['setup']>>;
export type Start = jest.Mocked<ReturnType<Plugin['start']>>;

const automcompleteSetupMock: jest.Mocked<AutocompleteSetup> = {
  addQuerySuggestionProvider: jest.fn(),
  getQuerySuggestions: jest.fn(),
};

const autocompleteStartMock: jest.Mocked<AutocompleteStart> = {
  getValueSuggestions: jest.fn(),
  getQuerySuggestions: jest.fn(),
  hasQuerySuggestions: jest.fn(),
};

const createSetupContract = (isEnhancementsEnabled: boolean = false): Setup => {
  const querySetupMock = queryServiceMock.createSetupContract(isEnhancementsEnabled);
  return {
    autocomplete: automcompleteSetupMock,
    search: searchServiceMock.createSetupContract(),
    fieldFormats: fieldFormatsServiceMock.createSetupContract(),
    query: querySetupMock,
    __enhance: jest.fn(),
  };
};

const createStartContract = (isEnhancementsEnabled: boolean = false): Start => {
  const queryStartMock = queryServiceMock.createStartContract(isEnhancementsEnabled);
  return {
    actions: {
      createFiltersFromValueClickAction: jest.fn().mockResolvedValue(['yes']),
      createFiltersFromRangeSelectAction: jest.fn(),
    },
    autocomplete: autocompleteStartMock,
    search: searchServiceMock.createStartContract(),
    fieldFormats: fieldFormatsServiceMock.createStartContract(),
    query: queryStartMock,
    ui: uiServiceMock.createStartContract(),
    indexPatterns: ({
      find: jest.fn((search) => [{ id: search, title: search }]),
      createField: jest.fn(() => {}),
      createFieldList: jest.fn(() => []),
      ensureDefaultIndexPattern: jest.fn(),
      make: () => ({
        fieldsFetcher: {
          fetchForWildcard: jest.fn(),
        },
      }),
      get: jest.fn().mockReturnValue(
        Promise.resolve({
          id: 'id',
          name: 'name',
          dataSourceRef: {
            id: 'id',
            type: 'datasource',
            name: 'datasource',
          },
        })
      ),
      getDefault: jest.fn().mockReturnValue(
        Promise.resolve({
          name: 'Default name',
          id: 'id',
        })
      ),
      clearCache: jest.fn(),
      create: jest.fn().mockResolvedValue({
        id: 'test-index-pattern',
        title: 'Test Index Pattern',
        type: 'INDEX_PATTERN',
      }),
      saveToCache: jest.fn(),
    } as unknown) as IndexPatternsContract,
    dataSources: dataSourceServiceMock.createStartContract(),
  };
};

export { createSearchSourceMock } from '../common/search/search_source/mocks';
export { getCalculateAutoTimeExpression } from '../common/search/aggs';

export const dataPluginMock = {
  createSetupContract,
  createStartContract,
};

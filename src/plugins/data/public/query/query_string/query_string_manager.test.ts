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

import { QueryStringManager } from './query_string_manager';
import { coreMock } from '../../../../../core/public/mocks';
import { Query } from '../../../common/query';
import { ISearchInterceptor } from '../../search';
import { DataStorage, DEFAULT_DATA } from 'src/plugins/data/common';

describe('QueryStringManager', () => {
  let service: QueryStringManager;
  let storage: DataStorage;
  let sessionStorage: DataStorage;
  let mockSearchInterceptor: jest.Mocked<ISearchInterceptor>;

  beforeEach(() => {
    storage = new DataStorage(window.localStorage, 'opensearchDashboards.');
    sessionStorage = new DataStorage(window.sessionStorage, 'opensearchDashboards.');
    mockSearchInterceptor = {} as jest.Mocked<ISearchInterceptor>;

    service = new QueryStringManager(
      storage,
      sessionStorage,
      coreMock.createSetup().uiSettings,
      mockSearchInterceptor
    );
  });

  test('getUpdates$ is a cold emits only after query changes', () => {
    const obs$ = service.getUpdates$();
    const emittedValues: Query[] = [];
    obs$.subscribe((v) => {
      emittedValues.push(v);
    });
    expect(emittedValues).toHaveLength(0);

    const newQuery = { query: 'new query', language: 'kquery' };
    service.setQuery(newQuery);
    expect(emittedValues).toHaveLength(1);
    expect(emittedValues[0]).toEqual(newQuery);

    service.setQuery({ ...newQuery });
    expect(emittedValues).toHaveLength(1);
  });

  test('getQuery returns the current query', () => {
    const initialQuery = service.getQuery();
    expect(initialQuery).toHaveProperty('query');
    expect(initialQuery).toHaveProperty('language');

    const newQuery = { query: 'test query', language: 'sql' };
    service.setQuery(newQuery);
    expect(service.getQuery()).toEqual(newQuery);
  });

  test('clearQuery resets to default query', () => {
    const newQuery = { query: 'test query', language: 'sql' };
    service.setQuery(newQuery);
    expect(service.getQuery()).toEqual(newQuery);

    service.clearQuery();
    const defaultQuery = service.getQuery();
    expect(defaultQuery).not.toEqual(newQuery);
    expect(defaultQuery.query).toBe('');
  });

  test('formatQuery handles different input types', () => {
    const stringQuery = 'test query';
    const formattedStringQuery = service.formatQuery(stringQuery);
    expect(formattedStringQuery).toHaveProperty('query', stringQuery);
    expect(formattedStringQuery).toHaveProperty('language');

    const objectQuery = { query: 'object query', language: 'sql' };
    const formattedObjectQuery = service.formatQuery(objectQuery);
    expect(formattedObjectQuery).toEqual(objectQuery);

    const formattedUndefinedQuery = service.formatQuery(undefined);
    expect(formattedUndefinedQuery).toEqual(service.getDefaultQuery());
  });

  test('clearQueryHistory clears the query history', () => {
    service.addToQueryHistory({ query: 'test query 1', language: 'sql' });
    service.addToQueryHistory({ query: 'test query 2', language: 'sql' });
    expect(service.getQueryHistory()).toHaveLength(2);

    service.clearQueryHistory();
    expect(service.getQueryHistory()).toHaveLength(0);
  });

  test('addToQueryHistory adds query to history', () => {
    const query: Query = { query: 'test query', language: 'sql' };
    service.addToQueryHistory(query);
    const history = service.getQueryHistory();
    expect(history).toHaveLength(1);
    expect(history[0]).toHaveProperty('query', query);
  });

  test('getInitialQueryByLanguage returns correct query for language', () => {
    const sqlQuery = service.getInitialQueryByLanguage('sql');
    expect(sqlQuery).toHaveProperty('language', 'sql');

    const pplQuery = service.getInitialQueryByLanguage('ppl');
    expect(pplQuery).toHaveProperty('language', 'ppl');
  });

  test('getInitialQueryByDataset returns correct query for dataset', () => {
    const dataset = {
      id: 'test-dataset',
      title: 'Test Dataset',
      type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
    };
    const query = service.getInitialQueryByDataset(dataset);
    expect(query).toHaveProperty('dataset', dataset);
  });
});

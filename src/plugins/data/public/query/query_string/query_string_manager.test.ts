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
      mockSearchInterceptor,
      coreMock.createStart().notifications
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

  describe('setQuery', () => {
    beforeEach(() => {
      // Mock dataset service and language service methods
      service.getDatasetService().getType = jest.fn().mockReturnValue({
        supportedLanguages: jest.fn(),
      });
      service.getLanguageService().getLanguage = jest.fn().mockReturnValue({
        title: 'SQL',
        getQueryString: jest.fn().mockReturnValue('SELECT * FROM table'),
      });
    });

    test('updates query when no dataset change', () => {
      const newQuery = { query: 'test query' };
      service.setQuery(newQuery);
      expect(service.getQuery().query).toBe('test query');
    });

    test('adds dataset to recent datasets when dataset changes', () => {
      const mockDataset = {
        id: 'test-id',
        title: 'Test Dataset',
        type: 'INDEX_PATTERN',
      };
      const addRecentDatasetSpy = jest.spyOn(service.getDatasetService(), 'addRecentDataset');

      service.setQuery({ dataset: mockDataset });

      expect(addRecentDatasetSpy).toHaveBeenCalledWith(mockDataset);
    });

    test('changes language when dataset does not support current language', () => {
      // Setup initial query with 'kuery' language
      service.setQuery({ query: 'test', language: 'kuery' });

      const mockDataset = {
        id: 'test-id',
        title: 'Test Dataset',
        type: 'S3',
      };

      // Mock that S3 only supports SQL
      service.getDatasetService().getType = jest.fn().mockReturnValue({
        supportedLanguages: jest.fn().mockReturnValue(['sql']),
      });

      service.setQuery({ dataset: mockDataset });

      const resultQuery = service.getQuery();
      expect(resultQuery.language).toBe('sql');
      expect(resultQuery.dataset).toBe(mockDataset);
      expect(resultQuery.query).toBe('SELECT * FROM table');
    });

    test('maintains current language when supported by new dataset', () => {
      // Setup initial query
      const initialQuery = { query: 'test', language: 'sql' };
      service.setQuery(initialQuery);

      const mockDataset = {
        id: 'test-id',
        title: 'Test Dataset',
        type: 'S3',
      };

      // Mock that dataset supports SQL
      service.getDatasetService().getType = jest.fn().mockReturnValue({
        supportedLanguages: jest.fn().mockReturnValue(['sql', 'ppl']),
      });

      service.setQuery({ dataset: mockDataset });

      const resultQuery = service.getQuery();
      expect(resultQuery.language).toBe('sql');
      expect(resultQuery.dataset).toBe(mockDataset);
    });

    test('does not trigger updates when new query equals current query', () => {
      const initialQuery = { query: 'test', language: 'sql' };
      let updateCount = 0;

      // Subscribe to updates
      service.getUpdates$().subscribe(() => {
        updateCount++;
      });

      service.setQuery(initialQuery);
      expect(updateCount).toBe(1);

      // Set same query again
      service.setQuery({ ...initialQuery });
      expect(updateCount).toBe(1); // Should not increment
    });

    test('handles undefined supportedLanguages gracefully', () => {
      service.setQuery({ query: 'test', language: 'sql' });

      const mockDataset = {
        id: 'test-id',
        title: 'Test Dataset',
        type: 'UNKNOWN',
      };

      // Mock undefined supportedLanguages
      service.getDatasetService().getType = jest.fn().mockReturnValue({
        supportedLanguages: jest.fn().mockReturnValue(undefined),
      });

      service.setQuery({ dataset: mockDataset });

      const resultQuery = service.getQuery();
      expect(resultQuery.language).toBe('sql'); // Should maintain current language
    });
  });

  describe('getInitialQuery', () => {
    const mockDataset = {
      id: 'test-dataset',
      title: 'Test Dataset',
      type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      language: 'sql',
    };

    beforeEach(() => {
      service.setQuery({
        query: 'initial query',
        language: 'kuery',
        dataset: {
          id: 'current-dataset',
          title: 'Current Dataset',
          type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        },
      });
    });

    test('returns current language query when no params provided', () => {
      const result = service.getInitialQuery();
      expect(result.language).toBe('kuery');
      expect(result.dataset).toBeDefined();
    });

    test('generates new query when both language and dataset provided', () => {
      const result = service.getInitialQuery({
        language: 'sql',
        dataset: mockDataset,
      });

      expect(result.language).toBe('sql');
      expect(result.dataset).toBe(mockDataset);
      expect(result.query).toBeDefined();
    });

    test('uses dataset preferred language when only dataset provided', () => {
      const result = service.getInitialQuery({ dataset: mockDataset });

      expect(result.language).toBe(mockDataset.language);
      expect(result.dataset).toBe(mockDataset);
      expect(result.query).toBeDefined();
    });

    test('uses current dataset when only language provided', () => {
      const currentDataset = service.getQuery().dataset;
      const result = service.getInitialQuery({ language: 'ppl' });

      expect(result.language).toBe('ppl');
      expect(result.dataset).toEqual(currentDataset);
      expect(result.query).toBeDefined();
    });

    test('getInitialQueryByLanguage returns the initial query from the dataset config if present', () => {
      service.getDatasetService().getType = jest.fn().mockReturnValue({
        supportedLanguages: jest.fn(),
        getInitialQueryString: jest.fn().mockImplementation(({ language }) => {
          switch (language) {
            case 'sql':
              return 'default sql dataset query';
            case 'ppl':
              return 'default ppl dataset query';
          }
        }),
      });

      const sqlQuery = service.getInitialQueryByLanguage('sql');
      expect(sqlQuery).toHaveProperty('query', 'default sql dataset query');

      const pplQuery = service.getInitialQueryByLanguage('ppl');
      expect(pplQuery).toHaveProperty('query', 'default ppl dataset query');
    });

    test('getInitialQueryByLanguage returns the initial query from the language config if dataset does not provide one', () => {
      service.getDatasetService().getType = jest.fn().mockReturnValue({
        supportedLanguages: jest.fn(),
      });
      service.getLanguageService().getLanguage = jest.fn().mockReturnValue({
        getQueryString: jest.fn().mockReturnValue('default-language-service-query'),
      });

      const sqlQuery = service.getInitialQueryByLanguage('sql');
      expect(sqlQuery).toHaveProperty('query', 'default-language-service-query');
    });
  });
});

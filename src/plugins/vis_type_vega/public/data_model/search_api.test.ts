/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract, SavedObjectsFindOptions } from 'opensearch-dashboards/public';
import { SearchAPI, SearchAPIDependencies } from './search_api';
import { ISearchStart } from 'src/plugins/data/public';
import { IUiSettingsClient } from 'opensearch-dashboards/public';

jest.mock('rxjs', () => ({
  combineLatest: jest.fn().mockImplementation((obj) => obj),
}));

jest.mock('../../../data/public', () => ({
  getSearchParamsFromRequest: jest.fn().mockImplementation((obj, _) => obj),
  AnalyticEngineError: class AnalyticEngineError extends Error {
    constructor() {
      super(
        'This data source uses Analytic Engine which does not support DSL queries. Use PPL-compatible features or switch to a standard OpenSearch data source.'
      );
      this.name = 'AnalyticEngineError';
    }
  },
}));

interface MockSearch {
  params?: Record<string, unknown>;
  dataSourceId?: string;
  pipe: () => {};
}

describe('SearchAPI.search', () => {
  // This will only test that searchApiParams were correctly set. As such, every other function can be mocked
  const getSearchAPI = (dataSourceEnabled: boolean) => {
    const savedObjectsClient = {} as SavedObjectsClientContract;

    const searchStartMock = {} as ISearchStart;
    searchStartMock.search = jest.fn().mockImplementation((obj, _) => {
      const mockedSearchResults = {} as MockSearch;
      mockedSearchResults.params = obj;
      mockedSearchResults.pipe = jest.fn().mockReturnValue(mockedSearchResults.params);
      return mockedSearchResults;
    });

    const uiSettings = {} as IUiSettingsClient;
    uiSettings.get = jest.fn().mockReturnValue(0);
    uiSettings.get.bind = jest.fn().mockReturnValue(0);

    const dependencies = {
      savedObjectsClient,
      dataSourceEnabled,
      search: searchStartMock,
      uiSettings,
    } as SearchAPIDependencies;
    const searchAPI = new SearchAPI(dependencies);
    searchAPI.findDataSourceIdbyName = jest.fn().mockImplementation((name) => {
      if (!dataSourceEnabled) {
        throw new Error();
      }
      if (name === 'exampleName') {
        return Promise.resolve('some-id');
      }
    });

    return searchAPI;
  };

  test('If MDS is disabled and there is no datasource, return params without datasource id', async () => {
    const searchAPI = getSearchAPI(false);
    const requests = [{ name: 'example-id' }];
    const fetchParams = (await searchAPI.search(requests)) as unknown as MockSearch[];
    expect(fetchParams[0].params).toBe(requests[0]);
    expect(fetchParams[0].hasOwnProperty('dataSourceId')).toBe(false);
  });

  test('If MDS is disabled and there is a datasource, it should throw an errorr', () => {
    const searchAPI = getSearchAPI(false);
    const requests = [{ name: 'example-id', data_source_name: 'non-existent-datasource' }];
    expect(searchAPI.search(requests)).rejects.toThrow();
  });

  test('If MDS is enabled and there is no datasource, return params without datasource id', async () => {
    const searchAPI = getSearchAPI(true);
    const requests = [{ name: 'example-id' }];
    const fetchParams = (await searchAPI.search(requests)) as unknown as MockSearch[];
    expect(fetchParams[0].params).toBe(requests[0]);
    expect(fetchParams[0].hasOwnProperty('dataSourceId')).toBe(false);
  });

  test('If MDS is enabled and there is a datasource, return params with datasource id', async () => {
    const searchAPI = getSearchAPI(true);
    const requests = [{ name: 'example-id', data_source_name: 'exampleName' }];
    const fetchParams = (await searchAPI.search(requests)) as unknown as MockSearch[];
    expect(fetchParams[0].hasOwnProperty('params')).toBe(true);
    expect(fetchParams[0].dataSourceId).toBe('some-id');
  });
});

describe('SearchAPI.findDataSourceIdbyName', () => {
  const savedObjectsClient = {} as SavedObjectsClientContract;
  savedObjectsClient.find = jest.fn().mockImplementation((query: SavedObjectsFindOptions) => {
    if (query.search === `"uniqueDataSource"`) {
      return Promise.resolve({
        total: 1,
        savedObjects: [{ id: 'some-datasource-id', attributes: { title: 'uniqueDataSource' } }],
      });
    } else if (query.search === `"duplicateDataSource"`) {
      return Promise.resolve({
        total: 2,
        savedObjects: [
          { id: 'some-datasource-id', attributes: { title: 'duplicateDataSource' } },
          { id: 'some-other-datasource-id', attributes: { title: 'duplicateDataSource' } },
        ],
      });
    } else if (query.search === `"DataSource"`) {
      return Promise.resolve({
        total: 2,
        savedObjects: [
          { id: 'some-datasource-id', attributes: { title: 'DataSource' } },
          { id: 'some-other-datasource-id', attributes: { title: 'DataSource Copy' } },
        ],
      });
    } else {
      return Promise.resolve({
        total: 0,
        savedObjects: [],
      });
    }
  });

  const getSearchAPI = (dataSourceEnabled: boolean) => {
    const dependencies = { savedObjectsClient, dataSourceEnabled } as SearchAPIDependencies;
    return new SearchAPI(dependencies);
  };

  test('If dataSource is disabled, throw error', () => {
    const searchAPI = getSearchAPI(false);
    expect(searchAPI.findDataSourceIdbyName('nonexistentDataSource')).rejects.toThrow(
      'data_source_name cannot be used because data_source.enabled is false'
    );
  });

  test('If dataSource is enabled but no matching dataSourceName, then throw error', () => {
    const searchAPI = getSearchAPI(true);
    expect(searchAPI.findDataSourceIdbyName('nonexistentDataSource')).rejects.toThrow(
      'Expected exactly 1 result for data_source_name "nonexistentDataSource" but got 0 results'
    );
  });

  test('If dataSource is enabled but multiple dataSourceNames, then throw error', () => {
    const searchAPI = getSearchAPI(true);
    expect(searchAPI.findDataSourceIdbyName('duplicateDataSource')).rejects.toThrow(
      'Expected exactly 1 result for data_source_name "duplicateDataSource" but got 2 results'
    );
  });

  test('If dataSource is enabled but only one dataSourceName, then return id', async () => {
    const searchAPI = getSearchAPI(true);
    expect(await searchAPI.findDataSourceIdbyName('uniqueDataSource')).toBe('some-datasource-id');
  });

  test('If dataSource is enabled and the dataSourceName is a prefix of another, ensure the prefix is only returned', async () => {
    const searchAPI = getSearchAPI(true);
    expect(await searchAPI.findDataSourceIdbyName('DataSource')).toBe('some-datasource-id');
  });

  test('If dataSource is AnalyticEngine, throw error', async () => {
    const savedObjectsClientWithAnalyticEngine = {} as SavedObjectsClientContract;
    savedObjectsClientWithAnalyticEngine.find = jest
      .fn()
      .mockImplementation((query: SavedObjectsFindOptions) => {
        if (query.search === `"analyticEngineDataSource"`) {
          return Promise.resolve({
            total: 1,
            savedObjects: [
              {
                id: 'ae-datasource-id',
                attributes: {
                  title: 'analyticEngineDataSource',
                  dataSourceEngineType: 'AnalyticEngine',
                },
              },
            ],
          });
        }
        return Promise.resolve({ total: 0, savedObjects: [] });
      });

    const dependencies = {
      savedObjectsClient: savedObjectsClientWithAnalyticEngine,
      dataSourceEnabled: true,
    } as SearchAPIDependencies;
    const searchAPI = new SearchAPI(dependencies);

    await expect(searchAPI.findDataSourceIdbyName('analyticEngineDataSource')).rejects.toThrow(
      'This data source uses Analytic Engine which does not support DSL queries'
    );
  });

  test('If dataSource is AnalyticEngine but the query is PPL, return id without throwing', async () => {
    const savedObjectsClientWithAnalyticEngine = {} as SavedObjectsClientContract;
    savedObjectsClientWithAnalyticEngine.find = jest
      .fn()
      .mockImplementation((query: SavedObjectsFindOptions) => {
        if (query.search === `"analyticEngineDataSource"`) {
          return Promise.resolve({
            total: 1,
            savedObjects: [
              {
                id: 'ae-datasource-id',
                attributes: {
                  title: 'analyticEngineDataSource',
                  dataSourceEngineType: 'AnalyticEngine',
                },
              },
            ],
          });
        }
        return Promise.resolve({ total: 0, savedObjects: [] });
      });

    const dependencies = {
      savedObjectsClient: savedObjectsClientWithAnalyticEngine,
      dataSourceEnabled: true,
    } as SearchAPIDependencies;
    const searchAPI = new SearchAPI(dependencies);

    // AnalyticEngine supports PPL, so a PPL query must not be blocked.
    expect(await searchAPI.findDataSourceIdbyName('analyticEngineDataSource', true)).toBe(
      'ae-datasource-id'
    );
  });

  test('If dataSource is not AnalyticEngine, return id normally', async () => {
    const savedObjectsClientWithOpenSearch = {} as SavedObjectsClientContract;
    savedObjectsClientWithOpenSearch.find = jest
      .fn()
      .mockImplementation((query: SavedObjectsFindOptions) => {
        if (query.search === `"openSearchDataSource"`) {
          return Promise.resolve({
            total: 1,
            savedObjects: [
              {
                id: 'os-datasource-id',
                attributes: {
                  title: 'openSearchDataSource',
                  dataSourceEngineType: 'OpenSearch',
                },
              },
            ],
          });
        }
        return Promise.resolve({ total: 0, savedObjects: [] });
      });

    const dependencies = {
      savedObjectsClient: savedObjectsClientWithOpenSearch,
      dataSourceEnabled: true,
    } as SearchAPIDependencies;
    const searchAPI = new SearchAPI(dependencies);

    expect(await searchAPI.findDataSourceIdbyName('openSearchDataSource')).toBe('os-datasource-id');
  });
});

describe('SearchAPI.searchPromQL', () => {
  const mockResponse = { body: { fields: [{ name: 'Time', values: [1000] }] } };

  const makeResponderMock = () => ({
    json: jest.fn().mockReturnThis(),
    ok: jest.fn(),
    error: jest.fn(),
  });

  const makeInspectorMock = () => {
    const responder = makeResponderMock();
    return {
      inspectorAdapters: { requests: { start: jest.fn(() => responder) } },
      responder,
    };
  };

  const getSearchAPI = ({
    httpResponse = Promise.resolve(mockResponse),
    abortSignal,
    inspectorAdapters,
  }: {
    httpResponse?: Promise<unknown>;
    abortSignal?: AbortSignal;
    inspectorAdapters?: object;
  } = {}) => {
    const httpMock = { post: jest.fn(() => httpResponse) };
    const dependencies = {
      http: httpMock,
      savedObjectsClient: {} as SavedObjectsClientContract,
      dataSourceEnabled: false,
    } as unknown as SearchAPIDependencies;
    return {
      searchAPI: new SearchAPI(dependencies, abortSignal, inspectorAdapters as any),
      httpMock,
    };
  };

  test('makes a POST to the PromQL endpoint with the serialized request body', async () => {
    const { searchAPI, httpMock } = getSearchAPI();
    const requestBody = { query: { query: 'up', language: 'PROMQL' } };

    const result = await searchAPI.searchPromQL('my-request', requestBody);

    expect(httpMock.post).toHaveBeenCalledTimes(1);
    const [path, options] = httpMock.post.mock.calls[0];
    expect(path).toBe('/api/enhancements/search/promql');
    expect(JSON.parse(options.body)).toEqual(requestBody);
    expect(result).toEqual(mockResponse);
  });

  test('forwards the abort signal to the HTTP call', async () => {
    const controller = new AbortController();
    const { searchAPI, httpMock } = getSearchAPI({ abortSignal: controller.signal });

    await searchAPI.searchPromQL('req', {});

    expect(httpMock.post.mock.calls[0][1].signal).toBe(controller.signal);
  });

  test('registers an inspector request, records the body, and marks it ok on success', async () => {
    const { inspectorAdapters, responder } = makeInspectorMock();
    const { searchAPI } = getSearchAPI({ inspectorAdapters });
    const requestBody = { query: { query: 'up' } };

    await searchAPI.searchPromQL('my-request', requestBody);

    expect(inspectorAdapters.requests.start).toHaveBeenCalledWith('my-request', {
      name: 'my-request',
    });
    expect(responder.json).toHaveBeenCalledWith(requestBody);
    expect(responder.ok).toHaveBeenCalledWith({ json: mockResponse });
    expect(responder.error).not.toHaveBeenCalled();
  });

  test('marks the inspector request as error and re-throws on HTTP failure', async () => {
    const networkError = new Error('connection refused');
    const { inspectorAdapters, responder } = makeInspectorMock();
    const { searchAPI } = getSearchAPI({
      httpResponse: Promise.reject(networkError),
      inspectorAdapters,
    });

    await expect(searchAPI.searchPromQL('req', {})).rejects.toThrow('connection refused');
    expect(responder.error).toHaveBeenCalledWith({ json: { error: networkError } });
    expect(responder.ok).not.toHaveBeenCalled();
  });
});

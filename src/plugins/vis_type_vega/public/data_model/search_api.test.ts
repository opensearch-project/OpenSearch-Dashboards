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
    const fetchParams = ((await searchAPI.search(requests)) as unknown) as MockSearch[];
    expect(fetchParams[0].params).toBe(requests[0]);
    expect(fetchParams[0].hasOwnProperty('dataSourceId')).toBe(false);
  });

  test('If MDS is disabled and there is a datasource, it should throw an errorr', () => {
    const searchAPI = getSearchAPI(false);
    const requests = [{ name: 'example-id', data_source_name: 'non-existent-datasource' }];
    expect(searchAPI.search(requests)).rejects.toThrowError();
  });

  test('If MDS is enabled and there is no datasource, return params without datasource id', async () => {
    const searchAPI = getSearchAPI(true);
    const requests = [{ name: 'example-id' }];
    const fetchParams = ((await searchAPI.search(requests)) as unknown) as MockSearch[];
    expect(fetchParams[0].params).toBe(requests[0]);
    expect(fetchParams[0].hasOwnProperty('dataSourceId')).toBe(false);
  });

  test('If MDS is enabled and there is a datasource, return params with datasource id', async () => {
    const searchAPI = getSearchAPI(true);
    const requests = [{ name: 'example-id', data_source_name: 'exampleName' }];
    const fetchParams = ((await searchAPI.search(requests)) as unknown) as MockSearch[];
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
    expect(searchAPI.findDataSourceIdbyName('nonexistentDataSource')).rejects.toThrowError(
      'data_source_name cannot be used because data_source.enabled is false'
    );
  });

  test('If dataSource is enabled but no matching dataSourceName, then throw error', () => {
    const searchAPI = getSearchAPI(true);
    expect(searchAPI.findDataSourceIdbyName('nonexistentDataSource')).rejects.toThrowError(
      'Expected exactly 1 result for data_source_name "nonexistentDataSource" but got 0 results'
    );
  });

  test('If dataSource is enabled but multiple dataSourceNames, then throw error', () => {
    const searchAPI = getSearchAPI(true);
    expect(searchAPI.findDataSourceIdbyName('duplicateDataSource')).rejects.toThrowError(
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
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract, SavedObjectsFindOptions } from 'opensearch-dashboards/public';
import { SearchAPI, SearchAPIDependencies } from './search_api';

describe('SearchAPI.findDataSourceId', () => {
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

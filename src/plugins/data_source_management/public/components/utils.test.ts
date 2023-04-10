/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSingleDataSource,
  deleteDataSourceById,
  deleteMultipleDataSources,
  getDataSourceById,
  getDataSources,
  isValidUrl,
  testConnection,
  updateDataSourceById,
} from './utils';
import { coreMock } from '../../../../core/public/mocks';
import {
  getDataSourceByIdWithCredential,
  getDataSourceByIdWithoutCredential,
  getDataSourcesResponse,
  getMappedDataSources,
  mockDataSourceAttributesWithAuth,
  mockErrorResponseForSavedObjectsCalls,
  mockResponseForSavedObjectsCalls,
} from '../mocks';
import { AuthType } from '../types';
import { HttpStart } from 'opensearch-dashboards/public';

const { savedObjects } = coreMock.createStart();

describe('DataSourceManagement: Utils.ts', () => {
  describe('Get data source', () => {
    test('Success: getting data sources', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'find', getDataSourcesResponse);
      const fetchDataSources = await getDataSources(savedObjects.client);
      expect(fetchDataSources.length).toBe(getDataSourcesResponse.savedObjects.length);
    });
    test('Success but no data sources found: getting data sources', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'find', {});
      const fetchDataSources = await getDataSources(savedObjects.client);
      expect(fetchDataSources.length).toBe(0);
    });
    test('failure: getting data sources', async () => {
      try {
        mockErrorResponseForSavedObjectsCalls(savedObjects.client, 'find');
        await getDataSources(savedObjects.client);
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });
  });

  describe('Get data source by ID', () => {
    test('Success: getting data source by ID with credential', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'get', getDataSourceByIdWithCredential);
      const dsById = await getDataSourceById('alpha-test', savedObjects.client);
      expect(dsById.title).toBe('alpha-test');
      expect(dsById.auth.type).toBe(AuthType.UsernamePasswordType);
    });
    test('Success: getting data source by ID without credential', async () => {
      mockResponseForSavedObjectsCalls(
        savedObjects.client,
        'get',
        getDataSourceByIdWithoutCredential
      );
      const dsById = await getDataSourceById('alpha-test', savedObjects.client);
      expect(dsById.title).toBe('alpha-test');
      expect(dsById.auth.type).toBe(AuthType.NoAuth);
    });
    test('Success but no data: getting data source by ID without credential', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'get', {});
      const dsById = await getDataSourceById('alpha-test', savedObjects.client);
      expect(dsById?.description).toBe('');
    });
    test('failure: getting data source by ID', async () => {
      try {
        mockErrorResponseForSavedObjectsCalls(savedObjects.client, 'get');
        await getDataSourceById('alpha-test', savedObjects.client);
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });
  });

  describe('Create data source', () => {
    test('Success: creating data source', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'create', {});
      const createDs = await createSingleDataSource(
        savedObjects.client,
        mockDataSourceAttributesWithAuth
      );
      expect(createDs).toBeTruthy();
    });
    test('failure: creating data source', async () => {
      try {
        mockErrorResponseForSavedObjectsCalls(savedObjects.client, 'create');
        await createSingleDataSource(savedObjects.client, mockDataSourceAttributesWithAuth);
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });
  });

  describe('Update data source by id', () => {
    test('Success: updating data source', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'update', {});
      const createDs = await updateDataSourceById(
        savedObjects.client,
        'ds-1234',
        mockDataSourceAttributesWithAuth
      );
      expect(createDs).toBeTruthy();
    });
    test('failure: updating data sources', async () => {
      try {
        mockErrorResponseForSavedObjectsCalls(savedObjects.client, 'update');
        await updateDataSourceById(
          savedObjects.client,
          'ds-1234',
          mockDataSourceAttributesWithAuth
        );
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });
  });

  describe('Delete data source by id', () => {
    test('Success: deleting data source', async () => {
      mockResponseForSavedObjectsCalls(savedObjects.client, 'delete', {});
      const createDs = await deleteDataSourceById('ds-1234', savedObjects.client);
      expect(createDs).toBeTruthy();
    });
    test('failure: deleting data sources', async () => {
      try {
        mockErrorResponseForSavedObjectsCalls(savedObjects.client, 'delete');
        await deleteDataSourceById('ds-1234', savedObjects.client);
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });
  });

  describe('Test connection to the endpoint of the data source - success', () => {
    let http: jest.Mocked<HttpStart>;
    const mockSuccess = jest.fn().mockResolvedValue({ body: { success: true } });
    const mockError = jest.fn().mockRejectedValue(null);
    beforeEach(() => {
      http = coreMock.createStart().http;
      http.post.mockResolvedValue(mockSuccess);
    });
    test('Success:  Test Connection to the endpoint while creating a new data source', async () => {
      await testConnection(http, getDataSourceByIdWithoutCredential.attributes);
      expect(http.post.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [
            "/internal/data-source-management/validate",
            Object {
              "body": "{\\"dataSourceAttr\\":{\\"endpoint\\":\\"https://test.com\\",\\"auth\\":{\\"type\\":\\"no_auth\\"}}}",
            },
          ],
        ]
      `);
    });

    test('Success: Test Connection to the endpoint while existing data source is updated', async () => {
      await testConnection(http, getDataSourceByIdWithoutCredential.attributes, 'test1234');
      expect(http.post.mock.calls).toMatchInlineSnapshot(`
        Array [
          Array [
            "/internal/data-source-management/validate",
            Object {
              "body": "{\\"id\\":\\"test1234\\",\\"dataSourceAttr\\":{\\"endpoint\\":\\"https://test.com\\",\\"auth\\":{\\"type\\":\\"no_auth\\"}}}",
            },
          ],
        ]
      `);
    });
    test('failure:  Test Connection to the endpoint while creating/updating a data source', async () => {
      try {
        http.post.mockRejectedValue(mockError);
        await testConnection(http, getDataSourceByIdWithoutCredential.attributes, 'test1234');
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });
  });

  describe('Delete multiple data sources by id', () => {
    test('Success: deleting multiple data source', async () => {
      try {
        mockResponseForSavedObjectsCalls(savedObjects.client, 'delete', {});
        await deleteMultipleDataSources(savedObjects.client, getMappedDataSources);
        expect(true).toBe(true); // This will be executed if multiple delete call is successful.
      } catch (e) {
        // this block should not execute as the test case name suggests
        expect(e).toBeFalsy();
      }
    });
    test('failure: deleting multiple data sources', async () => {
      try {
        mockErrorResponseForSavedObjectsCalls(savedObjects.client, 'delete');
        await deleteMultipleDataSources(savedObjects.client, getMappedDataSources);
      } catch (e) {
        expect(e).toBeTruthy();
      }
    });
  });

  test('check if url is valid', () => {
    /* False cases */
    expect(isValidUrl('')).toBeFalsy();
    expect(isValidUrl('test')).toBeFalsy();

    /* True cases */
    expect(isValidUrl('https://test.com')).toBeTruthy();
    expect(isValidUrl('http://test.com')).toBeTruthy();

    /* True cases: port number scenario*/
    expect(isValidUrl('http://192.168.1.1:1234/')).toBeTruthy();
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { opensearchServiceMock } from '../../../../core/server/mocks';
import { DataSourceConnectionValidator } from './data_source_connection_validator';
import { SigV4ServiceName } from '../../common/data_sources';

describe('DataSourceManagement: data_source_connection_validator.ts', () => {
  describe('Test datasource connection without SigV4 auth', () => {
    test('Success: opensearch client response code is 200 and response body have cluster name', async () => {
      const opensearchClient = opensearchServiceMock.createOpenSearchClient();
      opensearchClient.info.mockResolvedValue(
        opensearchServiceMock.createApiResponse({
          statusCode: 200,
          body: {
            cluster_name: 'This is the cluster name',
          },
        })
      );
      const dataSourceValidator = new DataSourceConnectionValidator(opensearchClient, {});
      const validateDataSourcesResponse = await dataSourceValidator.validate();
      expect(validateDataSourcesResponse.statusCode).toBe(200);
    });

    test('fetchDataSourceInfo - Success: opensearch client response code is 200 and response body have version number and distribution', async () => {
      const opensearchClient = opensearchServiceMock.createOpenSearchClient();
      opensearchClient.info.mockResolvedValue(
        opensearchServiceMock.createApiResponse({
          statusCode: 200,
          body: {
            version: {
              number: '2.11.0',
              distribution: 'opensearch',
            },
          },
        })
      );
      const dataSourceValidator = new DataSourceConnectionValidator(opensearchClient, {});
      const fetchDataSourcesVersionResponse = await dataSourceValidator.fetchDataSourceInfo();
      expect(fetchDataSourcesVersionResponse.dataSourceVersion).toBe('2.11.0');
      expect(fetchDataSourcesVersionResponse.dataSourceEngineType).toBe('OpenSearch');
    });

    test('fetchInstalledPlugins - Success: opensearch client response code is 200 and response body have installed plugin list', async () => {
      const opensearchClient = opensearchServiceMock.createOpenSearchClient();
      opensearchClient.info.mockResolvedValue(
        opensearchServiceMock.createApiResponse({
          statusCode: 200,
          body: [
            {
              name: 'b40f6833d895d3a95333e325e8bea79b',
              component: ' analysis-icu',
              version: '2.11.0',
            },
            {
              name: 'b40f6833d895d3a95333e325e8bea79b',
              component: 'analysis-ik',
              version: '2.11.0',
            },
            {
              name: 'b40f6833d895d3a95333e325e8bea79b',
              component: 'analysis-seunjeon',
              version: '2.11.0',
            },
          ],
        })
      );
      const dataSourceValidator = new DataSourceConnectionValidator(opensearchClient, {});
      const fetchInstalledPluginsReponse = Array.from(
        await dataSourceValidator.fetchInstalledPlugins()
      );
      const installedPlugins = ['analysis-icu', 'analysis-ik', 'analysis-seunjeon'];
      fetchInstalledPluginsReponse.map((plugin) => expect(installedPlugins).toContain(plugin));
    });

    test('failure: opensearch client response code is 200 but response body not have cluster name', async () => {
      try {
        const opensearchClient = opensearchServiceMock.createOpenSearchClient();
        opensearchClient.info.mockResolvedValue(
          opensearchServiceMock.createApiResponse({
            statusCode: 200,
            body: {
              Message: 'Response without cluster name.',
            },
          })
        );
        const dataSourceValidator = new DataSourceConnectionValidator(opensearchClient, {});
        await dataSourceValidator.validate();
      } catch (e) {
        expect(e).toBeTruthy();
        expect(e.message).toContain('Response without cluster name.');
      }
    });

    // In case fetchDataSourceInfo call succeeded yet did not return version number and distribution, return an empty info instead of raising exceptions
    test('fetchDataSourceInfo - Success:opensearch client response code is 200 but response body does not have version number', async () => {
      const opensearchClient = opensearchServiceMock.createOpenSearchClient();
      opensearchClient.info.mockResolvedValue(
        opensearchServiceMock.createApiResponse({
          statusCode: 200,
          body: {
            Message: 'Response without version number.',
          },
        })
      );
      const dataSourceValidator = new DataSourceConnectionValidator(opensearchClient, {});
      const fetchDataSourcesVersionResponse = await dataSourceValidator.fetchDataSourceInfo();
      expect(fetchDataSourcesVersionResponse.dataSourceVersion).toBe('');
      expect(fetchDataSourcesVersionResponse.dataSourceEngineType).toBe('No Engine Type Available');
    });

    test('failure: opensearch client response code is other than 200', async () => {
      const statusCodeList = [100, 202, 300, 400, 500];
      statusCodeList.forEach(async function (code) {
        try {
          const opensearchClient = opensearchServiceMock.createOpenSearchClient();
          opensearchClient.info.mockResolvedValue(
            opensearchServiceMock.createApiResponse({
              statusCode: code,
              body: {
                Message: 'Your request is not correct.',
              },
            })
          );
          const dataSourceValidator = new DataSourceConnectionValidator(opensearchClient, {});
          await dataSourceValidator.validate();
        } catch (e) {
          expect(e).toBeTruthy();
          expect(e.message).toContain('Your request is not correct.');
        }
      });
    });

    // In case fetchDataSourceInfo call failed, return an empty info instead of raising exceptions
    test('fetchDataSourceInfo - Failure: opensearch client response code is other than 200', async () => {
      const statusCodeList = [100, 202, 300, 400, 500];
      statusCodeList.forEach(async function (code) {
        const opensearchClient = opensearchServiceMock.createOpenSearchClient();
        opensearchClient.info.mockResolvedValue(
          opensearchServiceMock.createApiResponse({
            statusCode: code,
            body: {
              Message: 'Your request is not correct.',
            },
          })
        );
        const dataSourceValidator = new DataSourceConnectionValidator(opensearchClient, {});
        const fetchDataSourcesVersionResponse = await dataSourceValidator.fetchDataSourceInfo();
        expect(fetchDataSourcesVersionResponse.dataSourceVersion).toBe('');
        expect(fetchDataSourcesVersionResponse.dataSourceEngineType).toBe(
          'No Engine Type Available'
        );
      });
    });
  });

  describe('Test datasource connection for SigV4 auth', () => {
    test('Success: opensearch client response code is 200 and response body is not empty', async () => {
      const opensearchClient = opensearchServiceMock.createOpenSearchClient();
      opensearchClient.cat.indices.mockResolvedValue(opensearchServiceMock.createApiResponse());
      const dataSourceValidator = new DataSourceConnectionValidator(opensearchClient, {
        auth: {
          credentials: {
            service: SigV4ServiceName.OpenSearchServerless,
          },
        },
      });
      const validateDataSourcesResponse = await dataSourceValidator.validate();
      expect(validateDataSourcesResponse.statusCode).toBe(200);
    });

    test('Success: opensearch client response code is 200 and response body is empty', async () => {
      const opensearchClient = opensearchServiceMock.createOpenSearchClient();
      opensearchClient.cat.indices.mockResolvedValue(opensearchServiceMock.createApiResponse());
      const dataSourceValidator = new DataSourceConnectionValidator(opensearchClient, {
        auth: {
          statusCode: 200,
          body: '',
          credentials: {
            service: SigV4ServiceName.OpenSearchServerless,
          },
        },
      });
      const validateDataSourcesResponse = await dataSourceValidator.validate();
      expect(validateDataSourcesResponse.statusCode).toBe(200);
    });

    test('failure: opensearch client response code is other than 200', async () => {
      const statusCodeList = [100, 202, 300, 400, 500];
      statusCodeList.forEach(async function (code) {
        try {
          const opensearchClient = opensearchServiceMock.createOpenSearchClient();
          opensearchClient.cat.indices.mockResolvedValue(
            opensearchServiceMock.createApiResponse({
              statusCode: code,
              body: {
                Message: 'Your request is not correct.',
              },
            })
          );
          const dataSourceValidator = new DataSourceConnectionValidator(opensearchClient, {
            auth: {
              credentials: {
                service: SigV4ServiceName.OpenSearchServerless,
              },
            },
          });
          await dataSourceValidator.validate();
        } catch (e) {
          expect(e).toBeTruthy();
          expect(e.message).toContain('Your request is not correct.');
        }
      });
    });
  });
});

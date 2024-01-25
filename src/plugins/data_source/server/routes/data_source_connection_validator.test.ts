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

    test('failure: opensearch client response code is 200 and response body is empty', async () => {
      try {
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
      } catch (e) {
        expect(e).toBeTruthy();
      }
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

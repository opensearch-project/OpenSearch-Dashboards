/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import supertest from 'supertest';
import { UnwrapPromise } from '@osd/utility-types';
import { setupServer } from '../../../../../src/core/server/test_utils';

import { IAuthenticationMethodRegistry } from '../auth_registry';
import { authenticationMethodRegistryMock } from '../auth_registry/authentication_methods_registry.mock';
import { CustomApiSchemaRegistry } from '../schema_registry';
import { DataSourceServiceSetup } from '../../server/data_source_service';
import { CryptographyServiceSetup } from '../cryptography_service';
import { registerFetchDataSourceMetaDataRoute } from './fetch_data_source_metadata';
import { AuthType } from '../../common/data_sources';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { opensearchClientMock } from '../../../../../src/core/server/opensearch/client/mocks';
import { dynamicConfigServiceMock } from '../../../../../src/core/server/mocks';

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;

const URL = '/internal/data-source-management/fetchDataSourceMetaData';

describe(`Fetch DataSource MetaData ${URL}`, () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let handlerContext: SetupServerReturn['handlerContext'];
  let cryptographyMock: jest.Mocked<CryptographyServiceSetup>;
  const customApiSchemaRegistry = new CustomApiSchemaRegistry();
  let customApiSchemaRegistryPromise: Promise<CustomApiSchemaRegistry>;
  let dataSourceClient: ReturnType<typeof opensearchClientMock.createInternalClient>;
  let dataSourceServiceSetupMock: DataSourceServiceSetup;
  let authRegistryPromiseMock: Promise<IAuthenticationMethodRegistry>;
  const dynamicConfigServiceStart = dynamicConfigServiceMock.createInternalStartContract();
  const dataSourceAttr = {
    endpoint: 'https://test.com',
    auth: {
      type: AuthType.UsernamePasswordType,
      credentials: {
        username: 'testUser',
        password: 'testPassword',
      },
    },
  };

  const dataSourceAttrMissingCredentialForNoAuth = {
    endpoint: 'https://test.com',
    auth: {
      type: AuthType.NoAuth,
      credentials: {},
    },
  };

  const dataSourceAttrMissingCredentialForBasicAuth = {
    endpoint: 'https://test.com',
    auth: {
      type: AuthType.UsernamePasswordType,
      credentials: {},
    },
  };

  const dataSourceAttrMissingCredentialForSigV4Auth = {
    endpoint: 'https://test.com',
    auth: {
      type: AuthType.SigV4,
      credentials: {},
    },
  };

  const dataSourceAttrPartialCredentialForSigV4Auth = {
    endpoint: 'https://test.com',
    auth: {
      type: AuthType.SigV4,
      credentials: {
        accessKey: 'testKey',
        service: 'service',
      },
    },
  };

  const dataSourceAttrPartialCredentialForBasicAuth = {
    endpoint: 'https://test.com',
    auth: {
      type: AuthType.UsernamePasswordType,
      credentials: {
        username: 'testName',
      },
    },
  };

  const dataSourceAttrForSigV4Auth = {
    endpoint: 'https://test.com',
    auth: {
      type: AuthType.SigV4,
      credentials: {
        accessKey: 'testKey',
        service: 'es',
        secretKey: 'testSecret',
        region: 'testRegion',
      },
    },
  };

  const dataSourceAttrForRegisteredAuthWithCredentials = {
    endpoint: 'https://test.com',
    auth: {
      type: 'Some Registered Type',
      credentials: {
        firstField: 'some value',
        secondField: 'some value',
      },
    },
  };

  const dataSourceAttrForRegisteredAuthWithEmptyCredentials = {
    endpoint: 'https://test.com',
    auth: {
      type: 'Some Registered Type',
      credentials: {},
    },
  };

  const dataSourceAttrForRegisteredAuthWithoutCredentials = {
    endpoint: 'https://test.com',
    auth: {
      type: 'Some Registered Type',
    },
  };

  const dataSourceAttrForRegisteredAuthWithNoAuthType = {
    endpoint: 'https://test.com',
    auth: {
      type: AuthType.NoAuth,
      credentials: {
        field: 'some value',
      },
    },
  };

  const dataSourceAttrForRegisteredAuthWithBasicAuthType = {
    endpoint: 'https://test.com',
    auth: {
      type: AuthType.UsernamePasswordType,
      credentials: {},
    },
  };

  const dataSourceAttrForRegisteredAuthWithSigV4AuthType = {
    endpoint: 'https://test.com',
    auth: {
      type: AuthType.SigV4,
      credentials: {},
    },
  };

  beforeEach(async () => {
    ({ server, httpSetup, handlerContext } = await setupServer());
    customApiSchemaRegistryPromise = Promise.resolve(customApiSchemaRegistry);
    authRegistryPromiseMock = Promise.resolve(authenticationMethodRegistryMock.create());
    dataSourceClient = opensearchClientMock.createInternalClient();

    dataSourceServiceSetupMock = {
      getDataSourceClient: jest.fn(() => Promise.resolve(dataSourceClient)),
      getDataSourceLegacyClient: jest.fn(),
    };

    const router = httpSetup.createRouter('');
    dataSourceClient.info.mockImplementationOnce(() =>
      opensearchClientMock.createSuccessTransportRequestPromise({
        version: { number: '2.11.0', distribution: 'opensearch' },
      })
    );

    const installedPlugins = [
      { name: 'b40f6833d895d3a95333e325e8bea79b', component: 'opensearch-ml', version: '2.11.0' },
      { name: 'b40f6833d895d3a95333e325e8bea79b', component: 'opensearch-sql', version: '2.11.0' },
    ];
    dataSourceClient.cat.plugins.mockImplementationOnce(() =>
      opensearchClientMock.createSuccessTransportRequestPromise(installedPlugins)
    );

    registerFetchDataSourceMetaDataRoute(
      router,
      dataSourceServiceSetupMock,
      cryptographyMock,
      authRegistryPromiseMock,
      customApiSchemaRegistryPromise
    );

    await server.start({ dynamicConfigService: dynamicConfigServiceStart });
  });

  afterEach(async () => {
    await server.stop();
  });

  it('shows successful response', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr,
      })
      .expect(200);
    expect(result.body).toEqual({
      dataSourceVersion: '2.11.0',
      dataSourceEngineType: 'OpenSearch',
      installedPlugins: ['opensearch-ml', 'opensearch-sql'],
    });
    expect(dataSourceServiceSetupMock.getDataSourceClient).toHaveBeenCalledWith(
      expect.objectContaining({
        savedObjects: handlerContext.savedObjects.client,
        cryptography: cryptographyMock,
        dataSourceId: 'testId',
        testClientDataSourceAttr: dataSourceAttr,
        customApiSchemaRegistryPromise,
      })
    );
  });

  it('no credential with no auth should succeed', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: dataSourceAttrMissingCredentialForNoAuth,
      })
      .expect(200);
    expect(result.body).toEqual({
      dataSourceVersion: '2.11.0',
      dataSourceEngineType: 'OpenSearch',
      installedPlugins: ['opensearch-ml', 'opensearch-sql'],
    });
  });

  it('no credential with basic auth should fail', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: dataSourceAttrMissingCredentialForBasicAuth,
      })
      .expect(400);
    expect(result.body.error).toEqual('Bad Request');
  });

  it('no credential with sigv4 auth should fail', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: dataSourceAttrMissingCredentialForSigV4Auth,
      })
      .expect(400);
    expect(result.body.error).toEqual('Bad Request');
  });

  it('partial credential with sigv4 auth should fail', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: dataSourceAttrPartialCredentialForSigV4Auth,
      })
      .expect(400);
    expect(result.body.error).toEqual('Bad Request');
  });

  it('partial credential with basic auth should fail', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: dataSourceAttrPartialCredentialForBasicAuth,
      })
      .expect(400);
    expect(result.body.error).toEqual('Bad Request');
  });

  it('registered Auth with NoAuthType should fail', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: dataSourceAttrForRegisteredAuthWithNoAuthType,
      })
      .expect(400);
    expect(result.body.error).toEqual('Bad Request');
    expect(result.body.message).toContain(
      `Must not be no_auth or username_password or sigv4 for registered auth types`
    );
  });

  it('registered Auth with Basic AuthType should fail', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: dataSourceAttrForRegisteredAuthWithBasicAuthType,
      })
      .expect(400);
    expect(result.body.error).toEqual('Bad Request');
    expect(result.body.message).toContain(
      `Must not be no_auth or username_password or sigv4 for registered auth types`
    );
  });

  it('registered Auth with sigV4 AuthType should fail', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: dataSourceAttrForRegisteredAuthWithSigV4AuthType,
      })
      .expect(400);
    expect(result.body.error).toEqual('Bad Request');
    expect(result.body.message).toContain(
      `Must not be no_auth or username_password or sigv4 for registered auth types`
    );
  });

  it('full credential with sigV4 auth should success', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: dataSourceAttrForSigV4Auth,
      })
      .expect(200);
    expect(result.body).toEqual({
      dataSourceVersion: '2.11.0',
      dataSourceEngineType: 'OpenSearch',
      installedPlugins: ['opensearch-ml', 'opensearch-sql'],
    });
  });

  it('credential with registered auth type should success', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: dataSourceAttrForRegisteredAuthWithCredentials,
      })
      .expect(200);
    expect(result.body).toEqual({
      dataSourceVersion: '2.11.0',
      dataSourceEngineType: 'OpenSearch',
      installedPlugins: ['opensearch-ml', 'opensearch-sql'],
    });
  });

  it('empty credential with registered auth type should success', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: dataSourceAttrForRegisteredAuthWithEmptyCredentials,
      })
      .expect(200);
    expect(result.body).toEqual({
      dataSourceVersion: '2.11.0',
      dataSourceEngineType: 'OpenSearch',
      installedPlugins: ['opensearch-ml', 'opensearch-sql'],
    });
  });

  it('no credential with registered auth type should success', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: dataSourceAttrForRegisteredAuthWithoutCredentials,
      })
      .expect(200);
    expect(result.body).toEqual({
      dataSourceVersion: '2.11.0',
      dataSourceEngineType: 'OpenSearch',
      installedPlugins: ['opensearch-ml', 'opensearch-sql'],
    });
  });
});

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
import { registerTestConnectionRoute } from './test_connection';
import { AuthType, SigV4ServiceName } from '../../common/data_sources';
import { opensearchClientMock } from '../../../../../src/core/server/opensearch/client/mocks';
import {
  dynamicConfigServiceMock,
  savedObjectsRepositoryMock,
} from '../../../../../src/core/server/mocks';

// Mock the endpoint validator
jest.mock('../util/endpoint_validator', () => ({
  isValidURL: jest.fn(),
}));

import { isValidURL } from '../util/endpoint_validator';
const mockedIsValidURL = isValidURL as jest.MockedFunction<typeof isValidURL>;

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;

const URL = '/internal/data-source-management/validate';
const BLOCKED_IP_RANGES = ['127.0.0.0/8', '192.168.1.0/24'];

describe(`Test connection ${URL}`, () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let handlerContext: SetupServerReturn['handlerContext'];
  let cryptographyMock: jest.Mocked<CryptographyServiceSetup>;
  const customApiSchemaRegistry = new CustomApiSchemaRegistry();
  let customApiSchemaRegistryPromise: Promise<CustomApiSchemaRegistry>;
  let dataSourceClient: ReturnType<typeof opensearchClientMock.createInternalClient>;
  let dataSourceServiceSetupMock: DataSourceServiceSetup;
  let authRegistryPromiseMock: Promise<IAuthenticationMethodRegistry>;
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
  const dynamicConfigServiceStart = dynamicConfigServiceMock.createInternalStartContract();

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
    cryptographyMock = {} as jest.Mocked<CryptographyServiceSetup>;

    dataSourceServiceSetupMock = {
      getDataSourceClient: jest.fn(() => Promise.resolve(dataSourceClient)),
      getDataSourceLegacyClient: jest.fn(),
    };

    // Mock endpoint validator to return true by default
    mockedIsValidURL.mockReturnValue({ valid: true });

    const router = httpSetup.createRouter('');
    dataSourceClient.info.mockImplementationOnce(() =>
      opensearchClientMock.createSuccessTransportRequestPromise({ cluster_name: 'testCluster' })
    );

    // Create mock logger with error and info methods
    const mockLogger: any = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
      log: jest.fn(),
      get: jest.fn().mockReturnThis(),
    };

    registerTestConnectionRoute(
      router,
      dataSourceServiceSetupMock,
      cryptographyMock,
      authRegistryPromiseMock,
      customApiSchemaRegistryPromise,
      mockLogger as any,
      BLOCKED_IP_RANGES
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
    expect(result.body).toEqual({ success: true });
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
    expect(result.body).toEqual({ success: true });
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
    expect(result.body).toEqual({ success: true });
  });

  it('credential with registered auth type should success', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: dataSourceAttrForRegisteredAuthWithCredentials,
      })
      .expect(200);
    expect(result.body).toEqual({ success: true });
  });

  it('empty credential with registered auth type should success', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: dataSourceAttrForRegisteredAuthWithEmptyCredentials,
      })
      .expect(200);
    expect(result.body).toEqual({ success: true });
  });

  it('no credential with registered auth type should success', async () => {
    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: dataSourceAttrForRegisteredAuthWithoutCredentials,
      })
      .expect(200);
    expect(result.body).toEqual({ success: true });
  });

  it('should fail when endpoint is invalid', async () => {
    mockedIsValidURL.mockReturnValue({
      valid: false,
      error: 'Invalid URL format',
      userMessage: 'Invalid URL format',
    });

    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: {
          endpoint: 'invalid-endpoint',
          auth: {
            type: AuthType.NoAuth,
            credentials: {},
          },
        },
      })
      .expect(400);

    expect(result.body.message).toContain('Invalid URL format');
    expect(mockedIsValidURL).toHaveBeenCalledWith('invalid-endpoint', BLOCKED_IP_RANGES, undefined);
    expect(dataSourceServiceSetupMock.getDataSourceClient).not.toHaveBeenCalled();
  });

  it('should succeed when endpoint is valid', async () => {
    mockedIsValidURL.mockReturnValue({ valid: true });

    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr,
      })
      .expect(200);

    expect(result.body).toEqual({ success: true });
    expect(mockedIsValidURL).toHaveBeenCalledWith('https://test.com', BLOCKED_IP_RANGES, undefined);
    expect(dataSourceServiceSetupMock.getDataSourceClient).toHaveBeenCalled();
  });

  it('should fail when endpoint is from blocked IP list', async () => {
    mockedIsValidURL.mockReturnValue({
      valid: false,
      error: 'IP is blocked by denied range',
      userMessage: 'Endpoint IP address is not allowed',
    });

    const blockedIpDataSourceAttr = {
      endpoint: 'http://127.0.0.1:9200',
      auth: {
        type: AuthType.NoAuth,
        credentials: {},
      },
    };

    const result = await supertest(httpSetup.server.listener)
      .post(URL)
      .send({
        id: 'testId',
        dataSourceAttr: blockedIpDataSourceAttr,
      })
      .expect(400);

    expect(result.body.message).toContain('Endpoint IP address is not allowed');
    expect(mockedIsValidURL).toHaveBeenCalledWith(
      'http://127.0.0.1:9200',
      BLOCKED_IP_RANGES,
      undefined
    );
    expect(dataSourceServiceSetupMock.getDataSourceClient).not.toHaveBeenCalled();
  });
});

describe(`Test connection ${URL} — internalSavedObjects forwarding`, () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let cryptographyMock: jest.Mocked<CryptographyServiceSetup>;
  let dataSourceServiceSetupMock: DataSourceServiceSetup;
  let authRegistryPromiseMock: Promise<IAuthenticationMethodRegistry>;
  let customApiSchemaRegistryPromise: Promise<CustomApiSchemaRegistry>;
  let dataSourceClient: ReturnType<typeof opensearchClientMock.createInternalClient>;
  const dynamicConfigServiceStart = dynamicConfigServiceMock.createInternalStartContract();
  const mockLogger: any = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
    log: jest.fn(),
    get: jest.fn().mockReturnThis(),
  };

  // Reuse-stored-password flow: dataSourceId present, password omitted
  const dataSourceAttrMissingPassword = {
    endpoint: 'https://test.com',
    auth: {
      type: AuthType.UsernamePasswordType,
      credentials: { username: 'testUser', password: '' },
    },
  };

  // Reuse-stored-SigV4-keys flow: dataSourceId present, both keys empty
  const dataSourceAttrMissingSigV4Keys = {
    endpoint: 'https://test.com',
    auth: {
      type: AuthType.SigV4,
      credentials: {
        region: 'us-east-1',
        service: SigV4ServiceName.OpenSearch,
        accessKey: '',
        secretKey: '',
      },
    },
  };

  const setupRoute = async (
    getInternalSavedObjects?: (
      request: unknown
    ) => ReturnType<typeof savedObjectsRepositoryMock.create> | undefined
  ) => {
    ({ server, httpSetup } = await setupServer());
    dataSourceClient = opensearchClientMock.createInternalClient();
    dataSourceClient.info.mockImplementation(() =>
      opensearchClientMock.createSuccessTransportRequestPromise({ cluster_name: 'c' })
    );
    dataSourceServiceSetupMock = {
      getDataSourceClient: jest.fn(() => Promise.resolve(dataSourceClient)),
      getDataSourceLegacyClient: jest.fn(),
    };
    customApiSchemaRegistryPromise = Promise.resolve(new CustomApiSchemaRegistry());
    authRegistryPromiseMock = Promise.resolve(authenticationMethodRegistryMock.create());
    mockedIsValidURL.mockReturnValue({ valid: true });

    const router = httpSetup.createRouter('');
    registerTestConnectionRoute(
      router,
      dataSourceServiceSetupMock,
      cryptographyMock,
      authRegistryPromiseMock,
      customApiSchemaRegistryPromise,
      mockLogger,
      BLOCKED_IP_RANGES,
      undefined,
      getInternalSavedObjects as any
    );
    await server.start({ dynamicConfigService: dynamicConfigServiceStart });
  };

  afterEach(async () => {
    await server.stop();
    mockedIsValidURL.mockReset();
  });

  it('forwards internalSavedObjects when editing non-credential fields with stored password (username_password reuse flow)', async () => {
    const internalRepo = savedObjectsRepositoryMock.create();
    const getInternalSavedObjects = jest.fn(() => internalRepo);
    await setupRoute(getInternalSavedObjects);

    await supertest(httpSetup.server.listener)
      .post(URL)
      .send({ id: 'existing-ds-id', dataSourceAttr: dataSourceAttrMissingPassword })
      .expect(200);

    // internalSavedObjects must reach getDataSourceClient so configureClient can
    // call getDataSourceInternal and recover encrypted credentials from the store
    expect(dataSourceServiceSetupMock.getDataSourceClient).toHaveBeenCalledWith(
      expect.objectContaining({
        dataSourceId: 'existing-ds-id',
        internalSavedObjects: internalRepo,
      })
    );
    expect(getInternalSavedObjects).toHaveBeenCalledWith(expect.anything());
  });

  it('forwards internalSavedObjects when editing non-credential fields with stored SigV4 keys (sigv4 reuse flow)', async () => {
    const internalRepo = savedObjectsRepositoryMock.create();
    await setupRoute(() => internalRepo);

    await supertest(httpSetup.server.listener)
      .post(URL)
      .send({ id: 'existing-ds-id', dataSourceAttr: dataSourceAttrMissingSigV4Keys })
      .expect(200);

    expect(dataSourceServiceSetupMock.getDataSourceClient).toHaveBeenCalledWith(
      expect.objectContaining({
        dataSourceId: 'existing-ds-id',
        internalSavedObjects: internalRepo,
      })
    );
  });

  it('passes undefined internalSavedObjects when no getter is provided (no regression on existing callers)', async () => {
    await setupRoute(/* no getter */);

    await supertest(httpSetup.server.listener)
      .post(URL)
      .send({ id: 'existing-ds-id', dataSourceAttr: dataSourceAttrMissingPassword })
      .expect(200);

    expect(dataSourceServiceSetupMock.getDataSourceClient).toHaveBeenCalledWith(
      expect.objectContaining({ internalSavedObjects: undefined })
    );
  });
});

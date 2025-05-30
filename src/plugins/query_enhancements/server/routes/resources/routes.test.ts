/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerResourceRoutes } from './routes';
import { resourceManagerService } from '../../connections/resource_manager_service';
import { BASE_API } from '../../../common';
import supertest from 'supertest';
import { BaseConnectionManager } from '../../connections/managers/base_connection_manager';
import {
  HttpResponsePayload,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../../core/server';
import { setupServer } from '../../../../../core/server/test_utils';
import { HttpService } from 'opensearch-dashboards/server/http';

class TestManager extends BaseConnectionManager {
  handlePostRequestSpy: (
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest
  ) => Promise<HttpResponsePayload>;
  constructor(
    handlePostRequestSpy: (
      context: RequestHandlerContext,
      request: OpenSearchDashboardsRequest
    ) => Promise<HttpResponsePayload>
  ) {
    super();
    this.handlePostRequestSpy = handlePostRequestSpy;
  }

  handlePostRequest(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest
  ): Promise<HttpResponsePayload> {
    return this.handlePostRequestSpy(context, request);
  }
}

describe('Resource Routes', () => {
  let testServer: HttpService;
  const DATA_CONNECTION_TYPE = 'datatype';
  const DATA_CONNECTION_ID = 'dataconnectionid';
  const DATA_CONNECTION_RESOURCE_TYPE = 'resourceType';
  const REQUEST_BODY = {
    connection: {
      id: DATA_CONNECTION_ID,
      type: DATA_CONNECTION_TYPE,
    },
    resource: {
      type: DATA_CONNECTION_RESOURCE_TYPE,
    },
  };

  const testSetup = async () => {
    const { server, httpSetup } = await setupServer();
    const router = httpSetup.createRouter('');
    registerResourceRoutes(router);
    const dynamicConfigService = {
      getClient: jest.fn(),
      getAsyncLocalStore: jest.fn(),
      createStoreFromRequest: jest.fn(),
    };
    await server.start({ dynamicConfigService });
    testServer = server;
    return httpSetup;
  };

  afterEach(async () => {
    if (testServer) {
      await testServer.stop();
    }
  });

  it('should connect to manager based on data connection type', async () => {
    const handlePostRequestSpy = jest.fn().mockResolvedValue({ message: 'succeed' });
    const manager = new TestManager(handlePostRequestSpy);
    jest
      .spyOn(resourceManagerService, 'getManager')
      .mockImplementation((type: string) => (type === DATA_CONNECTION_TYPE ? manager : undefined));

    const httpSetup = await testSetup();
    const result = await supertest(httpSetup.server.listener)
      .post(`${BASE_API}/resources`)
      .send({ ...REQUEST_BODY })
      .expect(200);
    expect(result.body.message).toEqual('succeed');
  });

  it('should return 404 when data connection type is not registered', async () => {
    jest.spyOn(resourceManagerService, 'getManager').mockReturnValue(undefined);

    const httpSetup = await testSetup();
    const result = await supertest(httpSetup.server.listener)
      .post(`${BASE_API}/resources`)
      .send({ ...REQUEST_BODY })
      .expect(404);
    expect(result.body.message).toEqual('Not Found');
  });

  it('should return error when get resources failed', async () => {
    const handlePostRequestSpy = jest.fn().mockRejectedValue({ message: 'failed' });
    const manager = new TestManager(handlePostRequestSpy);
    jest
      .spyOn(resourceManagerService, 'getManager')
      .mockImplementation((type: string) => (type === DATA_CONNECTION_TYPE ? manager : undefined));

    const httpSetup = await testSetup();
    const result = await supertest(httpSetup.server.listener)
      .post(`${BASE_API}/resources`)
      .send({ ...REQUEST_BODY })
      .expect(503);
    expect(result.body.message).toEqual('Unable to get resources');
  });
});

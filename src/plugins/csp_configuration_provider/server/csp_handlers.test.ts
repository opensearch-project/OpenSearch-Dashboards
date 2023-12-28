/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { RouteMethod } from '../../../core/server';
import {
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsRouteOptions,
} from '../../../core/server/http/router/request';
import { httpServerMock } from '../../../core/server/mocks';
import { createCspRulesPreResponseHandler } from './csp_handlers';

const forgeRequest = ({
  headers = {},
  path = '/',
  method = 'get',
  opensearchDashboardsRouteOptions,
}: Partial<{
  headers: Record<string, string>;
  path: string;
  method: RouteMethod;
  opensearchDashboardsRouteOptions: OpenSearchDashboardsRouteOptions;
}>): OpenSearchDashboardsRequest => {
  return httpServerMock.createOpenSearchDashboardsRequest({
    headers,
    path,
    method,
    opensearchDashboardsRouteOptions,
  });
};

describe('CSP handlers', () => {
  let toolkit: ReturnType<typeof httpServerMock.createToolkit>;

  beforeEach(() => {
    jest.resetAllMocks();
    toolkit = httpServerMock.createToolkit();
  });

  it('adds the CSP headers provided by the client', async () => {
    const coreSetup = coreMock.createSetup();
    const cspRules = "frame-ancestors 'self'";

    const cspClient = {
      exists: jest.fn().mockReturnValue(true),
      get: jest.fn().mockReturnValue(cspRules),
    };

    const getCspClient = jest.fn().mockReturnValue(cspClient);

    const handler = createCspRulesPreResponseHandler(coreSetup, getCspClient);
    const request = forgeRequest({ method: 'get', headers: { 'sec-fetch-dest': 'document' } });

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toHaveBeenCalledTimes(1);

    expect(toolkit.next).toHaveBeenCalledWith({
      headers: {
        'content-security-policy': cspRules,
      },
    });

    expect(cspClient.exists).toBeCalledTimes(1);
    expect(cspClient.get).toBeCalledTimes(1);
  });

  it('do not add CSP headers when the client returns empty', async () => {
    const coreSetup = coreMock.createSetup();
    const emptyCspRules = '';

    const cspClient = {
      exists: jest.fn().mockReturnValue(true),
      get: jest.fn().mockReturnValue(emptyCspRules),
    };

    const getCspClient = jest.fn().mockReturnValue(cspClient);

    const handler = createCspRulesPreResponseHandler(coreSetup, getCspClient);
    const request = forgeRequest({ method: 'get', headers: { 'sec-fetch-dest': 'document' } });

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toHaveBeenCalledTimes(1);
    expect(toolkit.next).toHaveBeenCalledWith({});

    expect(cspClient.exists).toBeCalledTimes(1);
    expect(cspClient.get).toBeCalledTimes(1);
  });

  it('do not add CSP headers when the configuration does not exist', async () => {
    const coreSetup = coreMock.createSetup();

    const cspClient = {
      exists: jest.fn().mockReturnValue(false),
      get: jest.fn(),
    };

    const getCspClient = jest.fn().mockReturnValue(cspClient);

    const handler = createCspRulesPreResponseHandler(coreSetup, getCspClient);
    const request = forgeRequest({ method: 'get', headers: { 'sec-fetch-dest': 'document' } });

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toBeCalledTimes(1);
    expect(toolkit.next).toBeCalledWith({});

    expect(cspClient.exists).toBeCalledTimes(1);
    expect(cspClient.get).toBeCalledTimes(0);
  });

  it('do not add CSP headers when request dest exists and shall skip', async () => {
    const coreSetup = coreMock.createSetup();

    const cspClient = {
      exists: jest.fn(),
      get: jest.fn(),
    };

    const getCspClient = jest.fn().mockReturnValue(cspClient);

    const handler = createCspRulesPreResponseHandler(coreSetup, getCspClient);

    const cssSecFetchDest = 'css';
    const request = forgeRequest({ method: 'get', headers: { 'sec-fetch-dest': cssSecFetchDest } });

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toBeCalledTimes(1);
    expect(toolkit.next).toBeCalledWith({});

    expect(cspClient.exists).toBeCalledTimes(0);
    expect(cspClient.get).toBeCalledTimes(0);
  });

  it('do not add CSP headers when request dest does not exist', async () => {
    const coreSetup = coreMock.createSetup();

    const cspClient = {
      exists: jest.fn(),
      get: jest.fn(),
    };

    const getCspClient = jest.fn().mockReturnValue(cspClient);

    const handler = createCspRulesPreResponseHandler(coreSetup, getCspClient);

    const request = forgeRequest({ method: 'get', headers: {} });

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toBeCalledTimes(1);
    expect(toolkit.next).toBeCalledWith({});

    expect(cspClient.exists).toBeCalledTimes(0);
    expect(cspClient.get).toBeCalledTimes(0);
  });
});

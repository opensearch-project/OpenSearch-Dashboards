/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RouteMethod } from '../../../core/server';
import {
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsRouteOptions,
} from '../../../core/server/http/router/request';
import { coreMock, httpServerMock } from '../../../core/server/mocks';
import { createCspRulesPreResponseHandler } from './csp_handlers';
import { MockedLogger, loggerMock } from '@osd/logging/target/mocks';

const ERROR_MESSAGE = 'Service unavailable';

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
  let logger: MockedLogger;

  beforeEach(() => {
    jest.resetAllMocks();
    toolkit = httpServerMock.createToolkit();
    logger = loggerMock.create();
  });

  it('adds the CSP headers provided by the client', async () => {
    const coreSetup = coreMock.createSetup();
    const cspRules = "frame-ancestors 'self'";

    const configurationClient = {
      existsCspRules: jest.fn().mockReturnValue(true),
      getCspRules: jest.fn().mockReturnValue(cspRules),
    };

    const getConfigurationClient = jest.fn().mockReturnValue(configurationClient);

    const handler = createCspRulesPreResponseHandler(coreSetup, getConfigurationClient, logger);
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

    expect(configurationClient.existsCspRules).toBeCalledTimes(1);
    expect(configurationClient.getCspRules).toBeCalledTimes(1);
  });

  it('do not add CSP headers when the client returns empty', async () => {
    const coreSetup = coreMock.createSetup();
    const emptyCspRules = '';

    const configurationClient = {
      existsCspRules: jest.fn().mockReturnValue(true),
      getCspRules: jest.fn().mockReturnValue(emptyCspRules),
    };

    const getConfigurationClient = jest.fn().mockReturnValue(configurationClient);

    const handler = createCspRulesPreResponseHandler(coreSetup, getConfigurationClient, logger);
    const request = forgeRequest({ method: 'get', headers: { 'sec-fetch-dest': 'document' } });

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toHaveBeenCalledTimes(1);
    expect(toolkit.next).toHaveBeenCalledWith({});

    expect(configurationClient.existsCspRules).toBeCalledTimes(1);
    expect(configurationClient.getCspRules).toBeCalledTimes(1);
  });

  it('do not add CSP headers when the configuration does not exist', async () => {
    const coreSetup = coreMock.createSetup();

    const configurationClient = {
      existsCspRules: jest.fn().mockReturnValue(false),
      getCspRules: jest.fn(),
    };

    const getConfigurationClient = jest.fn().mockReturnValue(configurationClient);

    const handler = createCspRulesPreResponseHandler(coreSetup, getConfigurationClient, logger);
    const request = forgeRequest({ method: 'get', headers: { 'sec-fetch-dest': 'document' } });

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toBeCalledTimes(1);
    expect(toolkit.next).toBeCalledWith({});

    expect(configurationClient.existsCspRules).toBeCalledTimes(1);
    expect(configurationClient.getCspRules).toBeCalledTimes(0);
  });

  it('do not add CSP headers when request dest exists and shall skip', async () => {
    const coreSetup = coreMock.createSetup();

    const configurationClient = {
      existsCspRules: jest.fn(),
      getCspRules: jest.fn(),
    };

    const getConfigurationClient = jest.fn().mockReturnValue(configurationClient);

    const handler = createCspRulesPreResponseHandler(coreSetup, getConfigurationClient, logger);

    const cssSecFetchDest = 'css';
    const request = forgeRequest({ method: 'get', headers: { 'sec-fetch-dest': cssSecFetchDest } });

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toBeCalledTimes(1);
    expect(toolkit.next).toBeCalledWith({});

    expect(configurationClient.existsCspRules).toBeCalledTimes(0);
    expect(configurationClient.getCspRules).toBeCalledTimes(0);
  });

  it('do not add CSP headers when request dest does not exist', async () => {
    const coreSetup = coreMock.createSetup();

    const configurationClient = {
      existsCspRules: jest.fn(),
      getCspRules: jest.fn(),
    };

    const getConfigurationClient = jest.fn().mockReturnValue(configurationClient);

    const handler = createCspRulesPreResponseHandler(coreSetup, getConfigurationClient, logger);

    const request = forgeRequest({ method: 'get', headers: {} });

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toBeCalledTimes(1);
    expect(toolkit.next).toBeCalledWith({});

    expect(configurationClient.existsCspRules).toBeCalledTimes(0);
    expect(configurationClient.getCspRules).toBeCalledTimes(0);
  });

  it('do not the CSP headers when error happens', async () => {
    const coreSetup = coreMock.createSetup();
    const error = new Error(ERROR_MESSAGE);

    const configurationClient = {
      existsCspRules: jest.fn().mockImplementation(() => {
        throw error;
      }),
      getCspRules: jest.fn(),
    };

    const getConfigurationClient = jest.fn().mockReturnValue(configurationClient);

    const handler = createCspRulesPreResponseHandler(coreSetup, getConfigurationClient, logger);
    const request = forgeRequest({ method: 'get', headers: { 'sec-fetch-dest': 'document' } });

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toHaveBeenCalledTimes(1);
    expect(toolkit.next).toBeCalledWith({});

    expect(configurationClient.existsCspRules).toBeCalledTimes(1);
    expect(configurationClient.getCspRules).not.toBeCalled();

    expect(logger.error).toBeCalledWith(
      `Failure happened in CSP rules pre response handler due to ${error}`
    );
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock, httpServerMock } from '../../../core/server/mocks';
import { createCspRulesPreResponseHandler } from './csp_handlers';
import { MockedLogger, loggerMock } from '@osd/logging/target/mocks';

const ERROR_MESSAGE = 'Service unavailable';
const CSP_RULES_FRAME_ANCESTORS_CONFIG_KEY = 'csp.rules.frame-ancestors';

describe('CSP handlers', () => {
  let toolkit: ReturnType<typeof httpServerMock.createToolkit>;
  let logger: MockedLogger;

  beforeEach(() => {
    toolkit = httpServerMock.createToolkit();
    logger = loggerMock.create();
  });

  it('adds the frame-ancestors provided by the client', async () => {
    const coreSetup = coreMock.createSetup();
    const frameAncestorsFromIndex = "'self' localsystem";
    const cspRulesFromYML = "script-src 'unsafe-eval' 'self'";

    const configurationClient = {
      getEntityConfig: jest.fn().mockReturnValue(frameAncestorsFromIndex),
    };

    const getConfigurationClient = jest.fn().mockReturnValue(configurationClient);

    const handler = createCspRulesPreResponseHandler(
      coreSetup,
      cspRulesFromYML,
      getConfigurationClient,
      logger
    );
    const request = {
      method: 'get',
      headers: { 'sec-fetch-dest': 'document' },
    };

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toHaveBeenCalledTimes(1);

    expect(toolkit.next).toHaveBeenCalledWith({
      headers: {
        'content-security-policy':
          "script-src 'unsafe-eval' 'self'; frame-ancestors 'self' localsystem",
      },
    });

    expect(configurationClient.getEntityConfig).toBeCalledTimes(1);
    expect(configurationClient.getEntityConfig).toBeCalledWith(
      CSP_RULES_FRAME_ANCESTORS_CONFIG_KEY,
      { headers: { 'sec-fetch-dest': 'document' } }
    );
    expect(getConfigurationClient).toBeCalledWith(request);
  });

  it('do not modify frame-ancestors when the client returns empty and CSP from YML already has frame-ancestors', async () => {
    const coreSetup = coreMock.createSetup();
    const emptyFrameAncestors = '';
    const cspRulesFromYML = "script-src 'unsafe-eval' 'self'; frame-ancestors localsystem";

    const configurationClient = {
      getEntityConfig: jest.fn().mockReturnValue(emptyFrameAncestors),
    };

    const getConfigurationClient = jest.fn().mockReturnValue(configurationClient);

    const handler = createCspRulesPreResponseHandler(
      coreSetup,
      cspRulesFromYML,
      getConfigurationClient,
      logger
    );
    const request = {
      method: 'get',
      headers: { 'sec-fetch-dest': 'document' },
    };

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toHaveBeenCalledTimes(1);
    expect(toolkit.next).toHaveBeenCalledWith({
      headers: {
        'content-security-policy': cspRulesFromYML,
      },
    });

    expect(configurationClient.getEntityConfig).toBeCalledTimes(1);

    expect(configurationClient.getEntityConfig).toBeCalledWith(
      CSP_RULES_FRAME_ANCESTORS_CONFIG_KEY,
      { headers: { 'sec-fetch-dest': 'document' } }
    );

    expect(getConfigurationClient).toBeCalledWith(request);
  });

  it('add frame-ancestors when the client returns empty and CSP from YML has no frame-ancestors', async () => {
    const coreSetup = coreMock.createSetup();
    const emptyFrameAncestors = '';
    const cspRulesFromYML = "script-src 'unsafe-eval' 'self'";

    const configurationClient = {
      getEntityConfig: jest.fn().mockReturnValue(emptyFrameAncestors),
    };

    const getConfigurationClient = jest.fn().mockReturnValue(configurationClient);

    const handler = createCspRulesPreResponseHandler(
      coreSetup,
      cspRulesFromYML,
      getConfigurationClient,
      logger
    );

    const request = {
      method: 'get',
      headers: { 'sec-fetch-dest': 'document' },
    };

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toHaveBeenCalledTimes(1);
    expect(toolkit.next).toHaveBeenCalledWith({
      headers: {
        'content-security-policy': "script-src 'unsafe-eval' 'self'; frame-ancestors 'self'",
      },
    });

    expect(configurationClient.getEntityConfig).toBeCalledTimes(1);

    expect(configurationClient.getEntityConfig).toBeCalledWith(
      CSP_RULES_FRAME_ANCESTORS_CONFIG_KEY,
      { headers: { 'sec-fetch-dest': 'document' } }
    );

    expect(getConfigurationClient).toBeCalledWith(request);
  });

  it('do not modify frame-ancestors when the configuration does not exist and CSP from YML already has frame-ancestors', async () => {
    const coreSetup = coreMock.createSetup();
    const cspRulesFromYML = "script-src 'unsafe-eval' 'self'; frame-ancestors localsystem";

    const configurationClient = {
      getEntityConfig: jest.fn().mockImplementation(() => {
        throw new Error(ERROR_MESSAGE);
      }),
    };

    const getConfigurationClient = jest.fn().mockReturnValue(configurationClient);

    const handler = createCspRulesPreResponseHandler(
      coreSetup,
      cspRulesFromYML,
      getConfigurationClient,
      logger
    );

    const request = {
      method: 'get',
      headers: { 'sec-fetch-dest': 'document' },
    };

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toBeCalledTimes(1);
    expect(toolkit.next).toBeCalledWith({
      headers: {
        'content-security-policy': cspRulesFromYML,
      },
    });

    expect(configurationClient.getEntityConfig).toBeCalledTimes(1);

    expect(configurationClient.getEntityConfig).toBeCalledWith(
      CSP_RULES_FRAME_ANCESTORS_CONFIG_KEY,
      { headers: { 'sec-fetch-dest': 'document' } }
    );

    expect(getConfigurationClient).toBeCalledWith(request);
  });

  it('add frame-ancestors when the configuration does not exist and CSP from YML has no frame-ancestors', async () => {
    const coreSetup = coreMock.createSetup();
    const cspRulesFromYML = "script-src 'unsafe-eval' 'self'";

    const configurationClient = {
      getEntityConfig: jest.fn().mockImplementation(() => {
        throw new Error(ERROR_MESSAGE);
      }),
    };

    const getConfigurationClient = jest.fn().mockReturnValue(configurationClient);

    const handler = createCspRulesPreResponseHandler(
      coreSetup,
      cspRulesFromYML,
      getConfigurationClient,
      logger
    );
    const request = { method: 'get', headers: { 'sec-fetch-dest': 'document' } };

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toBeCalledTimes(1);
    expect(toolkit.next).toBeCalledWith({
      headers: {
        'content-security-policy': "script-src 'unsafe-eval' 'self'; frame-ancestors 'self'",
      },
    });

    expect(configurationClient.getEntityConfig).toBeCalledTimes(1);

    expect(configurationClient.getEntityConfig).toBeCalledWith(
      CSP_RULES_FRAME_ANCESTORS_CONFIG_KEY,
      { headers: { 'sec-fetch-dest': 'document' } }
    );

    expect(getConfigurationClient).toBeCalledWith(request);
  });

  it('do not add frame-ancestors when request dest exists and shall skip', async () => {
    const coreSetup = coreMock.createSetup();
    const cspRulesFromYML = "script-src 'unsafe-eval' 'self'";

    const configurationClient = {
      getEntityConfig: jest.fn(),
    };

    const getConfigurationClient = jest.fn().mockReturnValue(configurationClient);

    const handler = createCspRulesPreResponseHandler(
      coreSetup,
      cspRulesFromYML,
      getConfigurationClient,
      logger
    );

    const cssSecFetchDest = 'css';
    const request = {
      method: 'get',
      headers: { 'sec-fetch-dest': cssSecFetchDest },
    };

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toBeCalledTimes(1);
    expect(toolkit.next).toBeCalledWith({});

    expect(configurationClient.getEntityConfig).toBeCalledTimes(0);
    expect(getConfigurationClient).toBeCalledTimes(0);
  });

  it('do not add frame-ancestors when request dest does not exist', async () => {
    const coreSetup = coreMock.createSetup();
    const cspRulesFromYML = "script-src 'unsafe-eval' 'self'";

    const configurationClient = {
      getEntityConfig: jest.fn(),
    };

    const getConfigurationClient = jest.fn().mockReturnValue(configurationClient);

    const handler = createCspRulesPreResponseHandler(
      coreSetup,
      cspRulesFromYML,
      getConfigurationClient,
      logger
    );

    const request = {
      method: 'get',
      headers: {},
    };

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toBeCalledTimes(1);
    expect(toolkit.next).toBeCalledWith({});

    expect(configurationClient.getEntityConfig).toBeCalledTimes(0);
    expect(getConfigurationClient).toBeCalledTimes(0);
  });

  it('use default values when getting client throws error and CSP from YML has no frame-ancestors', async () => {
    const coreSetup = coreMock.createSetup();
    const cspRulesFromYML = "script-src 'unsafe-eval' 'self'";

    const getConfigurationClient = jest.fn().mockImplementation(() => {
      throw new Error(ERROR_MESSAGE);
    });

    const handler = createCspRulesPreResponseHandler(
      coreSetup,
      cspRulesFromYML,
      getConfigurationClient,
      logger
    );

    const request = {
      method: 'get',
      headers: { 'sec-fetch-dest': 'document' },
    };

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toHaveBeenCalledTimes(1);
    expect(toolkit.next).toHaveBeenCalledWith({
      headers: {
        'content-security-policy': "script-src 'unsafe-eval' 'self'; frame-ancestors 'self'",
      },
    });

    expect(getConfigurationClient).toBeCalledWith(request);
  });

  it('do not modify when getting client throws error and CSP from YML has frame-ancestors', async () => {
    const coreSetup = coreMock.createSetup();
    const cspRulesFromYML = "script-src 'unsafe-eval' 'self'; frame-ancestors localsystem";

    const getConfigurationClient = jest.fn().mockImplementation(() => {
      throw new Error(ERROR_MESSAGE);
    });

    const handler = createCspRulesPreResponseHandler(
      coreSetup,
      cspRulesFromYML,
      getConfigurationClient,
      logger
    );

    const request = {
      method: 'get',
      headers: { 'sec-fetch-dest': 'document' },
    };

    toolkit.next.mockReturnValue('next' as any);

    const result = await handler(request, {} as any, toolkit);

    expect(result).toEqual('next');

    expect(toolkit.next).toHaveBeenCalledTimes(1);
    expect(toolkit.next).toHaveBeenCalledWith({
      headers: {
        'content-security-policy': cspRulesFromYML,
      },
    });

    expect(getConfigurationClient).toBeCalledWith(request);
  });
});

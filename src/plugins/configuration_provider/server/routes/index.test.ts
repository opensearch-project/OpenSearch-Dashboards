/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  defineRoutes,
  errorResponse,
  handleDeleteCspRules,
  handleExistsCspRules,
  handleGetCspRules,
  handleUpdateCspRules,
} from '.';
import { loggerMock } from '@osd/logging/target/mocks';
import { httpServiceMock } from '../../../../core/server/mocks';

const ERROR_MESSAGE = 'Service unavailable';

const ERROR_RESPONSE = {
  statusCode: 500,
};

describe('configuration provider routes', () => {
  describe('defineRoutes', () => {
    it('check route paths are defined', () => {
      const router = httpServiceMock.createRouter();
      const configurationClient = {
        existsCspRules: jest.fn().mockReturnValue(true),
        getCspRules: jest.fn().mockReturnValue(''),
      };

      const getConfigurationClient = jest.fn().mockReturnValue(configurationClient);

      const logger = loggerMock.create();

      defineRoutes(router, getConfigurationClient, logger);

      expect(router.get).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/configuration_provider/existsCspRules',
        }),
        expect.any(Function)
      );

      expect(router.get).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/configuration_provider/getCspRules',
        }),
        expect.any(Function)
      );

      expect(router.post).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/configuration_provider/updateCspRules',
        }),
        expect.any(Function)
      );

      expect(router.post).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/configuration_provider/deleteCspRules',
        }),
        expect.any(Function)
      );
    });
  });

  describe('handleExistsCspRules', () => {
    it('return true when client returns true', async () => {
      const existsValue = true;

      const client = {
        existsCspRules: jest.fn().mockReturnValue(existsValue),
      };

      const okResponse = {
        statusCode: 200,
      };

      const response = {
        ok: jest.fn().mockReturnValue(okResponse),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleExistsCspRules(client, response, logger);

      expect(returnedResponse).toBe(okResponse);

      expect(client.existsCspRules).toBeCalledTimes(1);

      expect(response.ok).toBeCalledWith({
        body: {
          exists: existsValue,
        },
      });

      expect(logger.error).not.toBeCalled();
    });

    it('return false when client returns false', async () => {
      const existsValue = false;

      const client = {
        existsCspRules: jest.fn().mockReturnValue(existsValue),
      };

      const okResponse = {
        statusCode: 200,
      };

      const response = {
        ok: jest.fn().mockReturnValue(okResponse),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleExistsCspRules(client, response, logger);

      expect(returnedResponse).toBe(okResponse);

      expect(client.existsCspRules).toBeCalledTimes(1);

      expect(response.ok).toBeCalledWith({
        body: {
          exists: existsValue,
        },
      });

      expect(logger.error).not.toBeCalled();
    });

    it('return error response when client throws error', async () => {
      const error = new Error(ERROR_MESSAGE);
      const client = {
        existsCspRules: jest.fn().mockImplementation(() => {
          throw error;
        }),
      };

      const response = {
        custom: jest.fn().mockReturnValue(ERROR_RESPONSE),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleExistsCspRules(client, response, logger);

      expect(returnedResponse).toBe(ERROR_RESPONSE);

      expect(client.existsCspRules).toBeCalledTimes(1);

      expect(response.custom).toBeCalledWith({
        body: error,
        statusCode: 500,
      });

      expect(logger.error).toBeCalledWith(error);
    });
  });

  describe('handleGetCspRules', () => {
    it('return CSP rules when client returns CSP rules', async () => {
      const cspRules = "frame-ancestors 'self'";

      const client = {
        getCspRules: jest.fn().mockReturnValue(cspRules),
      };

      const okResponse = {
        statusCode: 200,
      };

      const response = {
        ok: jest.fn().mockReturnValue(okResponse),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleGetCspRules(client, response, logger);

      expect(returnedResponse).toBe(okResponse);

      expect(client.getCspRules).toBeCalledTimes(1);

      expect(response.ok).toBeCalledWith({
        body: {
          cspRules,
        },
      });

      expect(logger.error).not.toBeCalled();
    });

    it('return error response when client throws error', async () => {
      const error = new Error(ERROR_MESSAGE);

      const client = {
        getCspRules: jest.fn().mockImplementation(() => {
          throw error;
        }),
      };

      const response = {
        custom: jest.fn().mockReturnValue(ERROR_RESPONSE),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleGetCspRules(client, response, logger);

      expect(returnedResponse).toBe(ERROR_RESPONSE);

      expect(client.getCspRules).toBeCalledTimes(1);

      expect(response.custom).toBeCalledWith({
        body: error,
        statusCode: 500,
      });

      expect(logger.error).toBeCalledWith(error);
    });
  });

  describe('handleUpdateCspRules', () => {
    it('return updated CSP rules when client updates CSP rules', async () => {
      const cspRules = "frame-ancestors 'self'";

      const client = {
        updateCspRules: jest.fn().mockReturnValue(cspRules),
      };

      const okResponse = {
        statusCode: 200,
      };

      const request = {
        body: {
          value: cspRules,
        },
      };

      const response = {
        ok: jest.fn().mockReturnValue(okResponse),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleUpdateCspRules(client, request, response, logger);

      expect(returnedResponse).toBe(okResponse);

      expect(client.updateCspRules).toBeCalledTimes(1);

      expect(response.ok).toBeCalledWith({
        body: {
          updatedRules: cspRules,
        },
      });

      expect(logger.error).not.toBeCalled();
    });

    it('return error response when client throws error', async () => {
      const cspRules = "frame-ancestors 'self'";

      const error = new Error(ERROR_MESSAGE);

      const client = {
        updateCspRules: jest.fn().mockImplementation(() => {
          throw error;
        }),
      };

      const request = {
        body: {
          value: cspRules,
        },
      };

      const response = {
        custom: jest.fn().mockReturnValue(ERROR_RESPONSE),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleUpdateCspRules(client, request, response, logger);

      expect(returnedResponse).toBe(ERROR_RESPONSE);

      expect(client.updateCspRules).toBeCalledTimes(1);

      expect(response.custom).toBeCalledWith({
        body: error,
        statusCode: 500,
      });

      expect(logger.error).toBeCalledWith(error);
    });

    it('return error response when input is empty', async () => {
      const emptyCspRules = '  ';
      const error = new Error('Cannot update CSP rules to emtpy!');

      const client = {
        updateCspRules: jest.fn(),
      };

      const request = {
        body: {
          value: emptyCspRules,
        },
      };

      const response = {
        custom: jest.fn().mockReturnValue(ERROR_RESPONSE),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleUpdateCspRules(client, request, response, logger);

      expect(returnedResponse).toBe(ERROR_RESPONSE);

      expect(client.updateCspRules).not.toBeCalled();

      expect(response.custom).toBeCalledWith({
        body: error,
        statusCode: 500,
      });

      expect(logger.error).toBeCalledWith(error);
    });
  });

  describe('handleDeleteCspRules', () => {
    it('return deleted CSP rules when client deletes CSP rules', async () => {
      const cspRulesName = 'csp.rules';

      const client = {
        deleteCspRules: jest.fn().mockReturnValue(cspRulesName),
      };

      const okResponse = {
        statusCode: 200,
      };

      const response = {
        ok: jest.fn().mockReturnValue(okResponse),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleDeleteCspRules(client, response, logger);

      expect(returnedResponse).toBe(okResponse);

      expect(client.deleteCspRules).toBeCalledTimes(1);

      expect(response.ok).toBeCalledWith({
        body: {
          deletedCspRulesName: cspRulesName,
        },
      });

      expect(logger.error).not.toBeCalled();
    });

    it('return error response when client throws error', async () => {
      const error = new Error(ERROR_MESSAGE);

      const client = {
        deleteCspRules: jest.fn().mockImplementation(() => {
          throw error;
        }),
      };

      const response = {
        custom: jest.fn().mockReturnValue(ERROR_RESPONSE),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleDeleteCspRules(client, response, logger);

      expect(returnedResponse).toBe(ERROR_RESPONSE);

      expect(client.deleteCspRules).toBeCalledTimes(1);

      expect(response.custom).toBeCalledWith({
        body: error,
        statusCode: 500,
      });

      expect(logger.error).toBeCalledWith(error);
    });
  });

  describe('errorResponse', () => {
    it('return default 500 statusCode', () => {
      const response = {
        custom: jest.fn(),
      };

      const error = {
        message: ERROR_MESSAGE,
      };

      errorResponse(response, error);

      expect(response.custom).toBeCalledWith({
        statusCode: 500,
        body: error,
      });
    });

    it('return input statusCode', () => {
      const response = {
        custom: jest.fn(),
      };

      const error = {
        statusCode: 400,
        message: ERROR_MESSAGE,
      };

      errorResponse(response, error);

      expect(response.custom).toBeCalledWith({
        statusCode: 400,
        body: error,
      });
    });
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServiceMock } from '../../../../core/server/mocks';
import { loggerMock } from '@osd/logging/target/mocks';
import {
  defineRoutes,
  handleDeleteEntityConfig,
  handleGetConfig,
  handleGetEntityConfig,
  handleUpdateEntityConfig,
} from '.';

const ERROR_MESSAGE = 'Service unavailable';

const ERROR_RESPONSE = {
  statusCode: 500,
};

const ENTITY_NAME = 'config1';
const ENTITY_VALUE = 'value1';
const ENTITY_NEW_VALUE = 'newValue1';

describe('application config routes', () => {
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
          path: '/api/appconfig',
        }),
        expect.any(Function)
      );

      expect(router.get).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/appconfig/{entity}',
        }),
        expect.any(Function)
      );

      expect(router.post).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/appconfig/{entity}',
        }),
        expect.any(Function)
      );

      expect(router.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/appconfig/{entity}',
        }),
        expect.any(Function)
      );
    });
  });

  describe('handleGetConfig', () => {
    it('returns configurations when client returns', async () => {
      const configurations = {
        config1: 'value1',
        config2: 'value2',
      };

      const client = {
        getConfig: jest.fn().mockReturnValue(configurations),
      };

      const getConfigurationClient = jest.fn().mockReturnValue(client);

      const request = {};

      const okResponse = {
        statusCode: 200,
      };

      const response = {
        ok: jest.fn().mockReturnValue(okResponse),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleGetConfig(
        getConfigurationClient,
        request,
        response,
        logger
      );

      expect(returnedResponse).toBe(okResponse);

      expect(response.ok).toBeCalledWith({
        body: {
          value: configurations,
        },
      });

      expect(getConfigurationClient).toBeCalledWith(request);
    });

    it('return error response when client throws error', async () => {
      const error = new Error(ERROR_MESSAGE);

      const client = {
        getConfig: jest.fn().mockImplementation(() => {
          throw error;
        }),
      };

      const getConfigurationClient = jest.fn().mockReturnValue(client);

      const request = {};

      const response = {
        customError: jest.fn().mockReturnValue(ERROR_RESPONSE),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleGetConfig(
        getConfigurationClient,
        request,
        response,
        logger
      );

      expect(returnedResponse).toBe(ERROR_RESPONSE);

      expect(client.getConfig).toBeCalledTimes(1);

      expect(response.customError).toBeCalledWith({
        body: error,
        statusCode: 500,
      });

      expect(logger.error).toBeCalledWith(error);
      expect(getConfigurationClient).toBeCalledWith(request);
    });
  });

  describe('handleGetEntityConfig', () => {
    it('returns value when client returns value', async () => {
      const client = {
        getEntityConfig: jest.fn().mockReturnValue(ENTITY_VALUE),
      };

      const getConfigurationClient = jest.fn().mockReturnValue(client);

      const okResponse = {
        statusCode: 200,
      };

      const request = {
        params: {
          entity: ENTITY_NAME,
        },
      };

      const response = {
        ok: jest.fn().mockReturnValue(okResponse),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleGetEntityConfig(
        getConfigurationClient,
        request,
        response,
        logger
      );

      expect(returnedResponse).toBe(okResponse);

      expect(response.ok).toBeCalledWith({
        body: {
          value: ENTITY_VALUE,
        },
      });

      expect(getConfigurationClient).toBeCalledWith(request);
    });

    it('return error response when client throws error', async () => {
      const error = new Error(ERROR_MESSAGE);

      const client = {
        getEntityConfig: jest.fn().mockImplementation(() => {
          throw error;
        }),
      };

      const getConfigurationClient = jest.fn().mockReturnValue(client);

      const request = {
        params: {
          entity: ENTITY_NAME,
        },
      };

      const response = {
        customError: jest.fn().mockReturnValue(ERROR_RESPONSE),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleGetEntityConfig(
        getConfigurationClient,
        request,
        response,
        logger
      );

      expect(returnedResponse).toBe(ERROR_RESPONSE);

      expect(client.getEntityConfig).toBeCalledTimes(1);

      expect(response.customError).toBeCalledWith({
        body: error,
        statusCode: 500,
      });

      expect(logger.error).toBeCalledWith(error);

      expect(getConfigurationClient).toBeCalledWith(request);
    });
  });

  describe('handleUpdateEntityConfig', () => {
    it('return success when client succeeds', async () => {
      const client = {
        updateEntityConfig: jest.fn().mockReturnValue(ENTITY_NEW_VALUE),
      };

      const getConfigurationClient = jest.fn().mockReturnValue(client);

      const okResponse = {
        statusCode: 200,
      };

      const request = {
        params: {
          entity: ENTITY_NAME,
        },
        body: {
          newValue: ENTITY_NEW_VALUE,
        },
      };

      const response = {
        ok: jest.fn().mockReturnValue(okResponse),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleUpdateEntityConfig(
        getConfigurationClient,
        request,
        response,
        logger
      );

      expect(returnedResponse).toBe(okResponse);

      expect(client.updateEntityConfig).toBeCalledTimes(1);

      expect(response.ok).toBeCalledWith({
        body: {
          newValue: ENTITY_NEW_VALUE,
        },
      });

      expect(logger.error).not.toBeCalled();

      expect(getConfigurationClient).toBeCalledWith(request);
    });

    it('return error response when client fails', async () => {
      const error = new Error(ERROR_MESSAGE);

      const client = {
        updateEntityConfig: jest.fn().mockImplementation(() => {
          throw error;
        }),
      };

      const getConfigurationClient = jest.fn().mockReturnValue(client);

      const request = {
        params: {
          entity: ENTITY_NAME,
        },
        body: {
          newValue: ENTITY_NEW_VALUE,
        },
      };

      const response = {
        customError: jest.fn().mockReturnValue(ERROR_RESPONSE),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleUpdateEntityConfig(
        getConfigurationClient,
        request,
        response,
        logger
      );

      expect(returnedResponse).toBe(ERROR_RESPONSE);

      expect(client.updateEntityConfig).toBeCalledTimes(1);

      expect(response.customError).toBeCalledWith({
        body: error,
        statusCode: 500,
      });

      expect(logger.error).toBeCalledWith(error);

      expect(getConfigurationClient).toBeCalledWith(request);
    });
  });

  describe('handleDeleteEntityConfig', () => {
    it('returns successful response when client succeeds', async () => {
      const client = {
        deleteEntityConfig: jest.fn().mockReturnValue(ENTITY_NAME),
      };

      const getConfigurationClient = jest.fn().mockReturnValue(client);

      const okResponse = {
        statusCode: 200,
      };

      const request = {
        params: {
          entity: ENTITY_NAME,
        },
      };

      const response = {
        ok: jest.fn().mockReturnValue(okResponse),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleDeleteEntityConfig(
        getConfigurationClient,
        request,
        response,
        logger
      );

      expect(returnedResponse).toBe(okResponse);

      expect(client.deleteEntityConfig).toBeCalledTimes(1);

      expect(response.ok).toBeCalledWith({
        body: {
          deletedEntity: ENTITY_NAME,
        },
      });

      expect(logger.error).not.toBeCalled();
      expect(getConfigurationClient).toBeCalledWith(request);
    });

    it('return error response when client fails', async () => {
      const error = new Error(ERROR_MESSAGE);

      const client = {
        deleteEntityConfig: jest.fn().mockImplementation(() => {
          throw error;
        }),
      };

      const getConfigurationClient = jest.fn().mockReturnValue(client);

      const request = {
        params: {
          entity: ENTITY_NAME,
        },
      };

      const response = {
        customError: jest.fn().mockReturnValue(ERROR_RESPONSE),
      };

      const logger = loggerMock.create();

      const returnedResponse = await handleDeleteEntityConfig(
        getConfigurationClient,
        request,
        response,
        logger
      );

      expect(returnedResponse).toBe(ERROR_RESPONSE);

      expect(client.deleteEntityConfig).toBeCalledTimes(1);

      expect(response.customError).toBeCalledWith({
        body: error,
        statusCode: 500,
      });

      expect(logger.error).toBeCalledWith(error);

      expect(getConfigurationClient).toBeCalledWith(request);
    });
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineRoutes, errorResponse } from '.';
import { loggerMock } from '@osd/logging/target/mocks';
import { httpServiceMock } from '../../../../core/server/mocks';

const ERROR_MESSAGE = 'Service unavailable';

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

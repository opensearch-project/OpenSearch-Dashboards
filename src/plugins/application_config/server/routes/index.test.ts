/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServiceMock } from '../../../../core/server/mocks';
import { loggerMock } from '@osd/logging/target/mocks';
import { defineRoutes } from '.';

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
});

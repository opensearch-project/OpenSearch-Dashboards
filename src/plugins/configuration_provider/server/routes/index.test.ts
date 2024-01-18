/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineRoutes } from '.';
import { loggerMock } from '@osd/logging/target/mocks';
import { httpServiceMock } from '../../../../core/server/mocks';

describe('index ts', () => {
  it('routes', () => {
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

/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { HealthCheckServiceSetup } from './types';

const createServiceMock = (): jest.Mocked<HealthCheckServiceSetup> => ({
  register: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
});

export const healthCheckServiceMock = {
  createSetupContract: createServiceMock,
  createStartContract: createServiceMock,
};

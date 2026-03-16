/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { EnvironmentService, EnvironmentServiceSetup } from './environment';
import { MlCardState } from '../../types';

const createSetupMock = (): jest.Mocked<EnvironmentServiceSetup> => {
  const setup = {
    update: jest.fn(),
  };
  return setup;
};

const createMock = (): jest.Mocked<PublicMethodsOf<EnvironmentService>> => {
  const service = {
    setup: jest.fn(),
    getEnvironment: jest.fn(() => ({
      ml: () => MlCardState.ENABLED,
    })),
  };
  service.setup.mockImplementation(createSetupMock);
  return service;
};

export const environmentServiceMock = {
  createSetup: createSetupMock,
  create: createMock,
};

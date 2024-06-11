/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SecurityServiceSetup } from './types';

const createSetupContractMock = () => {
  const setupContract: jest.Mocked<SecurityServiceSetup> = {
    readonlyService: jest.fn(),
    registerReadonlyService: jest.fn(),
  };
  return setupContract;
};

export const securityServiceMock = {
  createSetupContract: createSetupContractMock,
};

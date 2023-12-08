/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CrossCompatibilityServiceStart } from './types';

const createStartContractMock = () => {
  const startContract: jest.Mocked<CrossCompatibilityServiceStart> = {
    verifyOpenSearchPluginsState: jest.fn().mockReturnValue(Promise.resolve({})),
  };
  return startContract;
};

export const crossCompatibilityServiceMock = {
  createStartContract: createStartContractMock,
};

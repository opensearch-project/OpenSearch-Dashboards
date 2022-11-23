/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import type { PublicMethodsOf } from '@osd/utility-types';
import { ExtensionsService, ExtensionsServiceSetup } from './extensions_service';

type ExtensionsServiceMock = jest.Mocked<PublicMethodsOf<ExtensionsService>>;

const createSetupContractMock = (): ExtensionsServiceSetup => ({
  contracts: new Map(),
  initialized: true,
});
const createStartContractMock = () => ({ contracts: new Map() });

const createServiceMock = (): ExtensionsServiceMock => ({
  discover: jest.fn(),
  setup: jest.fn().mockResolvedValue(createSetupContractMock()),
  start: jest.fn().mockResolvedValue(createStartContractMock()),
  stop: jest.fn(),
});

function createUiExtensions() {
  return {
    browserConfigs: new Map(),
    internal: new Map(),
    public: new Map(),
  };
}

export const extensionServiceMock = {
  create: createServiceMock,
  createSetupContract: createSetupContractMock,
  createStartContract: createStartContractMock,
  createUiExtensions,
};

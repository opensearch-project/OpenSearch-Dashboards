/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAuthenticationMethodRegistry } from './authentication_methods_registry';

const create = () =>
  (({
    getAllAuthenticationMethods: jest.fn(),
    getAuthenticationMethod: jest.fn(),
  } as unknown) as jest.Mocked<IAuthenticationMethodRegistry>);

export const authenticationMethodRegistryMock = { create };

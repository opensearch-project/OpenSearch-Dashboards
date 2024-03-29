/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAuthenticationMethodRegistery } from './authentication_methods_registry';

const create = () =>
  (({
    getAllAuthenticationMethods: jest.fn(),
    getAuthenticationMethod: jest.fn(),
  } as unknown) as jest.Mocked<IAuthenticationMethodRegistery>);

export const authenticationMethodRegisteryMock = { create };

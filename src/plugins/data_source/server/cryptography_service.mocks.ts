/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CryptographyServiceSetup } from './cryptography_service';

const create = () =>
  (({
    encryptAndEncode: jest.fn(),
    decodeAndDecrypt: jest.fn(),
  } as unknown) as jest.Mocked<CryptographyServiceSetup>);

export const cryptographyServiceSetupMock = { create };

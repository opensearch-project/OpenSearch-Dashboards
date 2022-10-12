/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { loggingSystemMock } from '../../../core/server/mocks';
import { DataSourcePluginConfigType } from '../config';
import { CryptographyService } from './cryptography_service';

const logger = loggingSystemMock.create();

describe('Cryptography Service', () => {
  let service: CryptographyService;

  beforeEach(() => {
    const mockLogger = logger.get('cryptography-service-test');
    service = new CryptographyService(mockLogger);
  });

  afterEach(() => {
    service.stop();
    jest.clearAllMocks();
  });

  // TODO: Add more UTs after Jest issue resolved https://github.com/facebook/jest/issues/13349
  describe('setup()', () => {
    test('invalid wrapping key size throws error', () => {
      const config = {
        enabled: true,
        encryption: {
          wrappingKeyName: 'dummy',
          wrappingKeyNamespace: 'dummy',
          wrappingKey: new Array(31).fill(0),
        },
      } as DataSourcePluginConfigType;

      const expectedErrorMsg = `Wrapping key size should be 32 bytes, as used in envelope encryption. Current wrapping key size: '${config.encryption.wrappingKey.length}' bytes`;

      expect(() => {
        service.setup(config);
      }).toThrowError(new Error(expectedErrorMsg));
    });

    test('exposes proper contract', () => {
      const config = {
        enabled: true,
        encryption: {
          wrappingKeyName: 'dummy',
          wrappingKeyNamespace: 'dummy',
          wrappingKey: new Array(32).fill(0),
        },
      } as DataSourcePluginConfigType;
      const setup = service.setup(config);
      expect(setup).toHaveProperty('encryptAndEncode');
      expect(setup).toHaveProperty('decodeAndDecrypt');
    });
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CryptographyClient } from './cryptography_client';
import { randomBytes } from 'crypto';

const dummyWrappingKeyName = 'dummy_wrapping_key_name';
const dummyWrappingKeyNamespace = 'dummy_wrapping_key_namespace';

test('Invalid wrapping key size throws error', () => {
  const dummyRandomBytes = [...randomBytes(31)];
  const expectedErrorMsg = `Wrapping key size shoule be 32 bytes, as used in envelope encryption. Current wrapping key size: '${dummyRandomBytes.length}' bytes`;
  expect(() => {
    new CryptographyClient(dummyWrappingKeyName, dummyWrappingKeyNamespace, dummyRandomBytes);
  }).toThrowError(new Error(expectedErrorMsg));
});

describe('Test encrpyt and decrypt module', () => {
  const dummyPlainText = 'dummy';
  const dummyNumArray1 = [...randomBytes(32)];
  const dummyNumArray2 = [...randomBytes(32)];

  describe('Positive test cases', () => {
    test('Encrypt and Decrypt with same in memory keyring', async () => {
      const cryptographyClient = new CryptographyClient(
        dummyWrappingKeyName,
        dummyWrappingKeyNamespace,
        dummyNumArray1
      );
      const encrypted = await cryptographyClient.encryptAndEncode(dummyPlainText);
      const outputText = await cryptographyClient.decodeAndDecrypt(encrypted);
      expect(outputText).toBe(dummyPlainText);
    });
    test('Encrypt and Decrypt with two different keyrings with exact same identifiers', async () => {
      const cryptographyClient1 = new CryptographyClient(
        dummyWrappingKeyName,
        dummyWrappingKeyNamespace,
        dummyNumArray1
      );
      const encrypted = await cryptographyClient1.encryptAndEncode(dummyPlainText);

      const cryptographyClient2 = new CryptographyClient(
        dummyWrappingKeyName,
        dummyWrappingKeyNamespace,
        dummyNumArray1
      );
      const outputText = await cryptographyClient2.decodeAndDecrypt(encrypted);
      expect(cryptographyClient1 === cryptographyClient2).toBeFalsy();
      expect(outputText).toBe(dummyPlainText);
    });
  });

  describe('Negative test cases', () => {
    const defaultWrappingKeyName = 'changeme';
    const defaultWrappingKeyNamespace = 'changeme';
    const expectedErrorMsg = 'unencryptedDataKey has not been set';
    test('Encrypt and Decrypt with different key names', async () => {
      const cryptographyClient1 = new CryptographyClient(
        dummyWrappingKeyName,
        dummyWrappingKeyNamespace,
        dummyNumArray1
      );
      const encrypted = await cryptographyClient1.encryptAndEncode(dummyPlainText);

      const cryptographyClient2 = new CryptographyClient(
        defaultWrappingKeyName,
        dummyWrappingKeyNamespace,
        dummyNumArray1
      );
      try {
        await cryptographyClient2.decodeAndDecrypt(encrypted);
      } catch (error) {
        expect(error.message).toMatch(expectedErrorMsg);
      }
    });
    test('Encrypt and Decrypt with different key namespaces', async () => {
      const cryptographyClient1 = new CryptographyClient(
        dummyWrappingKeyName,
        dummyWrappingKeyNamespace,
        dummyNumArray1
      );
      const encrypted = await cryptographyClient1.encryptAndEncode(dummyPlainText);

      const cryptographyClient2 = new CryptographyClient(
        dummyWrappingKeyName,
        defaultWrappingKeyNamespace,
        dummyNumArray1
      );
      try {
        await cryptographyClient2.decodeAndDecrypt(encrypted);
      } catch (error) {
        expect(error.message).toMatch(expectedErrorMsg);
      }
    });
    test('Encrypt and Decrypt with different wrapping keys', async () => {
      const cryptographyClient1 = new CryptographyClient(
        dummyWrappingKeyName,
        dummyWrappingKeyNamespace,
        dummyNumArray1
      );
      const encrypted = await cryptographyClient1.encryptAndEncode(dummyPlainText);

      const cryptographyClient2 = new CryptographyClient(
        dummyWrappingKeyName,
        dummyWrappingKeyNamespace,
        dummyNumArray2
      );
      try {
        await cryptographyClient2.decodeAndDecrypt(encrypted);
      } catch (error) {
        expect(error.message).toMatch(expectedErrorMsg);
      }
    });
  });
});

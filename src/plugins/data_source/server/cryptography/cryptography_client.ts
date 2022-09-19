/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildClient,
  CommitmentPolicy,
  RawAesKeyringNode,
  RawAesWrappingSuiteIdentifier,
} from '@aws-crypto/client-node';

export const ENCODING_STRATEGY: BufferEncoding = 'base64';
export const WRAPPING_KEY_SIZE: number = 32;

export class CryptographyClient {
  private readonly commitmentPolicy = CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT;
  private readonly wrappingSuite = RawAesWrappingSuiteIdentifier.AES256_GCM_IV12_TAG16_NO_PADDING;

  private keyring: RawAesKeyringNode;

  private readonly encrypt: Function;
  private readonly decrypt: Function;

  /**
   * @param {string} wrappingKeyName name value to identify the AES key in a keyring
   * @param {string} wrappingKeyNamespace namespace value to identify the AES key in a keyring,
   * @param {number[]} wrappingKey 32 Bytes raw wrapping key used to perform envelope encryption
   */
  constructor(wrappingKeyName: string, wrappingKeyNamespace: string, wrappingKey: number[]) {
    if (wrappingKey.length !== WRAPPING_KEY_SIZE) {
      const wrappingKeySizeMismatchMsg = `Wrapping key size shoule be 32 bytes, as used in envelope encryption. Current wrapping key size: '${wrappingKey.length}' bytes`;
      throw new Error(wrappingKeySizeMismatchMsg);
    }

    // Create raw AES keyring
    this.keyring = new RawAesKeyringNode({
      keyName: wrappingKeyName,
      keyNamespace: wrappingKeyNamespace,
      unencryptedMasterKey: new Uint8Array(wrappingKey),
      wrappingSuite: this.wrappingSuite,
    });

    // Destructuring encrypt and decrypt functions from client
    const { encrypt, decrypt } = buildClient(this.commitmentPolicy);

    this.encrypt = encrypt;
    this.decrypt = decrypt;
  }

  /**
   * Input text content and output encrypted string encoded with ENCODING_STRATEGY
   * @param {string} plainText
   * @returns {Promise}
   */
  public async encryptAndEncode(plainText: string): Promise<string> {
    const result = await this.encrypt(this.keyring, plainText);
    return result.result.toString(ENCODING_STRATEGY);
  }

  /**
   * Input encrypted content and output decrypted string
   * @param {string} encrypted
   * @returns {Promise}
   */
  public async decodeAndDecrypt(encrypted: string): Promise<string> {
    const result = await this.decrypt(this.keyring, Buffer.from(encrypted, ENCODING_STRATEGY));
    return result.plaintext.toString();
  }
}

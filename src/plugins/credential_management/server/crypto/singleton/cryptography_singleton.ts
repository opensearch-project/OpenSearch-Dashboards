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

import {
  RawAesKeyringNode,
  buildClient,
  CommitmentPolicy,
  RawAesWrappingSuiteIdentifier,
} from '@aws-crypto/client-node';

import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';

const defaultPath = 'data/crypto_material';

export class CryptographySingleton {
  private static _instance: CryptographySingleton;

  private readonly _keyring: RawAesKeyringNode;

  private readonly _encrypt;
  private readonly _decrypt;

  private constructor(path: string, keyName: string, keyNamespace: string) {
    const wrappingSuite = RawAesWrappingSuiteIdentifier.AES256_GCM_IV12_TAG16_NO_PADDING;

    let cryptoMaterials;
    try {
      cryptoMaterials = JSON.parse(readFileSync(path, 'utf8'));
    } catch (err) {
      // Handle a file-not-found error
      if (err.code === 'ENOENT') {
        cryptoMaterials = JSON.parse(generateCryptoMaterials(path, keyName, keyNamespace));
      } else {
        throw err;
      }
    }

    const input = {
      keyName: cryptoMaterials.keyName,
      keyNamespace: cryptoMaterials.keyNamespace,
      unencryptedMasterKey: new Uint8Array(cryptoMaterials.unencryptedMasterKey.data),
      wrappingSuite,
    };

    this._keyring = new RawAesKeyringNode(input);

    const { encrypt, decrypt } = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT);

    this._encrypt = encrypt;
    this._decrypt = decrypt;
  }

  public async encrypt(plainText: string) {
    const result = await this._encrypt(this._keyring, plainText);
    return result.result.toString('base64');
  }

  public async decrypt(encrypted: Buffer): Promise<string> {
    const result = await this._decrypt(this._keyring, encrypted);
    return result.plaintext.toString();
  }

  public static getInstance(
    path = defaultPath,
    keyName = 'keyName',
    keyNamespace = 'keyNamespace'
  ): CryptographySingleton {
    if (!CryptographySingleton._instance) {
      CryptographySingleton._instance = new CryptographySingleton(path, keyName, keyNamespace);
    }

    return CryptographySingleton._instance;
  }
}

export const generateCryptoMaterials = function (
  path = defaultPath,
  keyName = 'keyName',
  keyNamespace = 'keyNamespace'
) {
  const cryptoMaterials = {
    keyName,
    keyNamespace,
    unencryptedMasterKey: randomBytes(32),
  };
  const input = JSON.stringify(cryptoMaterials);
  writeFileSync(path, input);
  console.log('Crypto materials generated!');

  return input;
};

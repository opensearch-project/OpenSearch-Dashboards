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
import { readFileSync, writeFile } from 'fs';
import { safeLoad } from 'js-yaml';

export class CryptoCli {
  private static _instance: CryptoCli;

  private readonly _keyring: RawAesKeyringNode;

  private readonly _encrypt;
  private readonly _decrypt;

  private constructor() {
    const wrappingSuite = RawAesWrappingSuiteIdentifier.AES256_GCM_IV12_TAG16_NO_PADDING;
    
    // TODO: Load config during bootstrap
    // TODO: Generate materials by default during bootstrap
    const cryptoMaterials = JSON.parse(readFileSync(CryptoCli.loadConfigAndGetPath('config/opensearch_dashboards.yml'), 'utf8'));

    const input = {
      keyName: cryptoMaterials.keyName,
      keyNamespace: cryptoMaterials.keyNamespace,
      unencryptedMasterKey: new Uint8Array(cryptoMaterials.unencryptedMasterKey.data),
      wrappingSuite: wrappingSuite,
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

  public async decrypt(encrypted: Buffer) {
    const result = await this._decrypt(this._keyring, encrypted);
    return result.plaintext.toString();
  }

  public static getInstance(): CryptoCli {
    if (!CryptoCli._instance) {
      CryptoCli._instance = new CryptoCli();
    }

    return CryptoCli._instance;
  }

  // TODO: Fine grain config loader
  public static loadConfigAndGetPath(path: string): string {
    const yaml = safeLoad(readFileSync(path, 'utf8'));
    if (yaml !== null && typeof(yaml) == 'object') {
      return JSON.parse(JSON.stringify(yaml))['multiDataSource.materialPath'];
    }
    console.error("Load failed! Please check the config path.");
    // Return Default Path
    return "./crypto_material";
  }

  public static generateCryptoMaterials(keyName: string, keyNamespace: string) {
    const cryptoMaterials = {
      "keyName": keyName,
      "keyNamespace": keyNamespace,
      "unencryptedMasterKey": randomBytes(32),
    };
    
    const path = CryptoCli.loadConfigAndGetPath('./config/opensearch_dashboards.yml');

    writeFile (path, JSON.stringify(cryptoMaterials), function(err) {
      if (err) throw err;
      console.log('crypto materials generated successfully!');
      }
    );
  }
}

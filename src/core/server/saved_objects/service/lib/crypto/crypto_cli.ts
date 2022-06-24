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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  RawAesKeyringNode,
  buildClient,
  CommitmentPolicy,
  RawAesWrappingSuiteIdentifier,
} from '@aws-crypto/client-node';

import {
  wrappingKeyName,
  wrappingKeyNamespace,
  unencrypted_wrappingkey,
} from './crypto_metadata.json';

export class CryptoCli {
  private static _instance: CryptoCli;

  private readonly _keyring: RawAesKeyringNode;

  private readonly _encrypt;
  private readonly _decrypt;

  private constructor() {
    const wrappingSuite = RawAesWrappingSuiteIdentifier.AES256_GCM_IV12_TAG16_NO_PADDING;

    const input = {
      keyName: wrappingKeyName,
      keyNamespace: wrappingKeyNamespace,
      unencryptedMasterKey: new Uint8Array(unencrypted_wrappingkey),
      wrappingSuite,
    };

    this._keyring = new RawAesKeyringNode(input);

    const { encrypt, decrypt } = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT);

    this._encrypt = encrypt;
    this._decrypt = decrypt;
  }

  public static getInstance(): CryptoCli {
    if (!CryptoCli._instance) {
      CryptoCli._instance = new CryptoCli();
    }

    return CryptoCli._instance;
  }

  public async encrypt(plainText: string) {
    const result = await this._encrypt(this._keyring, plainText);
    return result.result.toString('base64');
  }

  public async decrypt(encrypted: Buffer) {
    const result = await this._decrypt(this._keyring, encrypted);
    return result.plaintext.toString();
  }
}

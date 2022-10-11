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
import { Logger } from '../../../../src/core/server';
import { DataSourcePluginConfigType } from '../config';

export const ENCODING_STRATEGY: BufferEncoding = 'base64';
export const WRAPPING_KEY_SIZE: number = 32;

export interface EncryptionContext {
  endpoint?: string;
}

export interface RefinedDecryptOutPut {
  decryptedText: string;
  encryptionContext: EncryptionContext;
}

export interface CryptographyServiceSetup {
  encryptAndEncode: (plainText: string, encryptionContext: EncryptionContext) => Promise<string>;
  decodeAndDecrypt: (encrypted: string) => Promise<RefinedDecryptOutPut>;
}

export class CryptographyService {
  // commitment policy to enable data key derivation and ECDSA signature
  private readonly commitmentPolicy = CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT;
  // algorithm suite identifier to adopt AES-GCM
  private readonly wrappingSuite = RawAesWrappingSuiteIdentifier.AES256_GCM_IV12_TAG16_NO_PADDING;

  constructor(private logger: Logger) {}

  setup(config: DataSourcePluginConfigType): CryptographyServiceSetup {
    // Fetch configs used to create credential saved objects client wrapper
    const { wrappingKeyName, wrappingKeyNamespace, wrappingKey } = config.encryption;

    if (wrappingKey.length !== WRAPPING_KEY_SIZE) {
      const wrappingKeySizeMismatchMsg = `Wrapping key size should be 32 bytes, as used in envelope encryption. Current wrapping key size: '${wrappingKey.length}' bytes`;
      this.logger.error(wrappingKeySizeMismatchMsg);
      throw new Error(wrappingKeySizeMismatchMsg);
    }

    // Create raw AES keyring
    const keyring = new RawAesKeyringNode({
      keyName: wrappingKeyName,
      keyNamespace: wrappingKeyNamespace,
      unencryptedMasterKey: new Uint8Array(wrappingKey),
      wrappingSuite: this.wrappingSuite,
    });

    // Destructuring encrypt and decrypt functions from client
    const { encrypt, decrypt } = buildClient(this.commitmentPolicy);

    const encryptAndEncode = async (plainText: string, encryptionContext = {}): Promise<string> => {
      const result = await encrypt(keyring, plainText, {
        encryptionContext,
      });
      return result.result.toString(ENCODING_STRATEGY);
    };

    const decodeAndDecrypt = async (encrypted: string): Promise<RefinedDecryptOutPut> => {
      const { plaintext, messageHeader } = await decrypt(
        keyring,
        Buffer.from(encrypted, ENCODING_STRATEGY)
      );
      return {
        decryptedText: plaintext.toString(),
        encryptionContext: {
          endpoint: messageHeader.encryptionContext.endpoint,
        },
      };
    };

    return { encryptAndEncode, decodeAndDecrypt };
  }

  start() {}

  stop() {}
}

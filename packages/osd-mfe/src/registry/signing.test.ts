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

import { createHash } from 'crypto';

import { SCHEMA_VERSION, Registry, validate } from './schema';
import { canonicalRegistryString, REGISTRY_SIGNATURE_ALGORITHM } from './signing_common';
import { signRegistry, verifyRegistrySignature, RegistrySigningKey } from './signing';

const KEY: RegistrySigningKey = { keyId: 'mfe-test-hmac-1', secret: 's3cr3t-server-held-key' };

function baseRegistry(): Registry {
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: '2026-06-15T00:00:00.000Z',
    sharedDeps: { url: 'http://localhost:8080/shared-deps/', version: '3.5.0' },
    mfes: {
      inspector: {
        version: '3.5.0+aaa',
        remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
        scope: 'osdMfe_inspector',
        module: './public',
        integrity: 'sha384-abc',
      },
      data: {
        version: '3.5.0+bbb',
        remoteEntry: 'http://localhost:8080/mfe/data/remoteEntry.js',
        scope: 'osdMfe_data',
        module: './public',
      },
    },
  };
}

describe('canonicalRegistryString (deterministic, signature-stripped)', () => {
  it('is independent of object key order and whitespace', () => {
    const a: Registry = baseRegistry();
    // A logically-identical registry whose top-level keys are in a different order.
    const b = {
      mfes: a.mfes,
      sharedDeps: a.sharedDeps,
      generatedAt: a.generatedAt,
      schemaVersion: a.schemaVersion,
    } as Registry;
    expect(canonicalRegistryString(b)).toBe(canonicalRegistryString(a));
  });

  it('ignores the signature field (a signature can never sign itself)', () => {
    const unsigned = baseRegistry();
    const signed = signRegistry(unsigned, KEY);
    expect(signed.signature).toBeDefined();
    // Adding/removing the signature does not change the canonical bytes.
    expect(canonicalRegistryString(signed)).toBe(canonicalRegistryString(unsigned));
  });

  it('changes when any content byte changes', () => {
    const a = baseRegistry();
    const b = baseRegistry();
    b.mfes.inspector.version = '3.5.0+CHANGED';
    expect(canonicalRegistryString(b)).not.toBe(canonicalRegistryString(a));
  });
});

describe('signRegistry / verifyRegistrySignature (HMAC-SHA256, real key)', () => {
  it('signs with the configured algorithm + keyId and verifies a valid registry', () => {
    const signed = signRegistry(baseRegistry(), KEY);
    expect(signed.signature).toEqual({
      algorithm: REGISTRY_SIGNATURE_ALGORITHM,
      keyId: KEY.keyId,
      value: expect.any(String),
    });
    expect(
      verifyRegistrySignature(signed, {
        algorithm: REGISTRY_SIGNATURE_ALGORITHM,
        keyId: KEY.keyId,
        key: KEY.secret,
      })
    ).toEqual({ ok: true });
  });

  it('a signed registry still passes schema validate() (signature is well-formed)', () => {
    const signed = signRegistry(baseRegistry(), KEY);
    expect(validate(signed)).toEqual({ valid: true, errors: [] });
  });

  it('REJECTS a tampered registry (any byte change) fail-closed', () => {
    const signed = signRegistry(baseRegistry(), KEY);
    // Flip a single byte in the data the signature covers — e.g. repoint a remote.
    signed.mfes.inspector.remoteEntry = 'http://evil.example.com/mfe/inspector/remoteEntry.js';
    const result = verifyRegistrySignature(signed, {
      algorithm: REGISTRY_SIGNATURE_ALGORITHM,
      keyId: KEY.keyId,
      key: KEY.secret,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/tampered|different key/i);
  });

  it('REJECTS a valid signature verified with the WRONG key (the key is what matters)', () => {
    const signed = signRegistry(baseRegistry(), KEY);
    const result = verifyRegistrySignature(signed, {
      algorithm: REGISTRY_SIGNATURE_ALGORITHM,
      keyId: KEY.keyId,
      key: 'a-different-attacker-key',
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/does not match|different key/i);
  });

  it('REJECTS an unsigned registry when verification is required (fail-closed)', () => {
    const result = verifyRegistrySignature(baseRegistry(), {
      algorithm: REGISTRY_SIGNATURE_ALGORITHM,
      keyId: KEY.keyId,
      key: KEY.secret,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/no signature/i);
  });

  it('REJECTS a mismatched algorithm', () => {
    const signed = signRegistry(baseRegistry(), KEY);
    signed.signature!.algorithm = 'totally-made-up';
    const result = verifyRegistrySignature(signed, {
      algorithm: REGISTRY_SIGNATURE_ALGORITHM,
      keyId: KEY.keyId,
      key: KEY.secret,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/algorithm/i);
  });

  it('REJECTS a non-base64 signature value', () => {
    const signed = signRegistry(baseRegistry(), KEY);
    signed.signature!.value = '!!! not base64 !!!';
    const result = verifyRegistrySignature(signed, {
      algorithm: REGISTRY_SIGNATURE_ALGORITHM,
      keyId: KEY.keyId,
      key: KEY.secret,
    });
    expect(result.ok).toBe(false);
  });

  it('content change yields a DIFFERENT signature (content-addressed authenticity)', () => {
    const sigA = signRegistry(baseRegistry(), KEY).signature!.value;
    const changed = baseRegistry();
    changed.mfes.data.version = '3.5.0+ccc';
    const sigB = signRegistry(changed, KEY).signature!.value;
    expect(sigA).not.toBe(sigB);
  });

  it('is NOT a bare hash: a plain SHA-384 of the canonical bytes does NOT verify', () => {
    // A "bare hash" approach (hash served next to the registry) is theater: a
    // tamperer recomputes it. Prove our signature requires the KEY by showing an
    // un-keyed digest of the same bytes is rejected.
    const signed = signRegistry(baseRegistry(), KEY);
    const bareHash = createHash('sha384')
      .update(canonicalRegistryString(signed), 'utf8')
      .digest('base64');
    signed.signature!.value = bareHash;
    const result = verifyRegistrySignature(signed, {
      algorithm: REGISTRY_SIGNATURE_ALGORITHM,
      keyId: KEY.keyId,
      key: KEY.secret,
    });
    expect(result.ok).toBe(false);
  });

  it('throws on an unsupported signing algorithm', () => {
    expect(() => signRegistry(baseRegistry(), { ...KEY, algorithm: 'RSA-PSS' })).toThrow(
      /unsupported algorithm/i
    );
  });
});

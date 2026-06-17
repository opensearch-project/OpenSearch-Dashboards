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

/**
 * Browser-side registry-signature verifier (Phase 12, Story 4).
 *
 * `verify_registry_web.ts` runs in the browser MFE bootstrap and verifies the
 * fetched registry's HMAC signature with the host-injected key BEFORE the
 * registry is used (fail-closed). It depends only on web globals (`crypto.subtle`,
 * `atob`, `TextEncoder`); jsdom 16 (this repo's jest env) ships `atob` +
 * `TextEncoder` but NO `crypto.subtle`, so we polyfill `globalThis.crypto` from
 * Node 22's API-compatible `crypto.webcrypto` for the duration of these tests.
 * The signing/canonicalization side is identical to the canonical Node signer
 * (`signing.ts`), so this test asserts the cross-platform contract: a registry
 * signed in Node verifies in the browser, byte-for-byte. Together with
 * `signing.test.ts` (canonicalization + Node verify) and `bootstrap_mfe.test.ts`
 * (bootstrap routing on a verifier spy), this proves the full read path: a
 * validly-signed registry verifies + resolves, and any tamper / wrong-key /
 * unsigned / malformed-envelope case is REJECTED with a clear reason.
 */

import { webcrypto } from 'crypto';
import { TextEncoder as NodeTextEncoder } from 'util';

import { SCHEMA_VERSION, Registry } from './schema';
import { signRegistry } from './signing';
import {
  REGISTRY_SIGNATURE_ALGORITHM,
  RegistryVerification,
  canonicalRegistryString,
} from './signing_common';
import { verifyRegistrySignatureWeb } from './verify_registry_web';

const KEY = { keyId: 'mfe-test-hmac-1', secret: 's3cr3t-server-held-key' };
const VERIFICATION: RegistryVerification = {
  algorithm: REGISTRY_SIGNATURE_ALGORITHM,
  keyId: KEY.keyId,
  key: KEY.secret,
};

/** Build a minimal valid registry. */
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

/**
 * Polyfill `globalThis.crypto` (Web Crypto) with Node 22's API-compatible
 * `crypto.webcrypto`, and `globalThis.TextEncoder` from `util`. jsdom 16 (this
 * repo's jest env) ships `atob` but no `crypto.subtle` or `TextEncoder`, so
 * without these polyfills `verify_registry_web` would always fall into its
 * "Web Crypto unavailable" or `TextEncoder is not defined` fail-closed branch —
 * the first is itself a tested case below, but the rest of the suite needs a
 * working subtle + encoder. We restore the original descriptors in `afterAll`
 * so other tests that may rely on the jsdom defaults are unaffected.
 */
const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
const originalTextEncoderDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'TextEncoder');

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'TextEncoder', {
    value: NodeTextEncoder,
    configurable: true,
    writable: true,
  });
});

afterAll(() => {
  if (originalCryptoDescriptor) {
    Object.defineProperty(globalThis, 'crypto', originalCryptoDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, 'crypto');
  }
  if (originalTextEncoderDescriptor) {
    Object.defineProperty(globalThis, 'TextEncoder', originalTextEncoderDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, 'TextEncoder');
  }
});

describe('verifyRegistrySignatureWeb (browser HMAC verifier, fail-closed)', () => {
  it('VERIFIES a registry signed by the canonical Node signer with the same key (no false reject)', async () => {
    const signed = signRegistry(baseRegistry(), KEY);
    const result = await verifyRegistrySignatureWeb(signed, VERIFICATION);
    expect(result).toEqual({ ok: true });
  });

  it('is INTEROPERABLE with the Node signer: identical canonical bytes => identical MAC', async () => {
    // The Node signer (signing.ts) and the browser verifier (this module) MUST hash
    // byte-for-byte identical canonical bytes. Re-stringifying through JSON.parse +
    // JSON.stringify (what an HTTP fetch + .json() does in the browser) MUST not
    // change verification — that is the whole point of `canonicalRegistryString`.
    const signed = signRegistry(baseRegistry(), KEY);
    const overWire = JSON.parse(JSON.stringify(signed)) as Registry;
    const result = await verifyRegistrySignatureWeb(overWire, VERIFICATION);
    expect(result).toEqual({ ok: true });
  });

  it('REJECTS a TAMPERED registry (any byte change) with a tamper/different-key reason', async () => {
    const signed = signRegistry(baseRegistry(), KEY);
    // Repoint a remote AFTER signing — exactly the threat we defend against.
    signed.mfes.inspector.remoteEntry = 'http://evil.example.com/remoteEntry.js';
    const result = await verifyRegistrySignatureWeb(signed, VERIFICATION);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/tampered|different key/i);
  });

  it('REJECTS a valid signature when verified with the WRONG key', async () => {
    const signed = signRegistry(baseRegistry(), KEY);
    const result = await verifyRegistrySignatureWeb(signed, {
      ...VERIFICATION,
      key: 'an-attacker-key',
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/does not match|different key/i);
  });

  it('REJECTS an UNSIGNED registry when verification is required (fail-closed)', async () => {
    const result = await verifyRegistrySignatureWeb(baseRegistry(), VERIFICATION);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/no signature/i);
  });

  it('REJECTS a registry whose signature is not an object', async () => {
    const tampered = baseRegistry() as Registry & { signature?: unknown };
    (tampered as { signature: unknown }).signature = 'sha384-bare-hash-only';
    const result = await verifyRegistrySignatureWeb(tampered as Registry, VERIFICATION);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/no signature/i);
  });

  it('REJECTS a mismatched algorithm in the envelope', async () => {
    const signed = signRegistry(baseRegistry(), KEY);
    signed.signature!.algorithm = 'totally-made-up';
    const result = await verifyRegistrySignatureWeb(signed, VERIFICATION);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/algorithm/i);
  });

  it('REJECTS an empty signature value', async () => {
    const signed = signRegistry(baseRegistry(), KEY);
    signed.signature!.value = '';
    const result = await verifyRegistrySignatureWeb(signed, VERIFICATION);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/missing|empty|non-empty/i);
  });

  it('REJECTS a non-base64 signature value (fail-closed, never silently accept)', async () => {
    const signed = signRegistry(baseRegistry(), KEY);
    signed.signature!.value = '!!! not base64 !!!';
    const result = await verifyRegistrySignatureWeb(signed, VERIFICATION);
    expect(result.ok).toBe(false);
    // Either the base64 decode throws => "not valid base64", or the bytes pass
    // decode but the MAC mismatch is reported. Both are fail-closed.
  });

  it('is NOT a bare hash: a plain SHA-256 of the canonical bytes does NOT verify', async () => {
    // A "bare hash" approach (a hash served next to the registry) is theater: a
    // tamperer recomputes it. The browser verifier requires a KEYED MAC; prove
    // an un-keyed digest of the same canonical bytes is REJECTED.
    const signed = signRegistry(baseRegistry(), KEY);
    const canonicalBytes = new NodeTextEncoder().encode(canonicalRegistryString(signed));
    const bareHash = await webcrypto.subtle.digest('SHA-256', canonicalBytes);
    const bareHashB64 = Buffer.from(bareHash).toString('base64');
    signed.signature!.value = bareHashB64;
    const result = await verifyRegistrySignatureWeb(signed, VERIFICATION);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/does not match|different key/i);
  });

  it('falls back to the default algorithm when verification.algorithm is empty', async () => {
    const signed = signRegistry(baseRegistry(), KEY);
    const result = await verifyRegistrySignatureWeb(signed, {
      ...VERIFICATION,
      algorithm: '',
    });
    expect(result).toEqual({ ok: true });
  });

  it('FAIL-CLOSES when Web Crypto is unavailable (never silently accept)', async () => {
    // Simulate an environment without `crypto.subtle` (e.g. an HTTP origin or an
    // ancient browser): the verifier MUST refuse to "succeed" rather than load
    // an unverified registry. We patch the global `crypto` for the duration of
    // this test only; the `afterAll` above restores whatever this suite started
    // with (or what was originally there before our top-level polyfill).
    const before = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    try {
      const result = await verifyRegistrySignatureWeb(
        signRegistry(baseRegistry(), KEY),
        VERIFICATION
      );
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/Web Crypto|crypto\.subtle/i);
    } finally {
      if (before) {
        Object.defineProperty(globalThis, 'crypto', before);
      } else {
        Reflect.deleteProperty(globalThis, 'crypto');
      }
    }
  });
});

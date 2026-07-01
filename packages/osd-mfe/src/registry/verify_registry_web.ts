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
 * Registry authenticity — BROWSER verifier.
 *
 * This is the verifier that runs on the LIVE MFE boot path: the MFE bootstrap
 * fetches the registry from the origin/CDN and, when a verification key is
 * injected by the (trusted) OSD origin, calls this BEFORE using the registry to
 * decide which remotes to load. It verifies the HMAC-SHA256 signature with the
 * host-held key using the Web Crypto API (`crypto.subtle`), so it pulls NO Node
 * builtin and is safe to bundle into the `web`-target bootstrap.
 *
 * The canonical serialization (which strips the `signature` field) is shared with
 * the Node signer/verifier via `signing_common.ts`, so the browser hashes byte-for
 * byte identical input to whatever signed the registry.
 *
 * Threat / key model: see the header of `signing_common.ts`. Fails closed — the
 * caller (bootstrap) refuses a tampered/unsigned registry and never loads a remote
 * from an unauthenticated registry.
 */

import {
  REGISTRY_SIGNATURE_ALGORITHM,
  RegistryVerification,
  SignatureCheck,
  canonicalRegistryString,
} from './signing_common';
import { Registry } from './schema';

/** Decode a base64 string to bytes using the browser global `atob`. */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Verify a registry's signature in the browser with the host-injected key.
 *
 * Fails closed: resolves `{ ok: false, reason }` for a missing, malformed, wrong
 * algorithm, or non-matching signature, or if Web Crypto is unavailable (we never
 * silently accept an unverified registry). A correct signature resolves
 * `{ ok: true }` — no false rejects.
 *
 * @param registry the fetched+parsed registry (must carry `signature`)
 * @param verification the host-injected verification material (key + envelope)
 * @returns a promise of the {@link SignatureCheck}
 */
export async function verifyRegistrySignatureWeb(
  registry: Registry,
  verification: RegistryVerification
): Promise<SignatureCheck> {
  const signature = (registry as Registry & { signature?: unknown }).signature;
  if (!signature || typeof signature !== 'object') {
    return {
      ok: false,
      reason:
        'registry carries no signature, but a verification key is configured ' +
        '(unsigned registries are refused fail-closed when signing is on)',
    };
  }

  const { algorithm, value } = signature as { algorithm?: unknown; value?: unknown };
  const expectedAlgorithm = verification.algorithm || REGISTRY_SIGNATURE_ALGORITHM;
  if (algorithm !== expectedAlgorithm) {
    return {
      ok: false,
      reason: `unexpected signature algorithm ${JSON.stringify(
        algorithm
      )} (expected ${JSON.stringify(expectedAlgorithm)})`,
    };
  }
  if (typeof value !== 'string' || value.length === 0) {
    return { ok: false, reason: 'signature value is missing or not a non-empty string' };
  }

  const subtle = typeof crypto !== 'undefined' && crypto.subtle ? crypto.subtle : undefined;
  if (!subtle) {
    // Fail closed: with signing ON we must not accept a registry we cannot verify.
    return {
      ok: false,
      reason:
        'Web Crypto (crypto.subtle) is unavailable, so the registry signature cannot be verified',
    };
  }

  let sigBytes: Uint8Array;
  try {
    sigBytes = base64ToBytes(value);
  } catch {
    return { ok: false, reason: 'signature value is not valid base64' };
  }

  try {
    const encoder = new TextEncoder();
    const cryptoKey = await subtle.importKey(
      'raw',
      encoder.encode(verification.key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const data = encoder.encode(canonicalRegistryString(registry));
    const valid = await subtle.verify('HMAC', cryptoKey, sigBytes, data);
    if (!valid) {
      return {
        ok: false,
        reason:
          'signature does not match: the registry was tampered with, or was signed with a ' +
          'different key than the configured verification key',
      };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: `registry signature verification errored: ${(error as Error).message}`,
    };
  }
}

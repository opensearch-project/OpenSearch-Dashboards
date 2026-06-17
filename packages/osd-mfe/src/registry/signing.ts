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
 * Registry authenticity — NODE signer + verifier (Phase 12, Story 4).
 *
 * This module uses Node's `crypto` and is therefore NODE-ONLY: it is imported by
 * the signing tool, by {@link FileRegistryProvider} (server-side read-time
 * verification), and by tests — but NEVER by the browser bootstrap (which targets
 * `web` and must not pull a Node builtin). The browser verifier lives in
 * `verify_registry_web.ts`; the canonicalization both share lives in
 * `signing_common.ts`.
 *
 * Threat model & key model: see the header of `signing_common.ts`. In short: the
 * registry decides which code loads, so it is signed with a key the CDN tamperer
 * lacks (an HMAC secret held in server config, not in the payload), and the
 * signature is verified BEFORE the registry is used — refusing a tampered/unsigned
 * registry fail-closed. A bare hash served next to the registry would be theater.
 */

import { createHmac, timingSafeEqual } from 'crypto';

import { Registry } from './schema';
import {
  REGISTRY_SIGNATURE_ALGORITHM,
  RegistryVerification,
  SignatureCheck,
  canonicalRegistryString,
} from './signing_common';

/**
 * The signing key material (server-held secret). `keyId` is recorded in the
 * envelope for Phase-13 rotation; `secret` is the HMAC key; `algorithm` defaults
 * to {@link REGISTRY_SIGNATURE_ALGORITHM}.
 */
export interface RegistrySigningKey {
  /** Key identifier recorded in the signature envelope (rotation hook). */
  keyId: string;
  /** The HMAC secret used to produce the signature. */
  secret: string;
  /** Algorithm; defaults to {@link REGISTRY_SIGNATURE_ALGORITHM}. */
  algorithm?: string;
}

/** Compute the raw HMAC-SHA256 digest of the canonical registry bytes. */
function hmac(secret: string, registry: Registry): Buffer {
  return createHmac('sha256', Buffer.from(secret, 'utf8'))
    .update(canonicalRegistryString(registry), 'utf8')
    .digest();
}

/**
 * Sign a registry: return a COPY carrying a `signature` envelope computed over the
 * canonical (signature-stripped) bytes. Any pre-existing signature is replaced.
 *
 * Production key issuance/custody is deferred to Phase 13 (a governed service);
 * this is the library primitive the (future) publish path and the harness use.
 *
 * @param registry the registry to sign
 * @param key the signing key material
 * @returns a new registry object with `signature` populated
 * @throws Error when an unsupported algorithm is requested
 */
export function signRegistry(registry: Registry, key: RegistrySigningKey): Registry {
  const algorithm = key.algorithm ?? REGISTRY_SIGNATURE_ALGORITHM;
  if (algorithm !== REGISTRY_SIGNATURE_ALGORITHM) {
    throw new Error(
      `signRegistry: unsupported algorithm ${JSON.stringify(algorithm)} ` +
        `(only ${REGISTRY_SIGNATURE_ALGORITHM} is supported)`
    );
  }
  if (!key.secret) {
    throw new Error('signRegistry: a non-empty signing secret is required');
  }

  // Strip any existing signature before signing (canonicalRegistryString does this
  // too, but we also drop it from the returned object so the new one replaces it).
  const { signature, ...unsigned } = registry as Registry & { signature?: unknown };
  void signature;
  const value = hmac(key.secret, unsigned as Registry).toString('base64');

  return {
    ...(unsigned as Registry),
    signature: { algorithm, keyId: key.keyId, value },
  };
}

/**
 * Verify a registry's signature with the host-held key, SYNCHRONOUSLY (Node).
 *
 * Fails closed: returns `{ ok: false, reason }` for a missing, malformed, wrong
 * algorithm, or non-matching signature (tampered registry or a different key).
 * A correct signature produced with the same key returns `{ ok: true }` — no
 * false rejects. Uses a constant-time comparison so a verification result never
 * leaks timing about how close a forged MAC was.
 *
 * @param registry the registry to verify (must carry `signature`)
 * @param verification the host-held verification material (key + expected envelope)
 * @returns the {@link SignatureCheck}
 */
export function verifyRegistrySignature(
  registry: Registry,
  verification: RegistryVerification
): SignatureCheck {
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

  let actual: Buffer;
  try {
    actual = Buffer.from(value, 'base64');
  } catch {
    return { ok: false, reason: 'signature value is not valid base64' };
  }

  const expected = hmac(verification.key, registry);
  // Length check first: timingSafeEqual throws on a length mismatch.
  const valid = actual.length === expected.length && timingSafeEqual(actual, expected);
  if (!valid) {
    return {
      ok: false,
      reason:
        'signature does not match: the registry was tampered with, or was signed with a ' +
        'different key than the configured verification key',
    };
  }
  return { ok: true };
}

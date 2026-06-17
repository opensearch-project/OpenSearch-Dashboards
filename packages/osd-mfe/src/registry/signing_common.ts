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
 * Registry authenticity — PURE, platform-agnostic core (Phase 12, Story 4).
 *
 * The registry document decides WHICH remote code each plugin loads, so an
 * attacker who can alter the registry bytes (a compromised CDN / MITM serving a
 * different registry.json at the pinned path) can redirect every plugin to
 * arbitrary code — even though the per-artifact SRI (Stories 1–3) protects each
 * pinned artifact. A bare hash served NEXT TO the registry is THEATER: a tamperer
 * recomputes it. So we sign the registry with a KEY the tamperer lacks and verify
 * that signature at read time, BEFORE the registry is used (see `signing.ts` for
 * the Node signer/verifier and `verify_registry_web.ts` for the browser verifier).
 *
 * This module is intentionally DEPENDENCY-FREE: it contains ONLY the signature
 * envelope types and the canonical serialization that the signer and BOTH
 * verifiers share. It imports neither Node `crypto` (so it can be bundled into the
 * browser bootstrap, which targets `web` and must not pull a Node builtin) nor the
 * browser `crypto.subtle`. The platform-specific crypto lives in the sibling
 * modules; keeping the canonicalization here guarantees the signer (Node) and the
 * verifiers (Node + browser) all hash byte-for-byte IDENTICAL input.
 *
 * Trust / key model (documented in full in docs/15-PHASE12-RESULTS.md):
 *  - The verification key is held in SERVER CONFIG (never inside the signed
 *    payload) and delivered to the browser by the TRUSTED OSD origin — NOT by the
 *    CDN that serves the registry. The CDN tamperer therefore cannot forge a
 *    signature, which is exactly the threat this defends against.
 *  - Key issuance / rotation / custody (and the stronger asymmetric model where the
 *    browser holds only a PUBLIC key) are deferred to Phase 13 (a governed service).
 */

/**
 * The only signature algorithm currently supported: an HMAC-SHA256 MAC over the
 * {@link canonicalRegistryString canonical} registry bytes. HMAC uses a symmetric
 * server-held secret (the key the CDN tamperer lacks). Phase 13 may add an
 * asymmetric algorithm so the browser holds only a public key.
 */
export const REGISTRY_SIGNATURE_ALGORITHM = 'HMAC-SHA256';

/**
 * The signature envelope stored at `registry.signature`. It is NOT part of the
 * signed payload (the canonical serialization strips it), so it can carry the
 * algorithm + key id alongside the MAC without being self-referential.
 */
export interface RegistrySignature {
  /** Signature algorithm; currently always {@link REGISTRY_SIGNATURE_ALGORITHM}. */
  algorithm: string;
  /**
   * Identifier of the key that produced this signature. Informational for the
   * single-key model today; it is the hook a Phase-13 key-rotation/custody service
   * uses to select the right verification key. NOT trusted for verification — the
   * verifier uses its own configured key, never a key named by the (untrusted)
   * payload.
   */
  keyId: string;
  /** Base64-encoded MAC of the canonical registry bytes. */
  value: string;
}

/**
 * The verification material the host holds (server config), passed to the
 * verifiers. The `key` is the HMAC secret; `algorithm`/`keyId` echo the expected
 * envelope. This is the host-held key the CDN tamperer does not have.
 */
export interface RegistryVerification {
  /** Expected signature algorithm (defaults to {@link REGISTRY_SIGNATURE_ALGORITHM}). */
  algorithm: string;
  /** Expected key id (informational / Phase-13 rotation). */
  keyId: string;
  /** The HMAC secret used to verify the signature. */
  key: string;
}

/** Outcome of a signature check: `ok` plus a human-readable `reason` when not. */
export interface SignatureCheck {
  ok: boolean;
  /** Present only when `ok` is false: a clear, fail-closed-able reason. */
  reason?: string;
}

/**
 * Deterministically serialize an arbitrary JSON value with object keys sorted
 * recursively. Arrays keep their order (it is meaningful); object key order is
 * normalized so the SAME logical document always produces the SAME string
 * regardless of how it was (re)serialized on the wire — the local origin and the
 * CDN both re-`JSON.stringify` the registry (e.g. with 2-space indentation), and
 * the browser re-parses it, so signing the RAW file bytes would be brittle.
 * Canonicalizing the PARSED object instead makes verification robust to
 * whitespace and key-order differences.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    // Primitives (string/number/boolean/null) — JSON.stringify is canonical.
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const members = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`);
  return `{${members.join(',')}}`;
}

/**
 * Produce the canonical, signed-payload string for a registry: the registry with
 * its `signature` field REMOVED, serialized deterministically (sorted keys). Both
 * the signer and the verifiers call this so they hash identical bytes. Passing an
 * already-signed registry is fine — the `signature` field is always stripped, so
 * `verify(sign(r)) === verify over the same canonical bytes`.
 *
 * @param registry the (possibly signed) registry object
 * @returns the canonical UTF-8 string to MAC
 */
export function canonicalRegistryString(registry: object): string {
  // Shallow-copy WITHOUT the signature field (the signature can never sign itself).
  const source = registry as Record<string, unknown>;
  const unsigned: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    if (key !== 'signature') {
      unsigned[key] = source[key];
    }
  }
  return stableStringify(unsigned);
}

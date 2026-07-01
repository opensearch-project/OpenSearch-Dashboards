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
 * Compat CLASSIFIER — the pure runtime evaluator of the compat contract.
 *
 * A PURE, side-effect-free evaluator that the host uses (in resolve()/bootstrap)
 * to decide whether a remote may be loaded. Given the running host environment
 * (OSD core version + the shared-singleton versions the host actually provides)
 * and a remote's recorded compatibility metadata (`builtAgainst` + `compat`,
 * produced at generation time by `./compat.ts`), it returns one of:
 *
 *  - `compatible`   — the host meets BOTH axes of the locked contract.
 *  - `incompatible` — the host is KNOWN to violate at least one axis.
 *  - `unknown`      — the remote's metadata is missing/incomplete, so we cannot
 *                     decide (legacy remotes built before the contract existed).
 *
 * COMPATIBILITY AXES (locked — see `packages/osd-mfe/README.md`):
 *  1. OSD core: the running core version must fall within the remote's declared
 *     `compat.compatibleCoreRange` (defaults to "same major.minor", e.g. `3.5.x`)
 *     AND be at or above `compat.minCoreVersion`. A major/minor mismatch or a
 *     host below the floor is INCOMPATIBLE.
 *  2. Shared singletons: every shared-singleton root the remote was built
 *     against (`builtAgainst.sharedDeps`, a map of root -> required semver range)
 *     must be satisfied by the version the host provides for that root. A
 *     missing or unsatisfiable singleton is INCOMPATIBLE (strict — never run a
 *     silently mismatched singleton).
 *
 * This module performs NO enforcement and reads NO policy: it only labels the
 * technical compatibility. The bootstrap policy layer maps the label + reasons
 * onto the env-keyed POLICY (dev block / prod skip, `strictShared`, …). To let
 * that policy honor `strictShared` without re-deriving anything, the result
 * also flags WHICH axis failed ({@link CompatibilityResult.coreMismatch} /
 * {@link CompatibilityResult.sharedMismatch}).
 *
 * Determinism: the classifier only inspects its arguments and `semver`; the same
 * inputs always yield the same result. It never throws — an unparseable host
 * version fails CLOSED (incompatible with a clear reason) rather than crashing
 * the host.
 */

import semver from 'semver';

import { BuiltAgainst, CompatDeclaration } from './schema';

/** The three compatibility verdicts the classifier can return. */
export type Compatibility = 'compatible' | 'incompatible' | 'unknown';

/**
 * The running host environment a remote is classified against — the left-hand
 * side of the contract. The bootstrap policy layer builds this from the live
 * core version and the shared-singleton versions the host serves; the
 * classifier treats it as data.
 */
export interface HostEnvironment {
  /** The running OSD core version (semver string, e.g. `"3.5.0"`). */
  osdVersion: string;
  /**
   * The shared-singleton versions the host actually provides, keyed by package
   * root (e.g. `react` -> `"16.14.0"`). Values may be concrete versions or
   * ranges; either way a remote's required range must be satisfiable by what the
   * host provides. A root the host does not list is treated as "not provided".
   */
  sharedDeps: Record<string, string>;
}

/**
 * The remote-side compatibility metadata the classifier consumes. This is the
 * subset of {@link import('./schema').MfeEntry} produced by the compat contract
 * (`./compat.ts`). Both fields are optional: a remote missing EITHER is treated
 * as {@link Compatibility} `unknown` (incomplete contract).
 */
export interface RemoteCompatMetadata {
  /** What the remote was built against (OSD version + shared-dep ranges). */
  builtAgainst?: BuiltAgainst;
  /** The remote's host-compatibility declaration (core min + range). */
  compat?: CompatDeclaration;
}

/** The classifier verdict plus the reasons + which axis (if any) failed. */
export interface CompatibilityResult {
  /** The overall verdict. */
  compatibility: Compatibility;
  /**
   * Human-readable explanations. Empty when `compatible`; one entry per failed
   * check when `incompatible`; a single "missing metadata" note when `unknown`.
   * The bootstrap policy layer surfaces these as the offender reasons (dev
   * block list / prod skip telemetry).
   */
  reasons: string[];
  /** True when an OSD-core axis check failed (drives nothing here; for policy). */
  coreMismatch: boolean;
  /** True when a shared-singleton axis check failed (lets policy honor strictShared). */
  sharedMismatch: boolean;
}

/** Coerce a version-ish string to a concrete `semver` version, or `null`. */
function toConcreteVersion(value: string): string | null {
  // `minVersion` turns a range (`^16.14.0`) into the lowest matching concrete
  // version (`16.14.0`) and leaves a concrete version unchanged; it returns the
  // exact value the host could be serving for a satisfiability check.
  try {
    const min = semver.minVersion(value);
    return min ? min.version : null;
  } catch {
    return null;
  }
}

/**
 * Evaluate the OSD-core axis, pushing any failure reasons onto `reasons`.
 * @returns `true` when a core mismatch was found.
 */
function evaluateCoreAxis(hostCore: string, compat: CompatDeclaration, reasons: string[]): boolean {
  let mismatch = false;

  // Floor: host must be at or above the remote's declared minimum core version.
  const min = semver.valid(semver.coerce(compat.minCoreVersion));
  if (!min) {
    reasons.push(`remote declares an unparseable minCoreVersion "${compat.minCoreVersion}"`);
    mismatch = true;
  } else if (semver.lt(hostCore, min)) {
    reasons.push(`host OSD ${hostCore} is below the remote's minimum core version ${min}`);
    mismatch = true;
  }

  // Range: host must fall within the remote's compatible core range (this is
  // what catches a major/minor mismatch, the locked OSD-core axis).
  if (!semver.validRange(compat.compatibleCoreRange)) {
    reasons.push(
      `remote declares an unparseable compatibleCoreRange "${compat.compatibleCoreRange}"`
    );
    mismatch = true;
  } else if (!semver.satisfies(hostCore, compat.compatibleCoreRange)) {
    reasons.push(
      `host OSD ${hostCore} is not within the remote's compatible core range "${compat.compatibleCoreRange}"`
    );
    mismatch = true;
  }

  return mismatch;
}

/**
 * Evaluate the shared-singleton axis, pushing any failure reasons onto
 * `reasons`. Strict: a singleton the host does not provide, or whose host
 * version does not satisfy the remote's required range, is a mismatch.
 * @returns `true` when a shared-singleton mismatch was found.
 */
function evaluateSharedAxis(
  host: HostEnvironment,
  builtAgainst: BuiltAgainst,
  reasons: string[]
): boolean {
  let mismatch = false;
  const provided = host.sharedDeps ?? {};

  // Deterministic order: iterate roots sorted so reasons are stable.
  for (const root of Object.keys(builtAgainst.sharedDeps).sort()) {
    const requiredRange = builtAgainst.sharedDeps[root];

    if (!semver.validRange(requiredRange)) {
      reasons.push(
        `remote requires shared singleton "${root}" with an unparseable range "${requiredRange}"`
      );
      mismatch = true;
      continue;
    }

    const hostVersion = provided[root];
    if (hostVersion === undefined) {
      reasons.push(
        `host does not provide shared singleton "${root}" (remote requires "${requiredRange}")`
      );
      mismatch = true;
      continue;
    }

    const hostConcrete = toConcreteVersion(hostVersion);
    if (!hostConcrete) {
      reasons.push(`host shared singleton "${root}" version "${hostVersion}" is not valid semver`);
      mismatch = true;
      continue;
    }

    if (!semver.satisfies(hostConcrete, requiredRange)) {
      reasons.push(
        `shared singleton "${root}": host ${hostVersion} does not satisfy the remote's required "${requiredRange}"`
      );
      mismatch = true;
    }
  }

  return mismatch;
}

/**
 * Classify a remote's compatibility with the running host.
 *
 * @param host the running host environment (core version + provided singletons)
 * @param remote the remote's recorded compatibility metadata
 * @returns the verdict + reasons + per-axis mismatch flags
 *
 * @remarks
 * - Missing `builtAgainst` OR `compat` => `unknown` (incomplete contract): the
 *   host cannot know what the remote needs, so it defers to the env policy
 *   (non-prod warn+load, prod skip).
 * - An unparseable host OSD version fails CLOSED (`incompatible`) so a broken
 *   host environment never silently loads remotes it cannot verify.
 * - Pure & deterministic: no I/O, no logging, no throwing.
 */
export function classifyCompatibility(
  host: HostEnvironment,
  remote: RemoteCompatMetadata
): CompatibilityResult {
  // 1. Incomplete contract => UNKNOWN (cannot decide).
  if (!remote.builtAgainst || !remote.compat) {
    const missing: string[] = [];
    if (!remote.builtAgainst) missing.push('builtAgainst');
    if (!remote.compat) missing.push('compat');
    return {
      compatibility: 'unknown',
      reasons: [`remote is missing compatibility metadata: ${missing.join(', ')}`],
      coreMismatch: false,
      sharedMismatch: false,
    };
  }

  // 2. Host core version must be parseable; otherwise fail CLOSED.
  const hostCore = semver.valid(semver.coerce(host.osdVersion));
  if (!hostCore) {
    return {
      compatibility: 'incompatible',
      reasons: [`host OSD version "${host.osdVersion}" is not valid semver`],
      coreMismatch: true,
      sharedMismatch: false,
    };
  }

  // 3. Evaluate both axes (always; collect every reason for a complete report).
  const reasons: string[] = [];
  const coreMismatch = evaluateCoreAxis(hostCore, remote.compat, reasons);
  const sharedMismatch = evaluateSharedAxis(host, remote.builtAgainst, reasons);

  return {
    compatibility: coreMismatch || sharedMismatch ? 'incompatible' : 'compatible',
    reasons,
    coreMismatch,
    sharedMismatch,
  };
}

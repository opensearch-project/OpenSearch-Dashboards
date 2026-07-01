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
 * Version-compatibility ENFORCEMENT — the PURE policy mapper.
 *
 * The classifier (`../registry/compat_classifier`) labels each remote
 * `compatible | incompatible | unknown` against the host, with reasons and
 * per-axis flags. This module maps that technical label onto a runtime ACTION
 * using the resolved, env-keyed {@link CompatPolicy}: load the remote, SKIP it
 * (register a disabled placeholder, page still boots), or treat it as a page
 * OFFENDER (the page hard-BLOCKS and never boots). The bootstrap consumes the
 * returned {@link CompatDecision} to drive loading; the actual DOM/side-effects
 * live elsewhere so this stays pure & deterministic (easy to unit test).
 *
 * LOCKED policy matrix (see `packages/osd-mfe/README.md`), all config-overridable:
 *  - INCOMPATIBLE (known): `onIncompatible` = `block` (non-prod default) => offender
 *    (hard-block the page); `skip` (prod default) => disable the plugin, keep booting.
 *  - MISSING/UNKNOWN metadata: `onMissing` = `warn-load` (non-prod default) => load
 *    anyway with a warning; `skip` (prod default) => disable; `block` => offender.
 *  - SHARED SINGLETONS: `strictShared` (default `true`) — a shared-singleton
 *    mismatch is enforced via the SAME `onIncompatible` action (dev block / prod
 *    skip), so strict never white-screens prod. When `strictShared` is turned OFF
 *    by config, a remote whose ONLY failure is a shared-singleton mismatch (no
 *    OSD-core mismatch) is downgraded to `compatible` (loaded), since the operator
 *    has opted out of strict singleton enforcement. A core-axis mismatch is always
 *    enforced regardless of `strictShared`.
 */

import {
  classifyCompatibility,
  Compatibility,
  HostEnvironment,
  RemoteCompatMetadata,
} from '../registry/compat_classifier';
import { CompatPolicy } from './compat_policy';

/** The runtime action the policy assigns to a single remote. */
export type CompatAction = 'load' | 'skip' | 'block';

/** One remote's evaluated compatibility outcome (id + verdict + reasons). */
export interface EvaluatedRemote {
  /** The plugin/remote id. */
  id: string;
  /** The (possibly `strictShared`-adjusted) compatibility verdict applied. */
  compatibility: Compatibility;
  /** Human-readable reasons (offender list / skip telemetry). Empty when loaded. */
  reasons: string[];
}

/** The full enforcement decision for a set of remotes. */
export interface CompatDecision {
  /** Ids to load normally (compatible, or unknown under `warn-load`). */
  load: string[];
  /** Remotes to register as a DISABLED placeholder (skipped); the page still boots. */
  skip: EvaluatedRemote[];
  /** Remotes that make the page hard-BLOCK (non-prod `block`); the page must NOT boot. */
  offenders: EvaluatedRemote[];
  /** True when there is at least one offender — the page must hard-block. */
  block: boolean;
}

/**
 * Evaluate ONE remote against the host + policy, returning the action and the
 * (strictShared-adjusted) verdict + reasons. Pure & deterministic.
 *
 * @param host the running host environment (core version + provided singletons)
 * @param remote the remote's recorded compatibility metadata
 * @param policy the resolved, env-keyed compatibility policy
 */
export function decideRemoteCompat(
  host: HostEnvironment,
  remote: RemoteCompatMetadata,
  policy: CompatPolicy
): { action: CompatAction; compatibility: Compatibility; reasons: string[] } {
  const result = classifyCompatibility(host, remote);
  const { compatibility } = result;
  const { reasons } = result;

  // `strictShared` opt-out: when strict singleton enforcement is OFF, a remote
  // whose ONLY failure is a shared-singleton mismatch (no OSD-core mismatch) is
  // tolerated (treated as compatible). A core-axis mismatch is always enforced.
  if (
    compatibility === 'incompatible' &&
    result.sharedMismatch &&
    !result.coreMismatch &&
    !policy.strictShared
  ) {
    return { action: 'load', compatibility: 'compatible', reasons: [] };
  }

  if (compatibility === 'compatible') {
    return { action: 'load', compatibility, reasons: [] };
  }

  if (compatibility === 'incompatible') {
    return {
      action: policy.onIncompatible === 'block' ? 'block' : 'skip',
      compatibility,
      reasons,
    };
  }

  // compatibility === 'unknown' (missing/incomplete metadata).
  switch (policy.onMissing) {
    case 'block':
      return { action: 'block', compatibility, reasons };
    case 'skip':
      return { action: 'skip', compatibility, reasons };
    case 'warn-load':
    default:
      return { action: 'load', compatibility, reasons };
  }
}

/**
 * Evaluate every remote id and partition them into load / skip / offenders per
 * the locked policy matrix. Pure & deterministic: iterates ids in the given
 * order and only reads its arguments + the classifier.
 *
 * @param ids the remote ids to evaluate (registry order)
 * @param getMeta resolve a remote id to its compatibility metadata (registry entry)
 * @param host the running host environment
 * @param policy the resolved, env-keyed compatibility policy
 * @returns the partitioned {@link CompatDecision}
 */
export function decideCompat(
  ids: string[],
  getMeta: (id: string) => RemoteCompatMetadata,
  host: HostEnvironment,
  policy: CompatPolicy
): CompatDecision {
  const load: string[] = [];
  const skip: EvaluatedRemote[] = [];
  const offenders: EvaluatedRemote[] = [];

  for (const id of ids) {
    const { action, compatibility, reasons } = decideRemoteCompat(host, getMeta(id), policy);
    if (action === 'load') {
      load.push(id);
    } else if (action === 'skip') {
      skip.push({ id, compatibility, reasons });
    } else {
      offenders.push({ id, compatibility, reasons });
    }
  }

  return { load, skip, offenders, block: offenders.length > 0 };
}

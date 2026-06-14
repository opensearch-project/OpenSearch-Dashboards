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
 * Phase 9 version-compatibility POLICY (Story 1 — config surface only).
 *
 * Defines the locked, env-keyed policy matrix that the bootstrap (Story 3) will
 * apply once the classifier (Story 2) labels each remote
 * compatible | incompatible | unknown. This module only RESOLVES the effective
 * policy from the (optional) server config + the server's dev/prod mode — it
 * performs no classification and no enforcement.
 *
 * The env signal is the SAME one that drives `mfe.allowOverride` (dev/non-prod
 * vs prod): see {@link import('./override_sources').resolveAllowOverride} and the
 * core mirror `src/core/server/utils/resolve_compat_policy.ts`. Keeping the
 * default in one helper means the policy's env-keyed behavior is specified once.
 *
 * LOCKED policy matrix (docs/01-MFE-DESIGN.md / prd.json):
 *  - INCOMPATIBLE (known): non-prod => `block` the page; prod => `skip` the plugin.
 *  - MISSING/UNKNOWN metadata: non-prod => `warn-load`; prod => `skip`.
 *  - SHARED SINGLETONS: `strictShared` defaults to `true` (never silently run a
 *    mismatched singleton version); a detected mismatch is HANDLED by the same
 *    incompatible action above (dev block / prod skip), so strict never
 *    white-screens prod.
 * Every key is config-overridable; an explicit config value always wins.
 */

/** What to do with a remote the classifier labels INCOMPATIBLE. */
export type IncompatibleAction = 'block' | 'skip';

/** What to do with a remote whose compatibility metadata is MISSING/UNKNOWN. */
export type MissingAction = 'block' | 'skip' | 'warn-load';

/**
 * The (optional) `opensearchDashboards.mfe.compat.*` config, as injected from the
 * server. Each field is optional so an unset value falls back to the env-keyed
 * default; an explicit value always wins.
 */
export interface CompatPolicyConfig {
  /** Action for INCOMPATIBLE remotes. Unset => dev `block` / prod `skip`. */
  onIncompatible?: IncompatibleAction;
  /** Action for MISSING/UNKNOWN-metadata remotes. Unset => dev `warn-load` / prod `skip`. */
  onMissing?: MissingAction;
  /** Enforce strict shared-singleton versions. Unset => `true`. */
  strictShared?: boolean;
}

/** The fully-resolved, effective compatibility policy (no optional fields). */
export interface CompatPolicy {
  onIncompatible: IncompatibleAction;
  onMissing: MissingAction;
  strictShared: boolean;
}

/**
 * Resolve the EFFECTIVE compatibility policy from the (optional) config and the
 * server's dev/prod mode.
 *
 * Precedence per key: an explicitly-configured value ALWAYS wins; otherwise the
 * locked env-keyed default applies (non-prod is loud/blocking, prod degrades
 * gracefully). `strictShared` is not env-keyed and defaults to `true`.
 *
 * @param configured the `mfe.compat` config (`undefined`/sparse when unset)
 * @param dev `true` when the server runs in development mode (`env.mode.dev`)
 * @returns the effective {@link CompatPolicy}
 */
export function resolveCompatPolicy(
  configured: CompatPolicyConfig | undefined,
  dev: boolean
): CompatPolicy {
  const cfg = configured ?? {};
  const isDev = !!dev;
  return {
    onIncompatible: cfg.onIncompatible ?? (isDev ? 'block' : 'skip'),
    onMissing: cfg.onMissing ?? (isDev ? 'warn-load' : 'skip'),
    strictShared: typeof cfg.strictShared === 'boolean' ? cfg.strictShared : true,
  };
}

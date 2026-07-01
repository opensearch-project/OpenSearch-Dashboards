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
 * Resolve the EFFECTIVE `opensearchDashboards.mfe.compat.*` version-compatibility
 * policy from the (optional) server config values and the server's dev/prod mode.
 *
 * This is the core-side mirror of the canonical browser-side `resolveCompatPolicy`
 * in `@osd/mfe` (`packages/osd-mfe/src/bootstrap/compat_policy.ts`), which the
 * server cannot import (`@osd/mfe` is not a dependency of `src/`). The server uses
 * this to compute the policy it injects into the page; keeping both in
 * lockstep means the env-keyed defaults are specified once per side, exactly as
 * `resolveAllowOverride` is mirrored for the `allowOverride` gate.
 *
 * LOCKED, env-keyed defaults (env = dev/non-prod vs prod, same signal as
 * `allowOverride`); an explicitly-configured value ALWAYS wins:
 *  - `onIncompatible`: dev => `block` (loud) / prod => `skip` (graceful).
 *  - `onMissing`:      dev => `warn-load` / prod => `skip`.
 *  - `strictShared`:   not env-keyed; defaults to `true`.
 */

/** What to do with a remote the classifier labels INCOMPATIBLE. */
export type IncompatibleAction = 'block' | 'skip';

/** What to do with a remote whose compatibility metadata is MISSING/UNKNOWN. */
export type MissingAction = 'block' | 'skip' | 'warn-load';

/** The (optional) `mfe.compat` config values (each unset => env-keyed default). */
export interface CompatPolicyConfig {
  onIncompatible?: IncompatibleAction;
  onMissing?: MissingAction;
  strictShared?: boolean;
}

/** The fully-resolved, effective compatibility policy (no optional fields). */
export interface CompatPolicy {
  onIncompatible: IncompatibleAction;
  onMissing: MissingAction;
  strictShared: boolean;
}

/**
 * Resolve the effective compatibility policy.
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

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
 * Resolve the EFFECTIVE value of the `opensearchDashboards.mfe.allowOverride`
 * security gate from the (optional) server config value and the server's
 * dev/prod mode (dev URL override gate — de-duplicated core mirror).
 *
 * This is the single source of truth used by BOTH server-side render paths:
 *  - `RenderingService` (`src/core/server/rendering/rendering_service.tsx`), which
 *    injects `allowOverride` into the page metadata the dev inspector reads; and
 *  - the legacy `uiRenderMixin` (`src/legacy/ui/ui_render/ui_render_mixin.js`),
 *    for both the `/bootstrap.js` handler and the served CSP widening.
 *
 * It mirrors the canonical browser-side `resolveAllowOverride()` in
 * `@osd/mfe` (`packages/osd-mfe/src/bootstrap/override_sources.ts`), which the
 * server cannot import (`@osd/mfe` is not a dependency of `src/`). Keeping this
 * one core helper ensures the gate's default is specified in exactly one place.
 *
 * SECURITY: dev URL-overrides let arbitrary remote code load, so the gate is
 * honored ONLY in non-production. The default is therefore tied to the
 * server's dev mode:
 *  - `configured` explicitly set (a boolean) ALWAYS wins (operators can force it
 *    on or off in any mode).
 *  - `configured` unset (`undefined`) falls back to `dev`, so the gate is ON in
 *    development and — critically — OFF in production.
 *
 * @param configured the `mfe.allowOverride` config value (`undefined` when unset).
 * @param dev `true` when the server runs in development mode (`env.mode.dev`).
 * @returns the effective gate value; `false` means EVERY override source (query
 *   param, inspector, `localStorage`) is ignored and all remotes load from the
 *   registry/CDN.
 */
export function resolveAllowOverride(configured: boolean | undefined, dev: boolean): boolean {
  return typeof configured === 'boolean' ? configured : !!dev;
}

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
 * Post-build step that collapses a plugin's exposed `./public` Module
 * Federation chunk (`<pluginId>.plugin.js`) INTO its container
 * (`remoteEntry.js`), then deletes the standalone chunk. Run AFTER
 * `rspack.compiler.run()` completes successfully (see
 * `build_mfe_for_plugin.ts` → `compilePluginRemote`).
 *
 * Why
 * ---
 * The native MFE build emits TWO eager files per plugin: the container
 * (`remoteEntry.js`) and the exposed module's chunk (`<id>.plugin.js`). Both
 * are required at boot to satisfy `plugin_reader`'s synchronous
 * `container.get('./public')` contract (every plugin's `setup()` must register
 * its apps before core boot completes). The browser therefore fetches BOTH per
 * plugin, doubling the boot-time fetch count to ~116 across 58 plugins.
 *
 * The two files are architecturally one logical entry that rspack split for
 * a generic "exposes are async chunks" reason that doesn't apply here. Merging
 * them is architecturally lossless:
 *   - Per-plugin SRI: the registry pins ONE hash over the merged `remoteEntry.js`
 *     (unchanged code path — `registry/generate.ts` and `deploy/plan.ts` both
 *     already content-address by `sha256(remoteEntry.js)` and SRI-hash the same
 *     bytes).
 *   - Lazy CHUNK SRI: `<id>.chunk.*.js` files are untouched — they remain
 *     separately emitted with per-chunk integrity injected into the runtime
 *     by rspack's SubresourceIntegrityPlugin.
 *   - Telemetry error classes: unchanged — `sri-mismatch` / `network-failure`
 *     / `mf-runtime-error` are about FETCH semantics, not about whether the
 *     runtime + module are in one file or two.
 *   - CDN cache impact: neutral — content-hash-versioned URLs change whenever
 *     the bytes change, with or without the merge.
 *
 * How
 * ---
 * rspack writes both files to disk. We then concatenate them — the chunk's
 * push runs FIRST so it queues `[[chunkId], modules]` onto the
 * `webpackChunkosdMfe_<id>` global (the array is created lazily by the push's
 * `self[key] = self[key] || []` idiom). The runtime in `remoteEntry.js` THEN
 * runs, takes over the array's `.push` with the jsonp callback, and
 * `forEach`-processes the pre-pushed entry (this is the standard webpack
 * chunk-loading shape — see the runtime's `chunkLoadingGlobal.forEach(...)`
 * call). The chunk is now marked installed, so the eventual
 * `container.get('./public')` (which calls `__webpack_require__.e(<chunkId>)`)
 * resolves WITHOUT fetching anything else.
 *
 * Edge handling
 * -------------
 *   - Standalone `<pluginId>.plugin.js.map` (if present, dev build only) is
 *     also removed — it would otherwise be an orphaned source map after the
 *     standalone JS is gone.
 *   - The trailing `//# sourceMappingURL=<pluginId>.plugin.js.map` comment is
 *     stripped from the inlined chunk's content so the merged `remoteEntry.js`
 *     keeps a single, intact `sourceMappingURL` pointing at its OWN map.
 *   - If no `<pluginId>.plugin.js` is on disk (a plugin whose exposed entry
 *     somehow already lands inlined — defensive guard), the function is a
 *     no-op so the rest of the build is unaffected.
 *
 * This module deliberately depends ONLY on `fs` + `path` (no rspack, no sass)
 * so the unit test can exercise it without pulling in heavy native bindings.
 */

import Fs from 'fs';
import Path from 'path';

/** The remoteEntry.js filename the MFE rspack config emits per plugin. */
export const REMOTE_ENTRY_FILENAME = 'remoteEntry.js';

/**
 * Filename of the standalone exposed-module chunk rspack emits alongside
 * `remoteEntry.js` for a given plugin id. Must agree with the rspack config's
 * `output.chunkFilename` mapping (see `mfe_rspack_config.ts` —
 * `EXPOSED_ENTRY_CHUNK_NAME`).
 */
export function pluginEntryFilename(pluginId: string): string {
  return `${pluginId}.plugin.js`;
}

/**
 * Merge a plugin's standalone exposed-module chunk INTO its `remoteEntry.js`
 * and delete the standalone chunk (+ orphaned source map sidecar, if any).
 *
 * @param outputDir absolute path to `<repoRoot>/target/mfe/<pluginId>`
 * @param pluginId the plugin id (used to compute the chunk filename)
 * @returns `{ merged: true }` if a merge happened, `{ merged: false }` if there
 *   was nothing to merge (the no-op guard fired)
 * @throws Error when `<pluginId>.plugin.js` exists but `remoteEntry.js` does
 *   not — a corrupt build that would otherwise silently leave an un-mergeable
 *   eager chunk behind.
 */
export function mergeExposedEntryIntoRemoteEntry(
  outputDir: string,
  pluginId: string
): { merged: boolean } {
  const remoteEntryPath = Path.join(outputDir, REMOTE_ENTRY_FILENAME);
  const pluginEntryPath = Path.join(outputDir, pluginEntryFilename(pluginId));

  if (!Fs.existsSync(pluginEntryPath)) {
    // No-op: rspack didn't emit a separate eager chunk for the exposed module
    // this run (e.g. a future config change that already inlines exposes).
    // Nothing to merge; the lone `remoteEntry.js` stays as-is.
    return { merged: false };
  }
  if (!Fs.existsSync(remoteEntryPath)) {
    throw new Error(
      `mergeExposedEntryIntoRemoteEntry: expected ${REMOTE_ENTRY_FILENAME} in ${outputDir} ` +
        `(alongside ${pluginEntryFilename(pluginId)}), but it does not exist`
    );
  }

  const pluginEntryBytes = Fs.readFileSync(pluginEntryPath, 'utf8');
  const remoteEntryBytes = Fs.readFileSync(remoteEntryPath, 'utf8');

  // Strip the trailing `//# sourceMappingURL=<pluginId>.plugin.js.map` (if any)
  // so the merged `remoteEntry.js` keeps a single intact source-map reference
  // (its own, at the very tail) — not two competing ones.
  const cleanedPluginEntry = pluginEntryBytes.replace(/\n?\/\/# sourceMappingURL=.*\s*$/m, '');

  // Order: chunk push FIRST so it queues onto `webpackChunkosdMfe_<id>` BEFORE
  // the runtime takes over the array. The `\n;\n` separator defends against
  // ASI-edge cases when the chunk's last expression doesn't end with a `;`.
  const merged = `${cleanedPluginEntry}\n;\n${remoteEntryBytes}`;

  Fs.writeFileSync(remoteEntryPath, merged);
  Fs.unlinkSync(pluginEntryPath);

  const pluginEntryMapPath = `${pluginEntryPath}.map`;
  if (Fs.existsSync(pluginEntryMapPath)) {
    Fs.unlinkSync(pluginEntryMapPath);
  }

  return { merged: true };
}

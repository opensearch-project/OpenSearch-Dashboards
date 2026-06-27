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
 * @jest-environment node
 *
 * Phase 16, Story 4 — unit tests for {@link mergeExposedEntryIntoRemoteEntry},
 * the post-build step that collapses each plugin's `<id>.plugin.js` exposed
 * chunk INTO its `remoteEntry.js`, halving the boot-time plugin fetch count
 * (~116 → ~58 across 58 plugins). End-to-end browser proof of the merged
 * runtime semantics (the chunk's modules survive the runtime takeover of
 * `webpackChunkosdMfe_<id>` and `container.get('./public')` resolves with no
 * additional fetch) is in `harness/verify_mfe_coverage.js` /
 * `harness/measure_lazy.js` against a real `--dist` build; this file proves
 * the FILE-SHAPE invariants the runtime contract depends on.
 *
 * The merge helper is pure (filesystem-only), so these tests use a real tmp
 * directory and exercise the actual `fs` reads/writes — no mocks.
 */

import Fs from 'fs';
import Os from 'os';
import Path from 'path';

import { mergeExposedEntryIntoRemoteEntry } from './merge_remote_entry';

/**
 * Realistic plugin-chunk shape: pushes `[[chunkId], modules]` onto the
 * `webpackChunkosdMfe_<id>` global. This is the exact prologue rspack emits
 * for an MF exposed-module chunk (verified on disk against
 * `target/mfe/inspector/inspector.plugin.js`).
 */
function pluginChunkContent(pluginId: string): string {
  return (
    `(self["webpackChunkosdMfe_${pluginId}"] = self["webpackChunkosdMfe_${pluginId}"] || ` +
    `[]).push([["${pluginId}__mfe_public_entry"], {/* modules */}]);` +
    `\n//# sourceMappingURL=${pluginId}.plugin.js.map\n`
  );
}

/**
 * Realistic remoteEntry runtime shape: declares the container global, IIFEs
 * the runtime which `forEach`-processes the pre-pushed entry, and assigns the
 * exports onto the container global. This is the exact shape rspack's MF
 * plugin emits (verified on disk against
 * `target/mfe/inspector/remoteEntry.js`).
 */
function remoteEntryContent(pluginId: string): string {
  return (
    `var osdMfe_${pluginId};\n(() => {\nvar chunkLoadingGlobal = self["webpackChunkosdMfe_${pluginId}"] = ` +
    `self["webpackChunkosdMfe_${pluginId}"] || [];\nchunkLoadingGlobal.forEach(/* webpackJsonpCallback */ ` +
    `function(){});\nosdMfe_${pluginId} = {/* container */};\n})();\n` +
    `//# sourceMappingURL=remoteEntry.js.map\n`
  );
}

describe('mergeExposedEntryIntoRemoteEntry (Phase 16, Story 4)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'osd-mfe-merge-test-'));
  });

  afterEach(() => {
    Fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('merges <id>.plugin.js into remoteEntry.js and deletes the standalone chunk', () => {
    const pluginId = 'inspector';
    const chunk = pluginChunkContent(pluginId);
    const remote = remoteEntryContent(pluginId);
    Fs.writeFileSync(Path.join(tmpDir, `${pluginId}.plugin.js`), chunk);
    Fs.writeFileSync(Path.join(tmpDir, 'remoteEntry.js'), remote);

    const result = mergeExposedEntryIntoRemoteEntry(tmpDir, pluginId);

    expect(result.merged).toBe(true);
    expect(Fs.existsSync(Path.join(tmpDir, `${pluginId}.plugin.js`))).toBe(false);
    expect(Fs.existsSync(Path.join(tmpDir, 'remoteEntry.js'))).toBe(true);

    const merged = Fs.readFileSync(Path.join(tmpDir, 'remoteEntry.js'), 'utf8');
    // Chunk push appears FIRST (queues onto `webpackChunkosdMfe_<id>` before the runtime takes over)
    expect(merged).toMatch(new RegExp(`webpackChunkosdMfe_${pluginId}.*push`));
    // Runtime is preserved end-to-end
    expect(merged).toContain(`var osdMfe_${pluginId};`);
    // Ordering: chunk push BEFORE runtime IIFE
    expect(merged.indexOf(`${pluginId}__mfe_public_entry`)).toBeLessThan(
      merged.indexOf(`var osdMfe_${pluginId};`)
    );
  });

  it('orders the chunk push BEFORE the runtime IIFE (chunk-loading invariant)', () => {
    // The runtime in `remoteEntry.js` takes over `webpackChunkosdMfe_<id>.push`
    // and `forEach`-processes pre-pushed entries. Reversing the order would queue
    // nothing for the `forEach` to pick up, and `container.get('./public')` would
    // try to chunk-fetch a file that no longer exists.
    const pluginId = 'data';
    Fs.writeFileSync(Path.join(tmpDir, `${pluginId}.plugin.js`), 'CHUNK_PUSH_MARKER;');
    Fs.writeFileSync(Path.join(tmpDir, 'remoteEntry.js'), 'RUNTIME_MARKER;');

    mergeExposedEntryIntoRemoteEntry(tmpDir, pluginId);

    const merged = Fs.readFileSync(Path.join(tmpDir, 'remoteEntry.js'), 'utf8');
    const chunkIdx = merged.indexOf('CHUNK_PUSH_MARKER');
    const runtimeIdx = merged.indexOf('RUNTIME_MARKER');
    expect(chunkIdx).toBeGreaterThan(-1);
    expect(runtimeIdx).toBeGreaterThan(-1);
    expect(chunkIdx).toBeLessThan(runtimeIdx);
  });

  it('inserts a `;` separator between the two contents to defend against ASI edges', () => {
    const pluginId = 'discover';
    // A chunk whose last token doesn't terminate with `;` (e.g. closing `])` of
    // the push call followed by a sourceMappingURL comment that gets stripped).
    Fs.writeFileSync(Path.join(tmpDir, `${pluginId}.plugin.js`), 'foo(])');
    Fs.writeFileSync(Path.join(tmpDir, 'remoteEntry.js'), 'bar()');

    mergeExposedEntryIntoRemoteEntry(tmpDir, pluginId);

    const merged = Fs.readFileSync(Path.join(tmpDir, 'remoteEntry.js'), 'utf8');
    expect(merged).toMatch(/foo\(\]\)\s*\n;\n\s*bar\(\)/);
  });

  it("strips the chunk's trailing `sourceMappingURL=<id>.plugin.js.map` line", () => {
    const pluginId = 'dashboards';
    Fs.writeFileSync(
      Path.join(tmpDir, `${pluginId}.plugin.js`),
      `chunk;\n//# sourceMappingURL=${pluginId}.plugin.js.map\n`
    );
    Fs.writeFileSync(
      Path.join(tmpDir, 'remoteEntry.js'),
      `runtime;\n//# sourceMappingURL=remoteEntry.js.map\n`
    );

    mergeExposedEntryIntoRemoteEntry(tmpDir, pluginId);

    const merged = Fs.readFileSync(Path.join(tmpDir, 'remoteEntry.js'), 'utf8');
    // The chunk's stale sourceMappingURL is gone
    expect(merged).not.toContain(`sourceMappingURL=${pluginId}.plugin.js.map`);
    // The runtime's sourceMappingURL is preserved (exactly once)
    expect(merged).toContain('sourceMappingURL=remoteEntry.js.map');
    expect(merged.match(/sourceMappingURL=/g) ?? []).toHaveLength(1);
  });

  it('deletes the orphaned <id>.plugin.js.map sidecar (dev builds) if present', () => {
    const pluginId = 'visualize';
    Fs.writeFileSync(Path.join(tmpDir, `${pluginId}.plugin.js`), 'chunk;');
    Fs.writeFileSync(Path.join(tmpDir, `${pluginId}.plugin.js.map`), '{"version":3}');
    Fs.writeFileSync(Path.join(tmpDir, 'remoteEntry.js'), 'runtime;');

    mergeExposedEntryIntoRemoteEntry(tmpDir, pluginId);

    expect(Fs.existsSync(Path.join(tmpDir, `${pluginId}.plugin.js`))).toBe(false);
    expect(Fs.existsSync(Path.join(tmpDir, `${pluginId}.plugin.js.map`))).toBe(false);
  });

  it('leaves lazy `<id>.chunk.*.js` files untouched (Phase 11 lazy-loading shape preserved)', () => {
    // Phase 11 isolated lazy navigation chunks (`<id>.chunk.<source>.js`) from
    // the eager exposed entry. Story 4 must NOT collapse those — they remain
    // separate per-chunk SRI-pinned files the MF runtime fetches on demand.
    const pluginId = 'data';
    Fs.writeFileSync(Path.join(tmpDir, `${pluginId}.plugin.js`), 'chunk;');
    Fs.writeFileSync(Path.join(tmpDir, 'remoteEntry.js'), 'runtime;');
    const lazyA = 'lazy-A-bytes';
    const lazyB = 'lazy-B-bytes';
    Fs.writeFileSync(Path.join(tmpDir, `${pluginId}.chunk.public_ui_search_bar.js`), lazyA);
    Fs.writeFileSync(Path.join(tmpDir, `${pluginId}.chunk.public_ui_query_editor.js`), lazyB);
    Fs.writeFileSync(Path.join(tmpDir, `${pluginId}.chunk.public_ui_search_bar.js.map`), '{}');

    mergeExposedEntryIntoRemoteEntry(tmpDir, pluginId);

    expect(
      Fs.readFileSync(Path.join(tmpDir, `${pluginId}.chunk.public_ui_search_bar.js`), 'utf8')
    ).toBe(lazyA);
    expect(
      Fs.readFileSync(Path.join(tmpDir, `${pluginId}.chunk.public_ui_query_editor.js`), 'utf8')
    ).toBe(lazyB);
    expect(Fs.existsSync(Path.join(tmpDir, `${pluginId}.chunk.public_ui_search_bar.js.map`))).toBe(
      true
    );
  });

  it('is a no-op when there is no standalone <id>.plugin.js to merge (defensive guard)', () => {
    // A future rspack config could inline the exposed entry directly into
    // remoteEntry.js (no separate `<id>.plugin.js` emitted). The merge step
    // should silently skip rather than fail the build.
    const pluginId = 'home';
    const remoteContent = 'already-merged;';
    Fs.writeFileSync(Path.join(tmpDir, 'remoteEntry.js'), remoteContent);

    const result = mergeExposedEntryIntoRemoteEntry(tmpDir, pluginId);

    expect(result.merged).toBe(false);
    expect(Fs.readFileSync(Path.join(tmpDir, 'remoteEntry.js'), 'utf8')).toBe(remoteContent);
  });

  it('throws when <id>.plugin.js exists but remoteEntry.js is missing (corrupt build)', () => {
    const pluginId = 'console';
    Fs.writeFileSync(Path.join(tmpDir, `${pluginId}.plugin.js`), 'chunk;');
    // remoteEntry.js intentionally not created — a real build that produced this
    // state is corrupt; failing loudly here is preferable to silently leaving an
    // un-merged eager chunk that the bootstrap would never find.

    expect(() => mergeExposedEntryIntoRemoteEntry(tmpDir, pluginId)).toThrow(
      /expected remoteEntry\.js/i
    );
  });

  it('uses pluginId verbatim in the chunk filename (no namespacing / sanitization)', () => {
    // Plugin ids may contain non-alpha characters used by OSD (`_`, hyphen).
    // The merge must agree with the rspack config's `output.chunkFilename` mapping
    // (`${plugin.id}.plugin.js`) — no normalization here.
    const pluginId = 'vis-builder';
    Fs.writeFileSync(Path.join(tmpDir, `${pluginId}.plugin.js`), 'chunk;');
    Fs.writeFileSync(Path.join(tmpDir, 'remoteEntry.js'), 'runtime;');

    const result = mergeExposedEntryIntoRemoteEntry(tmpDir, pluginId);

    expect(result.merged).toBe(true);
    expect(Fs.existsSync(Path.join(tmpDir, `${pluginId}.plugin.js`))).toBe(false);
    const merged = Fs.readFileSync(Path.join(tmpDir, 'remoteEntry.js'), 'utf8');
    expect(merged).toContain('chunk;');
    expect(merged).toContain('runtime;');
  });

  it('is idempotent across re-runs (a second call is a no-op)', () => {
    const pluginId = 'inspector';
    Fs.writeFileSync(Path.join(tmpDir, `${pluginId}.plugin.js`), pluginChunkContent(pluginId));
    Fs.writeFileSync(Path.join(tmpDir, 'remoteEntry.js'), remoteEntryContent(pluginId));

    const first = mergeExposedEntryIntoRemoteEntry(tmpDir, pluginId);
    const afterFirst = Fs.readFileSync(Path.join(tmpDir, 'remoteEntry.js'), 'utf8');
    const second = mergeExposedEntryIntoRemoteEntry(tmpDir, pluginId);
    const afterSecond = Fs.readFileSync(Path.join(tmpDir, 'remoteEntry.js'), 'utf8');

    expect(first.merged).toBe(true);
    expect(second.merged).toBe(false);
    expect(afterSecond).toBe(afterFirst);
  });

  it('produces a merged file whose byte size equals the two inputs (modulo separator + map strip)', () => {
    // Defensive size invariant: the merge must not duplicate or drop bytes
    // beyond the documented edits (the `\n;\n` separator and the stale
    // sourceMappingURL strip). This catches an accidental double-concat or a
    // partial read.
    const pluginId = 'discover';
    const chunkRaw = 'AAAAAAAAAA';
    const remoteRaw = 'BBBBBBBBBB';
    Fs.writeFileSync(Path.join(tmpDir, `${pluginId}.plugin.js`), chunkRaw);
    Fs.writeFileSync(Path.join(tmpDir, 'remoteEntry.js'), remoteRaw);

    mergeExposedEntryIntoRemoteEntry(tmpDir, pluginId);

    const merged = Fs.readFileSync(Path.join(tmpDir, 'remoteEntry.js'), 'utf8');
    // No source maps in the inputs, no strip happened — only the `\n;\n` separator.
    expect(merged.length).toBe(chunkRaw.length + '\n;\n'.length + remoteRaw.length);
  });
});

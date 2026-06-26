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
 * Tests for the v3 asset pure mutation helpers (Phase 16 Story 2).
 *
 * Coverage:
 *  - applySetCore / Orchestrator / SharedDepsCss: insert + replace cases,
 *    `before` captures the prior value (or null), `next` carries the new field,
 *    inputs are not mutated.
 *  - applySetTheme: insert into an absent themes map, insert into an existing
 *    map, replace an existing theme; `target` is the path-qualified key
 *    `themes.<name>`.
 *  - Each helper returns a clean shape `{ next, before, after, target }`
 *    suitable for direct use by the CLI dispatcher.
 *  - applySetTheme rejects empty/non-string themeName.
 */

import { V3AssetDescriptor, V3Document } from './schema_v3';
import {
  applySetCore,
  applySetOrchestrator,
  applySetSharedDepsCss,
  applySetTheme,
} from './v3_asset_apply';
import {
  FIXTURE_CORE_ASSET,
  FIXTURE_ORCHESTRATOR_ASSET,
  FIXTURE_SHARED_DEPS_CSS_ASSET,
  FIXTURE_THEME_DARK_ASSET,
  FIXTURE_THEME_LIGHT_ASSET,
  fixtureV3FullyPopulated,
  fixtureV3MigrationOnly,
} from './fixtures_v3';

const REPLACEMENT_CORE: V3AssetDescriptor = {
  url: 'https://cdn.example.com/mfe/core/new000000000/core.entry.js',
  integrity: 'sha384-NEW000000000',
  version: '3.5.0+new000000000',
};

describe('applySetCore()', () => {
  it('inserts core into a v3 doc that has none yet (before=null)', () => {
    const doc = fixtureV3MigrationOnly();
    expect(doc.core).toBeUndefined();
    const r = applySetCore(doc, REPLACEMENT_CORE);
    expect(r.before).toBeNull();
    expect(r.after).toEqual(REPLACEMENT_CORE);
    expect(r.target).toBe('core');
    expect(r.next.core).toEqual(REPLACEMENT_CORE);
    // Input not mutated.
    expect(doc.core).toBeUndefined();
  });

  it('replaces an existing core (before captures the prior value)', () => {
    const doc = fixtureV3FullyPopulated();
    const r = applySetCore(doc, REPLACEMENT_CORE);
    expect(r.before).toEqual(FIXTURE_CORE_ASSET);
    expect(r.after).toEqual(REPLACEMENT_CORE);
    expect(r.next.core).toEqual(REPLACEMENT_CORE);
    // The prior fixture isn't mutated.
    expect(doc.core).toEqual(FIXTURE_CORE_ASSET);
  });
});

describe('applySetOrchestrator()', () => {
  it('inserts orchestrator into a fresh v3 doc (before=null)', () => {
    const doc = fixtureV3MigrationOnly();
    const r = applySetOrchestrator(doc, REPLACEMENT_CORE);
    expect(r.before).toBeNull();
    expect(r.next.orchestrator).toEqual(REPLACEMENT_CORE);
    expect(r.target).toBe('orchestrator');
  });

  it('replaces an existing orchestrator', () => {
    const doc = fixtureV3FullyPopulated();
    const r = applySetOrchestrator(doc, REPLACEMENT_CORE);
    expect(r.before).toEqual(FIXTURE_ORCHESTRATOR_ASSET);
    expect(r.next.orchestrator).toEqual(REPLACEMENT_CORE);
  });
});

describe('applySetSharedDepsCss()', () => {
  it('inserts sharedDepsCss into a fresh v3 doc (before=null)', () => {
    const doc = fixtureV3MigrationOnly();
    const r = applySetSharedDepsCss(doc, REPLACEMENT_CORE);
    expect(r.before).toBeNull();
    expect(r.next.sharedDepsCss).toEqual(REPLACEMENT_CORE);
    expect(r.target).toBe('sharedDepsCss');
  });

  it('replaces an existing sharedDepsCss', () => {
    const doc = fixtureV3FullyPopulated();
    const r = applySetSharedDepsCss(doc, REPLACEMENT_CORE);
    expect(r.before).toEqual(FIXTURE_SHARED_DEPS_CSS_ASSET);
    expect(r.next.sharedDepsCss).toEqual(REPLACEMENT_CORE);
  });
});

describe('applySetTheme()', () => {
  it('inserts a theme into a doc with no themes map (before=null)', () => {
    const doc = fixtureV3MigrationOnly();
    expect(doc.themes).toBeUndefined();
    const r = applySetTheme(doc, 'light', FIXTURE_THEME_LIGHT_ASSET);
    expect(r.before).toBeNull();
    expect(r.after).toEqual(FIXTURE_THEME_LIGHT_ASSET);
    expect(r.target).toBe('themes.light');
    expect(r.next.themes).toEqual({ light: FIXTURE_THEME_LIGHT_ASSET });
    expect(doc.themes).toBeUndefined();
  });

  it('inserts a new theme into an existing themes map (other themes preserved)', () => {
    const doc: V3Document = fixtureV3FullyPopulated();
    const NEW_HIGH_CONTRAST: V3AssetDescriptor = {
      url: 'https://cdn.example.com/mfe/themes/high-contrast/hc/legacy_high-contrast_theme.css',
      integrity: 'sha384-HCHCHCHC',
      version: '3.5.0+hc00000000',
    };
    const r = applySetTheme(doc, 'high-contrast', NEW_HIGH_CONTRAST);
    expect(r.before).toBeNull();
    expect(r.next.themes).toEqual({
      light: FIXTURE_THEME_LIGHT_ASSET,
      dark: FIXTURE_THEME_DARK_ASSET,
      'high-contrast': NEW_HIGH_CONTRAST,
    });
    expect(r.target).toBe('themes.high-contrast');
  });

  it('replaces an existing theme (before captures the prior value)', () => {
    const doc = fixtureV3FullyPopulated();
    const REPLACEMENT_DARK: V3AssetDescriptor = {
      url: 'https://cdn.example.com/mfe/themes/dark/zzz/legacy_dark_theme.css',
      integrity: 'sha384-NEW_DARK',
      version: '3.5.0+zzz',
    };
    const r = applySetTheme(doc, 'dark', REPLACEMENT_DARK);
    expect(r.before).toEqual(FIXTURE_THEME_DARK_ASSET);
    expect(r.after).toEqual(REPLACEMENT_DARK);
    expect(r.next.themes!.dark).toEqual(REPLACEMENT_DARK);
    // The light theme is untouched.
    expect(r.next.themes!.light).toEqual(FIXTURE_THEME_LIGHT_ASSET);
  });

  it('rejects an empty themeName', () => {
    expect(() => applySetTheme(fixtureV3MigrationOnly(), '', FIXTURE_THEME_LIGHT_ASSET)).toThrow(
      /themeName must be a non-empty string/
    );
  });
});

describe('apply helpers — input immutability invariant', () => {
  it('a deep mutation of the returned descriptor never leaks back into the source asset', () => {
    const doc = fixtureV3MigrationOnly();
    const r = applySetCore(doc, REPLACEMENT_CORE);
    // The helper shallow-clones the descriptor, so mutating the result must not
    // touch the caller's copy. (Defensive — operators may share descriptors
    // across multiple apply calls.)
    r.after.url = 'mutated';
    expect(REPLACEMENT_CORE.url).toBe(
      'https://cdn.example.com/mfe/core/new000000000/core.entry.js'
    );
  });
});

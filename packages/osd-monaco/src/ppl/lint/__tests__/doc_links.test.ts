/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getBundledCatalog } from '../catalog';
import snapshot from './__fixtures__/doc_links.snapshot.json';

// Tier-1 doc-link drift test (offline, always-on). Asserts the structural
// invariants that catch *code-side* drift deterministically in normal CI:
// catalog<->snapshot parity, no regression to the legacy generic URL, and
// URL-shape/specificity rules. The live tier (doc_links.live.test.ts) adds the
// network checks (404 / missing anchor) and is env-gated so default CI stays
// offline. See DIAGNOSTIC_SURFACE_PLAN.md §9.

const DOCS_PREFIX = 'https://docs.opensearch.org/latest/';
const LEGACY_FRAGMENT = 'search-plugins/sql/ppl';

interface SnapshotEntry {
  docUrl: string;
  page: string;
  anchor: string;
  quality: 'exact' | 'close' | 'weak' | 'gap';
  futureDocUrl?: string;
}

const rules = snapshot.rules as Record<string, SnapshotEntry>;
const expectedUnpublished = new Set<string>(snapshot.expectedUnpublished);
const catalog = getBundledCatalog();
const catalogById = new Map(catalog.map((entry) => [entry.id, entry]));

describe('doc links — tier 1 (offline)', () => {
  it('every catalog rule has a snapshot entry and vice-versa', () => {
    const catalogIds = [...catalogById.keys()].sort();
    const snapshotIds = Object.keys(rules).sort();
    expect(snapshotIds).toEqual(catalogIds);
  });

  it('catalog docUrl matches the snapshot docUrl for every rule', () => {
    for (const entry of catalog) {
      expect(entry.docUrl).toBe(rules[entry.id]?.docUrl);
    }
  });

  it('no rule uses the legacy generic URL', () => {
    for (const entry of catalog) {
      expect(entry.docUrl).not.toContain(LEGACY_FRAGMENT);
    }
  });

  it('every docUrl is on the current docs domain', () => {
    for (const entry of catalog) {
      expect(entry.docUrl.startsWith(DOCS_PREFIX)).toBe(true);
    }
  });

  it('exact/close rules carry a non-empty anchor; weak/gap rules are page-root', () => {
    for (const [id, snap] of Object.entries(rules)) {
      if (snap.quality === 'exact' || snap.quality === 'close') {
        expect(snap.anchor).not.toBe('');
        expect(snap.docUrl).toBe(`${snap.page}#${snap.anchor}`);
      } else {
        // weak (honest page-root) and gap (unpublished) must not assert an anchor.
        expect(snap.anchor).toBe('');
        expect(snap.docUrl).toBe(snap.page);
        expect(id).toBeTruthy();
      }
    }
  });

  it('gap rules are exactly the expectedUnpublished set and carry a futureDocUrl', () => {
    const gaps = Object.entries(rules)
      .filter(([, snap]) => snap.quality === 'gap')
      .map(([id]) => id)
      .sort();
    expect(gaps).toEqual([...expectedUnpublished].sort());
    for (const id of gaps) {
      // A gap documents where it *will* point once upstream publishes, so the
      // follow-up is actionable rather than a forgotten TODO.
      expect(rules[id].futureDocUrl).toBeTruthy();
      expect(rules[id].futureDocUrl).not.toBe(rules[id].docUrl);
    }
  });
});

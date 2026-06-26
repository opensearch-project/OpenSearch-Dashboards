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
 * Pure mutation helpers for the FOUR new v3 asset categories (Phase 16,
 * Story 2). Each helper takes a {@link V3Document} + an asset descriptor and
 * returns `{ next, before, after, target }` — the same shape `applySet…`
 * helpers in `update_cli_v2.ts` produce for v2 mutations — so the v3 CLI
 * dispatcher can append audit entries with a uniform signature.
 *
 * Live in a sibling module rather than inside `update_cli_v2.ts` because:
 *   - update_cli_v2.ts is already large (~655 lines) and the file's domain
 *     is "v2 layered authoring" (default/rollouts/tenantOverrides) — v3 GLOBAL
 *     mutations are a distinct concern.
 *   - These helpers operate on V3Document, not V2Document; mixing the two in
 *     one file blurs the schema boundary.
 *
 * NO validation here (validators live in `schema_v3.ts`). NO file I/O
 * (callers commit atomically through the existing CLI write path). Pure
 * functions over the in-memory doc, deterministic and side-effect-free.
 */

import { V3AssetDescriptor, V3Document } from './schema_v3';

/** Tag used as the audit entry's `target` for the GLOBAL v3 fields. */
const TARGET_CORE = 'core';
const TARGET_ORCHESTRATOR = 'orchestrator';
const TARGET_SHARED_DEPS_CSS = 'sharedDepsCss';

/**
 * Apply `core` to a v3 doc, capturing the prior value (or null) for the
 * audit log. The caller is responsible for committing the returned `next`
 * doc atomically (via the existing update_cli_v2 commit path).
 */
export function applySetCore(
  doc: V3Document,
  asset: V3AssetDescriptor
): {
  next: V3Document;
  before: V3AssetDescriptor | null;
  after: V3AssetDescriptor;
  target: string;
} {
  const before = doc.core ? { ...doc.core } : null;
  const after: V3AssetDescriptor = { ...asset };
  const next: V3Document = { ...doc, core: after };
  return { next, before, after, target: TARGET_CORE };
}

/** Apply `orchestrator` (mirror of {@link applySetCore}). */
export function applySetOrchestrator(
  doc: V3Document,
  asset: V3AssetDescriptor
): {
  next: V3Document;
  before: V3AssetDescriptor | null;
  after: V3AssetDescriptor;
  target: string;
} {
  const before = doc.orchestrator ? { ...doc.orchestrator } : null;
  const after: V3AssetDescriptor = { ...asset };
  const next: V3Document = { ...doc, orchestrator: after };
  return { next, before, after, target: TARGET_ORCHESTRATOR };
}

/** Apply `sharedDepsCss` (mirror of {@link applySetCore}). */
export function applySetSharedDepsCss(
  doc: V3Document,
  asset: V3AssetDescriptor
): {
  next: V3Document;
  before: V3AssetDescriptor | null;
  after: V3AssetDescriptor;
  target: string;
} {
  const before = doc.sharedDepsCss ? { ...doc.sharedDepsCss } : null;
  const after: V3AssetDescriptor = { ...asset };
  const next: V3Document = { ...doc, sharedDepsCss: after };
  return { next, before, after, target: TARGET_SHARED_DEPS_CSS };
}

/**
 * Apply a single theme entry. Themes are a MAP keyed by theme name; setting
 * a theme creates the map if absent and either inserts or replaces the
 * named entry. The audit `target` is the full key path (`themes.<name>`) so
 * the operator can grep history for one theme without scanning all themes.
 */
export function applySetTheme(
  doc: V3Document,
  themeName: string,
  asset: V3AssetDescriptor
): {
  next: V3Document;
  before: V3AssetDescriptor | null;
  after: V3AssetDescriptor;
  target: string;
} {
  if (typeof themeName !== 'string' || themeName.length === 0) {
    throw new Error('applySetTheme: themeName must be a non-empty string');
  }
  const themes = doc.themes ?? {};
  const before = themes[themeName] ? { ...themes[themeName] } : null;
  const after: V3AssetDescriptor = { ...asset };
  const nextThemes: Record<string, V3AssetDescriptor> = { ...themes, [themeName]: after };
  const next: V3Document = { ...doc, themes: nextThemes };
  return { next, before, after, target: `themes.${themeName}` };
}

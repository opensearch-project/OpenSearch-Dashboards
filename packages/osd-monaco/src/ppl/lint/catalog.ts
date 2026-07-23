/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppliesTo, CatalogEntry } from './types';
import { LintSeverity } from './diagnostic';
import rawCatalog from './rules_catalog.json';

// TRACKING (opensearch-project/sql#4549): set maxVersion once that issue ships.

const VALID_SEVERITIES: ReadonlySet<string> = new Set<LintSeverity>(['error', 'warning', 'info']);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isValidAppliesTo(value: unknown): value is AppliesTo {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    (candidate.minVersion === undefined || typeof candidate.minVersion === 'string') &&
    (candidate.maxVersion === undefined || typeof candidate.maxVersion === 'string') &&
    (candidate.engine === undefined || candidate.engine === 'calcite')
  );
}

export function validateCatalogEntry(value: unknown): CatalogEntry | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const candidate = value as Record<string, unknown>;

  if (
    !isNonEmptyString(candidate.id) ||
    !isNonEmptyString(candidate.detector) ||
    typeof candidate.enabled !== 'boolean' ||
    typeof candidate.severity !== 'string' ||
    !VALID_SEVERITIES.has(candidate.severity) ||
    typeof candidate.message !== 'string' ||
    typeof candidate.docUrl !== 'string' ||
    !isValidAppliesTo(candidate.appliesTo)
  ) {
    return null;
  }

  for (const key of ['runtimeOnly', 'needsContext', 'needsExplain', 'aiFixable'] as const) {
    if (candidate[key] !== undefined && typeof candidate[key] !== 'boolean') return null;
  }

  return {
    id: candidate.id,
    detector: candidate.detector,
    enabled: candidate.enabled,
    severity: candidate.severity as LintSeverity,
    message: candidate.message,
    docUrl: candidate.docUrl,
    appliesTo: candidate.appliesTo as AppliesTo,
    runtimeOnly: candidate.runtimeOnly as boolean | undefined,
    needsContext: candidate.needsContext as boolean | undefined,
    needsExplain: candidate.needsExplain as boolean | undefined,
    aiFixable: candidate.aiFixable as boolean | undefined,
  };
}

export function loadCatalog(entries: unknown): CatalogEntry[] {
  if (!Array.isArray(entries)) {
    // eslint-disable-next-line no-console
    console.warn('[ppl-lint] catalog is not an array; loading empty catalog');
    return [];
  }

  const valid: CatalogEntry[] = [];
  for (const entry of entries) {
    const parsed = validateCatalogEntry(entry);
    if (parsed) {
      valid.push(parsed);
    } else {
      // eslint-disable-next-line no-console
      console.warn('[ppl-lint] dropped malformed catalog entry', entry);
    }
  }
  return valid;
}

let bundledCatalog: CatalogEntry[] | undefined;

export function getBundledCatalog(): CatalogEntry[] {
  if (!bundledCatalog) {
    const source = Array.isArray(rawCatalog)
      ? rawCatalog
      : (rawCatalog as { default?: unknown }).default;
    bundledCatalog = loadCatalog(source);
  }
  return bundledCatalog;
}

let bundledCatalogById: Map<string, CatalogEntry> | undefined;

/**
 * Look up a bundled catalog entry by rule id. Used by the marker providers to read
 * catalog-owned metadata (e.g. `aiFixable`, `needsExplain`) without importing any rule module.
 */
export function getCatalogEntryById(ruleId: string): CatalogEntry | undefined {
  if (!bundledCatalogById) {
    bundledCatalogById = new Map(getBundledCatalog().map((entry) => [entry.id, entry]));
  }
  return bundledCatalogById.get(ruleId);
}

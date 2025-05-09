/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart, SavedObjectsClientContract } from 'src/core/public';
import { i18n } from '@osd/i18n';

interface IndexExtractionResult {
  datasource: string | null;
  database: string | null;
  index: string | null;
}

export const DIRECT_QUERY_BASE = '/api/directquery';
export const DSL_MAPPING = '/indices.getFieldMapping';
export const DSL_BASE = `${DIRECT_QUERY_BASE}/dsl`;

// Module for handling EMR states for Dashboards Progress Bar. All of these except "fresh" are
// directly from the EMR job run states. "ord" is used to approximate progress (eyeballed relative
// stage times), and "terminal" indicates whether a job is in progress at all.
export const EMR_STATES = new Map<string, { ord: number; terminal: boolean }>([
  ['submitted', { ord: 0, terminal: false }],
  ['queued', { ord: 10, terminal: false }],
  ['pending', { ord: 20, terminal: false }],
  ['scheduled', { ord: 30, terminal: false }],
  ['running', { ord: 70, terminal: false }],
  ['cancelling', { ord: 90, terminal: false }],
  ['success', { ord: 100, terminal: true }],
  ['failed', { ord: 100, terminal: true }],
  ['cancelled', { ord: 100, terminal: true }],
  // The "null state" for a fresh page load, which components conditionally use on load.
  ['fresh', { ord: 100, terminal: true }],
]);

export const MAX_ORD = 100;

export function intervalAsMinutes(interval: number): string {
  const minutes = Math.floor(interval / 60000);
  return minutes === 1
    ? i18n.translate('dashboard.directQuerySync.intervalAsMinutes.oneMinute', {
        defaultMessage: '1 minute',
      })
    : i18n.translate('dashboard.directQuerySync.intervalAsMinutes.multipleMinutes', {
        defaultMessage: '{minutes} minutes',
        values: { minutes },
      });
}

export async function resolveConcreteIndex(
  indexTitle: string,
  http: HttpStart,
  mdsId?: string
): Promise<string | null> {
  if (!indexTitle.includes('*')) return indexTitle;

  try {
    const query = mdsId ? { data_source: mdsId } : {};
    const resolved = await http.get(
      `/internal/index-pattern-management/resolve_index/${encodeURIComponent(indexTitle)}`,
      { query }
    );
    const matchedIndices = resolved?.indices || [];
    return matchedIndices.length > 0 ? matchedIndices[0].name : null;
  } catch (err) {
    return null;
  }
}

export function extractIndexParts(mappingName?: string): IndexExtractionResult {
  // Use mapping name if provided; otherwise, return null values
  if (mappingName) {
    const parts = mappingName.split('.');
    return {
      datasource: parts[0] || null,
      database: parts[1] || null,
      index: parts.slice(2).join('.') || null,
    };
  }

  return {
    datasource: null,
    database: null,
    index: null,
  };
}

export function generateRefreshQuery(info: IndexExtractionResult): string {
  // Ensure all required fields are non-null before constructing the query
  if (!info.datasource || !info.database || !info.index) {
    throw new Error(
      'Cannot generate refresh query: missing required datasource, database, or index'
    );
  }
  return `REFRESH MATERIALIZED VIEW \`${info.datasource}\`.\`${info.database}\`.\`${info.index}\``;
}

/**
 * Extracts index-related information from a dashboard's panels for direct query sync.
 * Analyzes saved objects in the panels to identify a consistent index pattern use case of Integration Vended Dashboards, resolves it to a concrete index,
 * fetches its mapping, and extracts datasource, database, and index details along with metadata like last refresh time.
 * Returns null if the panels reference inconsistent index patterns, lack references, or if the index cannot be resolved.
 */
export async function extractIndexInfoFromDashboard(
  panels: { [key: string]: any },
  savedObjectsClient: SavedObjectsClientContract,
  http: HttpStart
): Promise<{
  parts: IndexExtractionResult;
  mapping: { lastRefreshTime: number };
  mdsId?: string;
} | null> {
  const indexPatternIds: string[] = [];
  const mdsIds: Array<string | undefined> = [];

  for (const panelId of Object.keys(panels)) {
    try {
      const panel = panels[panelId];
      const savedObjectId = panel.explicitInput?.savedObjectId;
      if (!savedObjectId) continue;

      const type = panel.type;
      const savedObject = await savedObjectsClient.get(type, savedObjectId);

      const references = savedObject.references || [];

      if (references.length === 0) {
        continue;
      }

      // Check if there is any non-index-pattern reference
      if (references.some((ref: any) => ref.type !== 'index-pattern')) {
        return null;
      }

      const indexPatternRef = references.find((ref: any) => ref.type === 'index-pattern');
      if (!indexPatternRef) {
        return null;
      }

      const indexPattern = await savedObjectsClient.get('index-pattern', indexPatternRef.id);
      const mdsId =
        indexPattern.references?.find((ref) => ref.type === 'data-source')?.id || undefined;

      indexPatternIds.push(indexPatternRef.id);
      mdsIds.push(mdsId);
    } catch (err: any) {
      // Ignore only 404 errors (missing saved object)
      if (err?.response?.status !== 404) {
        throw err;
      }
    }
  }

  if (indexPatternIds.length === 0) {
    return null;
  }

  if (!sourceCheck(indexPatternIds, mdsIds)) {
    return null;
  }

  const selectedIndexPatternId = indexPatternIds[0];
  const selectedMdsId = mdsIds[0];

  const indexPattern = await savedObjectsClient.get('index-pattern', selectedIndexPatternId);
  const indexTitleRaw = indexPattern.attributes.title;
  const concreteTitle = await resolveConcreteIndex(indexTitleRaw, http, selectedMdsId);

  if (!concreteTitle) return null;

  const mapping = await fetchIndexMapping(concreteTitle, http, selectedMdsId);
  if (!mapping) return null;

  for (const val of Object.values(mapping)) {
    const mappingName = val.mappings?._meta?.name;
    return {
      mapping: val.mappings._meta.properties!,
      parts: extractIndexParts(mappingName),
      mdsId: selectedMdsId,
    };
  }

  return null;
}

export async function fetchIndexMapping(
  index: string,
  http: HttpStart,
  mdsId?: string
): Promise<Record<string, any> | null> {
  try {
    const baseUrl = `${DSL_BASE}${DSL_MAPPING}`;
    const url = mdsId ? `${baseUrl}/dataSourceMDSId=${encodeURIComponent(mdsId)}` : baseUrl;
    const response = await http.get(url, {
      query: { index },
    });

    return response;
  } catch (err) {
    return null;
  }
}

export function sourceCheck(indexPatternIds: string[], mdsIds: Array<string | undefined>): boolean {
  // If no visualizations reference an index pattern, treat as acceptable (no sync, but no conflict).
  if (indexPatternIds.length === 0 && mdsIds.length === 0) {
    return true;
  }

  const uniqueIndexPatternIds = Array.from(new Set(indexPatternIds));
  const uniqueMdsIds = Array.from(new Set(mdsIds));

  const isConsistent = uniqueIndexPatternIds.length === 1 && uniqueMdsIds.length <= 1;

  return isConsistent;
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart, SavedObjectsClientContract } from 'src/core/public';

interface IndexExtractionResult {
  datasource: string;
  database: string;
  index: string;
}

export const DIRECT_QUERY_BASE = '/api/directquery';
export const DSL_MAPPING = '/indices.getFieldMapping';
export const DSL_BASE = `${DIRECT_QUERY_BASE}/dsl`;

// Module for handling EMR states for Dashboards Progress Bar. All of these except "fresh" are
// directly from the EMR job run states. "ord" is used to approximate progress (eyeballed relative
// stage times), and "terminal" indicates whether a job is in progress at all.
export const EMR_STATES = new Map<string, { ord: number; terminal: boolean }>(
  Object.entries({
    submitted: { ord: 0, terminal: false },
    queued: { ord: 10, terminal: false },
    pending: { ord: 20, terminal: false },
    scheduled: { ord: 30, terminal: false },
    running: { ord: 70, terminal: false },
    cancelling: { ord: 90, terminal: false },
    success: { ord: 100, terminal: true },
    failed: { ord: 100, terminal: true },
    cancelled: { ord: 100, terminal: true },
    // The "null state" for a fresh page load, which components conditionally use on load.
    fresh: { ord: 100, terminal: true },
  })
);

export const MAX_ORD = 100;

export function intervalAsMinutes(interval: number): string {
  const minutes = Math.floor(interval / 60000);
  return minutes === 1 ? '1 minute' : minutes + ' minutes';
}

export async function resolveConcreteIndex(
  indexTitle: string,
  http: HttpStart,
  mdsId?: string
): Promise<string | null> {
  if (!indexTitle.includes('*')) return indexTitle;

  try {
    const query: any = mdsId ? { data_source: mdsId } : {};
    const resolved = await http.get(
      `/internal/index-pattern-management/resolve_index/${encodeURIComponent(indexTitle)}`,
      { query }
    );
    const matchedIndices = resolved?.indices || [];
    return matchedIndices.length > 0 ? matchedIndices[0].name : null;
  } catch (err) {
    console.error(`Failed to resolve index pattern "${indexTitle}"`, err);
    return null;
  }
}

export function extractIndexParts(fullIndexName: string): IndexExtractionResult {
  const trimmed = fullIndexName.replace(/^flint_/, '');
  const parts = trimmed.split('_');
  return {
    datasource: parts[0] || 'unknown',
    database: parts[1] || 'unknown',
    index: parts.slice(2).join('_') || 'unknown',
  };
}

export function generateRefreshQuery(info: IndexExtractionResult): string {
  return `REFRESH MATERIALIZED VIEW \`${info.datasource}\`.\`${info.database}\`.\`${info.index}\``;
}

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
        continue; // No references, skip (acceptable)
      }

      // Check if there is any non-index-pattern reference
      if (references.some((ref: any) => ref.type !== 'index-pattern')) {
        console.warn(
          `Visualization ${panelId} references a non-index-pattern object. Disabling sync.`
        );
        return null;
      }

      const indexPatternRef = references.find((ref: any) => ref.type === 'index-pattern');
      if (!indexPatternRef) {
        console.warn(
          `Visualization ${panelId} does not reference an index-pattern. Disabling sync.`
        );
        return null;
      }

      const indexPattern = await savedObjectsClient.get('index-pattern', indexPatternRef.id);
      const mdsId =
        indexPattern.references?.find((ref: any) => ref.type === 'data-source')?.id || undefined;

      indexPatternIds.push(indexPatternRef.id);
      mdsIds.push(mdsId);
    } catch (err) {
      console.warn(`Skipping panel ${panelId} due to error:`, err);
    }
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
    return {
      mapping: val.mappings._meta.properties!,
      parts: extractIndexParts(concreteTitle),
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
    console.log('url', url);
    const response = await http.get(url, {
      query: { index },
    });

    return response;
  } catch (err) {
    console.error(`Failed to fetch mapping for index "${index}"`, err);
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

  const isConsistent = uniqueIndexPatternIds.length === 1 && uniqueMdsIds.length === 1;

  if (!isConsistent) {
    console.warn(
      'Dashboard uses multiple data sources or multiple index patterns. Sync feature disabled.'
    );
  }

  return isConsistent;
}

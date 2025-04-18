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
    queued: { ord: 8, terminal: false },
    pending: { ord: 16, terminal: false },
    scheduled: { ord: 33, terminal: false },
    running: { ord: 67, terminal: false },
    cancelling: { ord: 90, terminal: false },
    success: { ord: 100, terminal: true },
    failed: { ord: 100, terminal: true },
    cancelled: { ord: 100, terminal: true },
    // The "null state" for a fresh page load, which components conditionally use on load.
    fresh: { ord: 100, terminal: true },
  })
);

export const MAX_ORD = 100;

export function timeSince(date: number): string {
  const seconds = Math.floor((new Date().getTime() - date) / 1000);
  const interval: number = seconds / 60;
  return interval > 1 ? Math.floor(interval) + ' minutes' : Math.floor(seconds) + ' seconds';
}

export async function resolveConcreteIndex(
  indexTitle: string,
  http: HttpStart
): Promise<string | null> {
  if (!indexTitle.includes('*')) return indexTitle;

  try {
    const resolved = await http.get(
      `/internal/index-pattern-management/resolve_index/${encodeURIComponent(indexTitle)}`
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
  http: HttpStart,
  mdsId?: string
): Promise<{ parts: IndexExtractionResult; mapping: { lastRefreshTime: number } } | null> {
  for (const panelId of Object.keys(panels)) {
    try {
      const panel = panels[panelId];
      const savedObjectId = panel.explicitInput?.savedObjectId;
      const type = panel.type;

      if (!savedObjectId || type !== 'visualization') continue;

      const savedObject = await savedObjectsClient.get(type, savedObjectId);
      const visState = JSON.parse(savedObject.attributes.visState || '{}');

      if (visState.type !== 'pie') continue;

      const indexPatternRef = savedObject.references.find(
        (ref: any) => ref.type === 'index-pattern'
      );
      if (!indexPatternRef) continue;

      const indexPattern = await savedObjectsClient.get('index-pattern', indexPatternRef.id);
      const indexTitleRaw = indexPattern.attributes.title;

      const concreteTitle = await resolveConcreteIndex(indexTitleRaw, http);
      if (!concreteTitle) return null;

      // Fetch mapping immediately after resolving index
      const mapping = (await fetchIndexMapping(concreteTitle, http, mdsId))!;
      console.log('Index Mapping Result:', mapping);

      for (const val of Object.values(mapping)) {
        return { mapping: val.mappings._meta.properties!, parts: extractIndexParts(concreteTitle) };
      }
    } catch (err) {
      console.warn(`Skipping panel ${panelId} due to error:`, err);
    }
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

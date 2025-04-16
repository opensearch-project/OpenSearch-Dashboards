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

export function extractIndexParts(indexTitle: string): IndexExtractionResult {
  const trimmed = indexTitle.replace(/^flint_/, '');
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
): Promise<IndexExtractionResult | null> {
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

      return extractIndexParts(concreteTitle);
    } catch (err) {
      console.warn(`Skipping panel ${panelId} due to error:`, err);
    }
  }

  return null;
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart, SavedObjectsClientContract, SavedObject } from 'opensearch-dashboards/public';
import { DSL_MAPPING, DSL_BASE } from '../../../../framework/utils/shared';
import { ExternalIndexState } from '../../../../framework/types';

export interface ExportDashboardsResponse {
  version: string;
  objects: SavedObject[];
}

export interface IndexExtractionResult {
  datasource: string | null;
  database: string | null;
  index: string | null;
}

export interface DirectQuerySyncInfo {
  indexState: string | null;
  refreshQuery: string;
  refreshInterval: number | null;
  lastRefreshTime: number | null;
  mappingName: string | null;
  mdsId?: string;
}

export interface IndexPatternAttributes {
  type: string;
  fields: string;
  title: string;
  typeMeta: string;
  timeFieldName?: string;
  intervalName?: string;
  sourceFilters?: string;
  fieldFormatMap?: string;
}

export async function fetchDirectQuerySyncInfo({
  http,
  savedObjectsClient,
  dashboardId,
}: {
  http: HttpStart;
  savedObjectsClient: SavedObjectsClientContract;
  dashboardId: string;
}): Promise<DirectQuerySyncInfo | null> {
  try {
    // Step 1: Fetch dashboard export and check index pattern consistency
    const response = await http.get<ExportDashboardsResponse>(
      '/api/opensearch-dashboards/dashboards/export',
      { query: { dashboard: dashboardId } }
    );

    const dashboardObj = response.objects.find(
      (obj) => obj.type === 'dashboard' && obj.id === dashboardId
    );
    if (!dashboardObj) {
      throw new Error('Dashboard object not found in response');
    }

    const panelRefs = dashboardObj.references.filter((ref) =>
      ['visualization', 'lens'].includes(ref.type)
    );

    const indexPatternIds = new Set<string>();
    for (const panelRef of panelRefs) {
      const panelObj = response.objects.find(
        (obj) => obj.id === panelRef.id && obj.type === panelRef.type
      );
      if (!panelObj) continue;

      const indexPatternRef = panelObj.references.find((ref) => ref.type === 'index-pattern');
      if (indexPatternRef) {
        indexPatternIds.add(indexPatternRef.id);
      }
    }

    const isConsistent = indexPatternIds.size === 1;

    if (!isConsistent) {
      return null;
    }

    // Step 2: If consistent, fetch the index pattern's saved object to get mdsId and title
    let localMdsId: string | undefined;
    let indexTitle: string | null = null;
    if (indexPatternIds.size === 1) {
      const selectedIndexPatternId = indexPatternIds.values().next().value;
      if (typeof selectedIndexPatternId === 'string') {
        const indexPattern = await savedObjectsClient.get<IndexPatternAttributes>(
          'index-pattern',
          selectedIndexPatternId
        );
        const dataSourceRef = indexPattern.references.find((ref) => ref.type === 'data-source');
        localMdsId = dataSourceRef?.id;
        indexTitle = indexPattern.attributes.title || null;
      }
    }

    if (!indexTitle) {
      return null;
    }

    // Step 3: Resolve the index pattern to a concrete index
    const resolvedIndex = await resolveConcreteIndex(indexTitle, http, localMdsId);
    if (!resolvedIndex) {
      return null;
    }

    // Step 4: Fetch the index mapping
    const localMapping = await fetchIndexMapping(resolvedIndex, http, localMdsId);
    if (!localMapping) {
      return null;
    }

    // Step 5: Extract index parts, refresh interval, last refresh time, and name
    const { parts, refreshInterval, lastRefreshTime, mappingName, indexState } = extractIndexInfo(
      localMapping,
      resolvedIndex
    );

    if (!parts) {
      return null;
    }

    // Step 6: Generate the refresh query
    const refreshQuery = generateRefreshQuery(parts);

    return {
      indexState,
      refreshQuery,
      refreshInterval,
      lastRefreshTime,
      mappingName,
      mdsId: localMdsId,
    };
  } catch (err) {
    return null;
  }
}

export async function resolveConcreteIndex(
  indexTitle: string,
  httpClient: HttpStart,
  mdsId?: string
): Promise<string | null> {
  if (!indexTitle.includes('*')) return indexTitle;

  try {
    const query = mdsId ? { data_source: mdsId } : {};
    const resolved = await httpClient.get(
      `/internal/index-pattern-management/resolve_index/${encodeURIComponent(indexTitle)}`,
      { query }
    );
    const matchedIndices = resolved?.indices || [];
    return matchedIndices.length > 0 ? matchedIndices[0].name : null;
  } catch (err) {
    return null;
  }
}

export async function fetchIndexMapping(
  index: string,
  httpClient: HttpStart,
  mdsId?: string
): Promise<Record<string, any> | null> {
  try {
    const baseUrl = `${DSL_BASE}${DSL_MAPPING}`;
    const url = mdsId ? `${baseUrl}/dataSourceMDSId=${encodeURIComponent(mdsId)}` : baseUrl;
    const response = await httpClient.get(url, {
      query: { index },
    });

    return response;
  } catch (err) {
    return null;
  }
}

export function extractIndexInfo(
  mapping: Record<string, any>,
  concreteTitle: string
): {
  parts: IndexExtractionResult | null;
  refreshInterval: number | null;
  lastRefreshTime: number | null;
  mappingName: string | null;
  indexState: string | ExternalIndexState | null;
} {
  const mappingValues = Object.values(mapping)[0] as any;
  if (!mappingValues) {
    return {
      parts: null,
      refreshInterval: null,
      lastRefreshTime: null,
      mappingName: null,
      indexState: null,
    };
  }

  const mappingName = mappingValues?.mappings?._meta?.name ?? null;
  const refreshInterval = mappingValues?.mappings?._meta?.properties?.refreshInterval ?? null;
  const lastRefreshTime = mappingValues?.mappings?._meta?.properties?.lastRefreshTime ?? null;
  const indexState = mappingValues?.mappings?._meta?.properties?.indexState ?? null;

  const parts = extractIndexParts(mappingName, concreteTitle);
  return { parts, refreshInterval, lastRefreshTime, mappingName, indexState };
}

export function extractIndexParts(
  mappingName?: string,
  concreteTitle?: string
): IndexExtractionResult {
  const nullResult: IndexExtractionResult = {
    datasource: null,
    database: null,
    index: null,
  };

  if (mappingName) {
    const parts = mappingName.split('.');
    if (parts.length >= 2) {
      const result: IndexExtractionResult = {
        datasource: parts[0] || null,
        database: parts[1] || null,
        index: parts.slice(2).join('.') || null,
      };
      if (!result.datasource || !result.database || !result.index) {
        return nullResult;
      }
      return result;
    }
  }

  if (concreteTitle) {
    const regex = /flint_([\w\-]+)_default_(.+)/;
    const match = concreteTitle.match(regex);
    if (match) {
      const result: IndexExtractionResult = {
        datasource: match[1] || null,
        database: 'default',
        index: match[2] || null,
      };
      if (!result.datasource || !result.database || !result.index) {
        return nullResult;
      }
      return result;
    }
  }

  return nullResult;
}

export function generateRefreshQuery(info: IndexExtractionResult): string {
  if (!info.datasource || !info.database || !info.index) {
    throw new Error(
      'Cannot generate refresh query: missing required datasource, database, or index'
    );
  }
  return `REFRESH MATERIALIZED VIEW \`${info.datasource}\`.\`${info.database}\`.\`${info.index}\``;
}

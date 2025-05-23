/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart, SavedObjectsClientContract } from 'opensearch-dashboards/public';

export interface SavedObject {
  id: string;
  type: string;
  attributes: any;
  references: Array<{ name: string; type: string; id: string }>;
}

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
  refreshQuery: string;
  refreshInterval: number | null;
  lastRefreshTime: number | null;
  mappingName: string | null;
  mdsId?: string;
}

const DIRECT_QUERY_BASE = '/api/directquery';
const DSL_MAPPING = '/indices.getFieldMapping';
const DSL_BASE = `${DIRECT_QUERY_BASE}/dsl`;

export async function fetchDirectQuerySyncInfo({
  http,
  savedObjectsClient,
  dashboardId,
  onError,
}: {
  http: HttpStart;
  savedObjectsClient: SavedObjectsClientContract;
  dashboardId: string;
  onError: (error: string) => void;
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

    const indexPatternIds: string[] = [];
    for (const panelRef of panelRefs) {
      const panelObj = response.objects.find(
        (obj) => obj.id === panelRef.id && obj.type === panelRef.type
      );
      if (!panelObj) continue;

      const indexPatternRef = panelObj.references.find((ref) => ref.type === 'index-pattern');
      if (indexPatternRef) {
        indexPatternIds.push(indexPatternRef.id);
      }
    }

    const uniqueIndexPatternIds = Array.from(new Set(indexPatternIds));
    const isConsistent = uniqueIndexPatternIds.length <= 1;

    if (!isConsistent) {
      return null;
    }

    // Step 2: If consistent, fetch the index pattern's saved object to get mdsId and title
    let localMdsId: string | undefined;
    let indexTitle: string | null = null;
    if (uniqueIndexPatternIds.length === 1) {
      const selectedIndexPatternId = uniqueIndexPatternIds[0];
      const indexPattern = await savedObjectsClient.get('index-pattern', selectedIndexPatternId);
      const dataSourceRef = indexPattern.references.find((ref) => ref.type === 'data-source');
      localMdsId = dataSourceRef?.id; // Can be undefined if no data-source reference
      indexTitle = indexPattern.attributes.title || null;
    } else if (uniqueIndexPatternIds.length === 0) {
      localMdsId = undefined;
      return null;
    }

    if (!indexTitle) {
      throw new Error('Failed to fetch index pattern title');
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
    const { parts, refreshInterval, lastRefreshTime, mappingName } = extractIndexInfo(
      localMapping,
      resolvedIndex
    );

    if (!parts) {
      return null;
    }

    // Step 6: Generate the refresh query
    const refreshQuery = generateRefreshQuery(parts);

    return { refreshQuery, refreshInterval, lastRefreshTime, mappingName, mdsId: localMdsId };
  } catch (err) {
    onError('Failed to fetch dashboard information');
    return null;
  }
}

async function resolveConcreteIndex(
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

async function fetchIndexMapping(
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

function extractIndexInfo(
  mapping: Record<string, any>,
  concreteTitle: string
): {
  parts: IndexExtractionResult | null;
  refreshInterval: number | null;
  lastRefreshTime: number | null;
  mappingName: string | null;
} {
  const mappingValues = Object.values(mapping)[0] as any;
  if (!mappingValues) {
    return { parts: null, refreshInterval: null, lastRefreshTime: null, mappingName: null };
  }

  const mappingName = mappingValues?.mappings?._meta?.name ?? null;
  const refreshInterval = mappingValues?.mappings?._meta?.properties?.refreshInterval ?? null;
  const lastRefreshTime = mappingValues?.mappings?._meta?.properties?.lastRefreshTime ?? null;

  const parts = extractIndexParts(mappingName, concreteTitle);
  return { parts, refreshInterval, lastRefreshTime, mappingName };
}

function extractIndexParts(mappingName?: string, concreteTitle?: string): IndexExtractionResult {
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

function generateRefreshQuery(info: IndexExtractionResult): string {
  if (!info.datasource || !info.database || !info.index) {
    throw new Error(
      'Cannot generate refresh query: missing required datasource, database, or index'
    );
  }
  return `REFRESH MATERIALIZED VIEW \`${info.datasource}\`.\`${info.database}\`.\`${info.index}\``;
}

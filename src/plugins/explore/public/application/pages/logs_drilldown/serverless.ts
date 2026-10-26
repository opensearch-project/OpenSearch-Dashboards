/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Type-only: `dataSource` is an optional plugin, so its enum can't be value-imported into this bundle.
import type { DataSourceEngineType } from '../../../../../data_source/common/data_sources';
import { ExploreServices } from '../../../types';

// String value of `DataSourceEngineType.OpenSearchServerless` (kept in sync with the enum).
const OPENSEARCH_SERVERLESS = 'OpenSearch Serverless' as DataSourceEngineType.OpenSearchServerless;

/**
 * Whether the data source is OpenSearch Serverless, read from its saved object's engine type (set
 * when the data source connection is validated). Any lookup failure is treated as "not serverless"
 * so other engines keep their existing behavior.
 */
export async function isServerlessDataSource(
  services: ExploreServices,
  dataSourceId: string
): Promise<boolean> {
  try {
    const dataSource = await services.savedObjects.client.get<{ dataSourceEngineType?: string }>(
      'data-source',
      dataSourceId
    );
    return dataSource?.attributes?.dataSourceEngineType === OPENSEARCH_SERVERLESS;
  } catch (e) {
    return false;
  }
}

type IndexSettingsResponse = Record<
  string,
  { settings?: { index?: { timestamp_field?: string } } } | undefined
>;

/**
 * The `index.timestamp_field` setting of an OpenSearch Serverless time-series index (or of every
 * index a pattern matches), e.g. `@timestamp` or a custom field set at index creation. Every
 * document must carry it and the index is sorted on it, so it is the right default time field.
 * Returns undefined when the setting is absent, the matched indexes disagree, or the lookup fails.
 */
export async function fetchTimestampField(
  services: ExploreServices,
  dataSourceId: string,
  index: string
): Promise<string | undefined> {
  try {
    const response = await services.http.get<IndexSettingsResponse>(
      `/api/directquery/dsl/indices.getFieldSettings/dataSourceMDSId=${dataSourceId}`,
      { query: { index } }
    );
    const fields = new Set(
      Object.values(response ?? {})
        .map((entry) => entry?.settings?.index?.timestamp_field)
        .filter((field): field is string => !!field)
    );
    return fields.size === 1 ? [...fields][0] : undefined;
  } catch (e) {
    return undefined;
  }
}

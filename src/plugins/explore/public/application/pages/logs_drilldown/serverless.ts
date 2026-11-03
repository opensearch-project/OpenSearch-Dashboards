/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Type-only: `dataSource` is an optional plugin, so its enum can't be value-imported into this bundle.
import type { DataSourceEngineType } from '../../../../../data_source/common/data_sources';
import { ExploreServices } from '../../../types';
import { getErrorStatus } from './permission_toast';

// String value of `DataSourceEngineType.OpenSearchServerless` (kept in sync with the enum).
const OPENSEARCH_SERVERLESS = 'OpenSearch Serverless' as DataSourceEngineType.OpenSearchServerless;

/**
 * - `serverless`: the saved engine type is OpenSearch Serverless.
 * - `other`: the saved engine type is set to something else.
 * - `unknown`: no engine type is saved (e.g. a data source created through the saved-objects API).
 */
export type DataSourceEngineKind = 'serverless' | 'other' | 'unknown';

// One engine-type lookup per data source, shared by every caller on the page. Only successful
// lookups are kept, so a transient saved-object failure is retried on the next call.
const engineKindCache = new Map<string, Promise<DataSourceEngineKind>>();

/** Engine kind of a data source, read from its saved object's engine type. */
export const getDataSourceEngineKind = (
  services: ExploreServices,
  dataSourceId: string
): Promise<DataSourceEngineKind> => {
  const cached = engineKindCache.get(dataSourceId);
  if (cached) return cached;
  // Started inside the chain so a synchronous throw is handled like a failed lookup.
  const lookup = Promise.resolve()
    .then(() =>
      services.savedObjects.client.get<{ dataSourceEngineType?: string }>(
        'data-source',
        dataSourceId
      )
    )
    .then((dataSource): DataSourceEngineKind => {
      const engineType = dataSource?.attributes?.dataSourceEngineType;
      if (!engineType) return 'unknown';
      return engineType === OPENSEARCH_SERVERLESS ? 'serverless' : 'other';
    })
    .catch((): DataSourceEngineKind => {
      engineKindCache.delete(dataSourceId);
      return 'unknown';
    });
  engineKindCache.set(dataSourceId, lookup);
  return lookup;
};

/**
 * Whether the data source is OpenSearch Serverless, read from its saved object's engine type (set
 * when the data source connection is validated). An unknown engine type or a failed lookup counts
 * as "not serverless" so other engines keep their existing behavior.
 */
export const isServerlessDataSource = async (
  services: ExploreServices,
  dataSourceId: string
): Promise<boolean> => (await getDataSourceEngineKind(services, dataSourceId)) === 'serverless';

// Data sources where the settings route itself is missing, so it isn't retried for every index.
const settingsRouteUnavailable = new Set<string>();

/** Test-only: clears the module-level caches. */
export const resetServerlessCaches = (): void => {
  engineKindCache.clear();
  settingsRouteUnavailable.clear();
};

type IndexSettingsResponse = Record<
  string,
  { settings?: { index?: { timestamp_field?: string } } } | undefined
>;

/**
 * The `index.timestamp_field` setting of an OpenSearch Serverless time-series index, e.g.
 * `@timestamp` or a custom field set at index creation. Every document must carry it and the index
 * is sorted on it, so it is the right default time field. For a name that matches several indexes,
 * every index must declare the same field. Returns undefined when the setting is absent on any
 * matched index, the indexes disagree, or the lookup fails.
 */
export async function fetchTimestampField(
  services: ExploreServices,
  dataSourceId: string,
  index: string
): Promise<string | undefined> {
  if (settingsRouteUnavailable.has(dataSourceId)) return undefined;
  try {
    const response = await services.http.get<IndexSettingsResponse>(
      `/api/directquery/dsl/indices.getFieldSettings/dataSourceMDSId=${encodeURIComponent(
        dataSourceId
      )}`,
      { query: { index } }
    );
    const values = Object.values(response ?? {}).map(
      (entry) => entry?.settings?.index?.timestamp_field
    );
    if (values.length === 0 || values.some((field) => !field)) return undefined;
    const fields = new Set(values);
    return fields.size === 1 ? values[0] : undefined;
  } catch (e) {
    // A 404 that isn't the engine's "no such index" means the route itself is missing.
    const message = String((e as { body?: { message?: unknown } })?.body?.message ?? '');
    if (getErrorStatus(e) === 404 && !/index_not_found/.test(message)) {
      settingsRouteUnavailable.add(dataSourceId);
    }
    return undefined;
  }
}

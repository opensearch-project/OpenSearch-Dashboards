/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Helpers for installing sample data on OpenSearch Serverless time series collections.
 *
 * Time series collections require every document to contain the index timestamp field, which is
 * `@timestamp` by default. They can also briefly reject writes to an index that was just deleted
 * and created again with the same name, which is what every sample data install does.
 */

// Same values as DataSourceEngineType.OpenSearchServerless and SigV4ServiceName.OpenSearchServerless
// in the data_source plugin, which home only depends on optionally.
const SERVERLESS_ENGINE_TYPE = 'OpenSearch Serverless';
const SERVERLESS_SIGV4_SERVICE = 'aoss';

export const TIMESTAMP_FIELD = '@timestamp';

export interface DataSourceAttributes {
  dataSourceEngineType?: string;
  auth?: { credentials?: { service?: string } };
}

export interface BulkItemError {
  type?: string;
  reason?: string;
}

export interface BulkItem {
  index?: { status?: number; error?: BulkItemError };
}

export interface BulkResponse {
  errors?: boolean;
  items?: BulkItem[];
}

type Caller = (endpoint: string, clientParams?: Record<string, unknown>) => Promise<unknown>;

/**
 * True for OpenSearch Serverless data sources. The SigV4 service name covers data sources saved
 * before the engine type was stored, or saved without one.
 */
export const isServerlessDataSource = (attributes?: DataSourceAttributes): boolean =>
  attributes?.dataSourceEngineType === SERVERLESS_ENGINE_TYPE ||
  attributes?.auth?.credentials?.service === SERVERLESS_SIGV4_SERVICE;

/**
 * Returns the field mappings with `@timestamp` resolving to the data set's primary time field
 * (the first entry of `timeFields`). Mappings are returned unchanged when the documents carry
 * `@timestamp` themselves or the data set has no time field.
 */
export const withTimestampAlias = (
  fields: object,
  timeFields: string[]
): Record<string, unknown> => {
  const [primaryTimeField] = timeFields;
  if (!primaryTimeField || timeFields.includes(TIMESTAMP_FIELD)) {
    return fields as Record<string, unknown>;
  }
  return { ...fields, [TIMESTAMP_FIELD]: { type: 'alias', path: primaryTimeField } };
};

/**
 * True when the index belongs to a time series collection, which sets `index.timestamp_field` on
 * every index. Only called for Serverless data sources. If the settings can't be read yet, the
 * index is treated as a time series index, because that is when writes can be rejected too.
 */
export const isTimeSeriesIndex = async (caller: Caller, index: string): Promise<boolean> => {
  try {
    const settings = (await caller('indices.getSettings', { index })) as Record<
      string,
      { settings?: { index?: { timestamp_field?: string } } }
    >;
    return Object.values(settings ?? {}).some(
      (indexSettings) => indexSettings?.settings?.index?.timestamp_field !== undefined
    );
  } catch (err) {
    return true;
  }
};

/**
 * True when a bulk item was rejected because the index wasn't ready, so the document was not
 * written and can be sent again without creating a duplicate. Besides index_not_found, the
 * collection answers with a bare "Bad Request"; real document errors explain what is wrong.
 */
export const isNotReadyRejection = (item: BulkItem): boolean => {
  const error = item.index?.error;
  return (
    error?.type === 'index_not_found_exception' ||
    (error?.type === 'illegal_argument_exception' && error?.reason === 'Bad Request')
  );
};

/** True when the whole bulk request was rejected with index_not_found, so nothing was written. */
export const isIndexNotFoundError = (err: unknown): boolean => {
  const error = err as { body?: { error?: { type?: string } }; message?: string } | undefined;
  return (
    error?.body?.error?.type === 'index_not_found_exception' ||
    /index_not_found_exception/.test(error?.message ?? '')
  );
};

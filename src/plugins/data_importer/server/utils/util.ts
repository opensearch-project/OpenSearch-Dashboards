/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import moment from 'moment';
import { FileProcessorService } from '../processors/file_processor_service';
import { OpenSearchClient, RequestHandlerContext } from '../../../../core/server';

// Re-exported so existing `from '../utils/util'` imports keep working; it lives in its own file to
// satisfy the one-class-per-file lint rule (util.ts already defines IndexAccessForbiddenError).
export { BulkIndexForbiddenError } from './bulk_index_forbidden_error';

export const ALPHANUMERIC_REGEX_STRING = /^[a-z][a-z0-9_-]*$/i;
export const LOOKUP_FIELD = '__lookup';

export const decideClient = async (
  dataSourceEnabled: boolean,
  context: RequestHandlerContext,
  dataSourceId?: string
): Promise<OpenSearchClient> => {
  return dataSourceEnabled && dataSourceId
    ? await context.dataSource.opensearch.getClient(dataSourceId)
    : context.core.opensearch.client.asCurrentUser;
};

/**
 * Extracts an HTTP status code from an OpenSearch client error, if present.
 * The OpenSearch JS client throws `ResponseError` which carries `statusCode`
 * directly and under `meta.statusCode`.
 */
export const getErrorStatusCode = (e: any): number | undefined => {
  return e?.statusCode ?? e?.meta?.statusCode;
};

/**
 * Thrown by `checkIndexExists` when the current user lacks permission to
 * access the target index. Carries `statusCode = 403` so route handlers can
 * respond with `forbidden` rather than mislabeling a permission denial as a
 * server fault (`internalError`/500).
 */
export class IndexAccessForbiddenError extends Error {
  public readonly statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'IndexAccessForbiddenError';
  }
}

/**
 * Wraps `client.indices.exists`, translating an authorization failure into an
 * actionable message. The exists API is a HEAD request, so a 403 from the
 * security plugin comes back with an EMPTY body: stringifying the raw error
 * yields `""`, which is the confusing `Error checking if index exists: ""`
 * users hit when their role lacks `indices:admin/get` on the target index.
 */
export const checkIndexExists = async (
  client: OpenSearchClient,
  indexName: string
): Promise<boolean> => {
  try {
    const indexExists = await client.indices.exists({ index: indexName });
    return indexExists.body;
  } catch (e) {
    if (getErrorStatusCode(e) === 403) {
      throw new IndexAccessForbiddenError(
        `You do not have permission to access index "${indexName}". ` +
          `Importing requires permission to create and read the target index ` +
          `(for example the "indices:admin/get" and index create actions).`
      );
    }
    throw e;
  }
};

export const validateFileTypes = (fileTypes: string[], fileProcessors: FileProcessorService) => {
  const nonRegisteredFileTypes = fileTypes.filter(
    (fileType) => !fileProcessors.hasFileProcessorBeenRegistered(fileType)
  );
  if (nonRegisteredFileTypes.length > 0) {
    throw new Error(
      `The following enabledFileTypes are not registered: ${nonRegisteredFileTypes.join(', ')}`
    );
  }
};

export const isValidDate = (date: string) => {
  return (
    moment(date, moment.ISO_8601, true).isValid() || moment(date, moment.RFC_2822, true).isValid()
  );
};

export const isBooleanType = (value: any) => {
  return value === 'true' || value === 'false' || typeof value === 'boolean';
};

export const isNumericType = (value: any) => {
  return !isNaN(Number(value));
};

export const mergeCustomizerForPreview = (objValue: any, srcValue: any) => {
  if (!isBooleanType(objValue) && !isNumericType(objValue)) {
    return objValue;
  } else {
    return srcValue;
  }
};

const flattenObject = (obj: Record<string, any>) => {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] && typeof obj[key] === 'object') {
      const nested = flattenObject(obj[key]);
      if (Object.keys(nested).length === 0) {
        result[`${key}.`] = null;
      }
      for (const nestedKey of Object.keys(nested)) {
        result[`${key}.${nestedKey}`] = nested[nestedKey];
      }
    } else {
      result[key] = obj[key];
    }
  }
  return result;
};

export const isValidObject = (obj: Record<string, any>) => {
  if (Object.keys(obj).length === 0) {
    return false;
  }

  const flattenedObject = flattenObject(obj);

  if (Object.keys(flattenedObject).length === 0) {
    return false;
  }

  const keys = Object.keys(flattenedObject).map((key) => key.replace(/\s/g, ''));
  return keys.every(
    (key) =>
      key.length > 0 && !key.startsWith('.') && !key.endsWith('.') && !!!key.match(/(\.\.)+/g)
  );
};

export const fetchDepthLimit = async (client: OpenSearchClient) => {
  const defaultLimit = 20;

  try {
    const clusterSettings = (
      await client.cluster.getSettings({
        include_defaults: true,
        filter_path: '**.depth.limit',
      })
    ).body;

    const defaultSettingsRaw = Number(clusterSettings.defaults?.indices?.mapping?.depth?.limit);
    const defaultSettings = !isNaN(defaultSettingsRaw) ? defaultSettingsRaw : defaultLimit;

    const persistentSettingsRaw = Number(clusterSettings.persistent.indices?.mapping?.depth?.limit);
    const persistentSettings = !isNaN(persistentSettingsRaw) ? persistentSettingsRaw : defaultLimit;

    const transientSettingsRaw = Number(clusterSettings.transient.indices?.mapping?.depth?.limit);
    const transientSettings = !isNaN(transientSettingsRaw) ? transientSettingsRaw : defaultLimit;

    // To ensure maximum compatibility, we're only considering the minimum of all 3 settings
    return Math.min(defaultSettings, persistentSettings, transientSettings);
  } catch {
    return defaultLimit;
  }
};

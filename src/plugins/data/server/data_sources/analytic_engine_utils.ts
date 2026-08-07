/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { SavedObjectsClientContract } from '../../../../core/server';
import { UNSUPPORTED_ENGINE_TYPES } from '../../common';

/**
 * Checks if a data source is an AnalyticEngine data source.
 * AnalyticEngine data sources only support PPL queries, not DSL queries.
 *
 * @param dataSourceId - The ID of the data source to check
 * @param savedObjectsClient - The saved objects client
 * @returns Promise<boolean> - true if the data source is AnalyticEngine, false otherwise
 */
export async function isAnalyticEngineDataSource(
  dataSourceId: string | undefined,
  savedObjectsClient: SavedObjectsClientContract
): Promise<boolean> {
  if (!dataSourceId) return false;
  try {
    const dataSource = await savedObjectsClient.get<{
      dataSourceEngineType?: string;
    }>('data-source', dataSourceId);
    return (
      !!dataSource?.attributes?.dataSourceEngineType &&
      UNSUPPORTED_ENGINE_TYPES.includes(dataSource?.attributes?.dataSourceEngineType)
    );
  } catch (err) {
    return false;
  }
}

/**
 * Validates that a data source is not an AnalyticEngine data source.
 * Throws an error if the data source is AnalyticEngine.
 *
 * @param dataSourceId - The ID of the data source to validate (undefined/null means local cluster)
 * @param savedObjectsClient - The saved objects client
 * @throws Error if the data source is AnalyticEngine
 */
export async function validateNotAnalyticEngineDataSource(
  dataSourceId: string | undefined,
  savedObjectsClient: SavedObjectsClientContract
): Promise<void> {
  if (!dataSourceId) {
    return;
  }

  const isAE = await isAnalyticEngineDataSource(dataSourceId, savedObjectsClient);
  if (isAE) {
    throwError();
  }
}

export function throwError() {
  const error = new Error(
    i18n.translate('data.datasource.analyticEngineError.withType', {
      defaultMessage:
        'This data source uses Analytic Engine which does not support DSL queries. Use PPL-compatible features or switch to a standard OpenSearch data source.',
    })
  );
  (error as any).name = 'AnalyticEngineError';
  throw error;
}

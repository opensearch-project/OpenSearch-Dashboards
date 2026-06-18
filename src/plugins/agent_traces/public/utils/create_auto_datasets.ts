/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { CORRELATION_TYPE_PREFIXES } from '../../../data/common';
import { DataViewsContract, DuplicateDataViewError } from '../../../data/public';
import { DetectionResult } from './auto_detect_trace_data';

export interface CreateDatasetsResult {
  traceDatasetId: string | null;
  logDatasetId: string | null;
  correlationId: string | null;
}

// Pre-fetch the field list ourselves before calling createAndSave. PR #11653 removed the
async function fetchFieldsForPattern(
  dataViews: DataViewsContract,
  pattern: string,
  dataSourceId?: string
) {
  try {
    const fields = await dataViews.getFieldsForWildcard({ pattern, dataSourceId });
    if (!Array.isArray(fields) || fields.length === 0) {
      // eslint-disable-next-line no-console
      console.warn(`No fields returned for pattern "${pattern}" (dataSource: ${dataSourceId})`);
      return undefined;
    }
    return dataViews.fieldArrayToMap(fields);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to fetch fields for pattern "${pattern}":`, error);
    return undefined;
  }
}

// Force-refresh an existing index pattern's field list and persist it.
async function refreshAndPersistFields(dataViews: DataViewsContract, id: string): Promise<void> {
  try {
    dataViews.clearCache(id);
    const view = await dataViews.get(id);
    await dataViews.refreshFields(view);
    await dataViews.updateSavedObject(view);
    dataViews.clearCache(id);
  } catch {
    // best-effort
  }
}

async function createOrReuseDataView(
  savedObjectsClient: SavedObjectsClientContract,
  dataViews: DataViewsContract,
  spec: Parameters<DataViewsContract['createAndSave']>[0],
  effectiveDataSourceId?: string
): Promise<string | null> {
  const existing = await savedObjectsClient.find({
    type: 'index-pattern',
    searchFields: ['title'],
    search: spec.title as string,
    hasReference: effectiveDataSourceId
      ? { type: 'data-source', id: effectiveDataSourceId }
      : undefined,
  });

  if (existing.total > 0) {
    const existingId = existing.savedObjects[0].id;
    await refreshAndPersistFields(dataViews, existingId);
    return existingId;
  }

  // Pre-fetch fields and embed them in the spec so the saved object lands with a
  // populated field list. If the fetch fails, createAndSave still writes the pattern;
  // refreshAndPersistFields below makes a second attempt.
  const fields = await fetchFieldsForPattern(
    dataViews,
    spec.title as string,
    effectiveDataSourceId
  );

  let createdId: string | null = null;
  try {
    const created = await dataViews.createAndSave({ ...spec, fields });
    createdId = created.id ?? null;
  } catch (error) {
    if (error instanceof DuplicateDataViewError) {
      const dupe = await savedObjectsClient.find({
        type: 'index-pattern',
        searchFields: ['title'],
        search: spec.title as string,
        hasReference: effectiveDataSourceId
          ? { type: 'data-source', id: effectiveDataSourceId }
          : undefined,
      });
      createdId = dupe.savedObjects[0]?.id ?? null;
    } else {
      throw error;
    }
  }

  if (createdId) {
    await refreshAndPersistFields(dataViews, createdId);
  }
  return createdId;
}

/**
 * Create auto-detected trace and log datasets with correlation
 */
export async function createAutoDetectedDatasets(
  savedObjectsClient: SavedObjectsClientContract,
  dataViews: DataViewsContract,
  detection: DetectionResult,
  dataSourceId?: string
): Promise<CreateDatasetsResult> {
  const result: CreateDatasetsResult = {
    traceDatasetId: null,
    logDatasetId: null,
    correlationId: null,
  };

  const effectiveDataSourceId = detection.dataSourceId || dataSourceId;
  const dataSourceSuffix = detection.dataSourceTitle ? ` - ${detection.dataSourceTitle}` : '';
  const dataSourceRef = effectiveDataSourceId
    ? { id: effectiveDataSourceId, type: 'data-source', name: 'dataSource' }
    : undefined;

  if (detection.tracesDetected && detection.tracePattern && detection.traceTimeField) {
    try {
      result.traceDatasetId = await createOrReuseDataView(
        savedObjectsClient,
        dataViews,
        {
          title: detection.tracePattern,
          displayName: `Trace Dataset${dataSourceSuffix}`,
          timeFieldName: detection.traceTimeField,
          signalType: 'traces',
          // @ts-expect-error TS2322 IndexPatternSpec types dataSourceRef as SavedObjectReference
          // which incorrectly requires `version`; runtime only uses id/type/name.
          dataSourceRef,
        },
        effectiveDataSourceId
      );
    } catch (createError) {
      // eslint-disable-next-line no-console
      console.warn('Failed to create trace dataset:', createError);
    }
  }

  if (detection.logsDetected && detection.logPattern && detection.logTimeField) {
    const schemaMappings = {
      otelLogs: {
        timestamp: detection.logTimeField || 'time',
        traceId: 'traceId',
        spanId: 'spanId',
        serviceName: 'resource.attributes.service.name',
      },
    };

    try {
      result.logDatasetId = await createOrReuseDataView(
        savedObjectsClient,
        dataViews,
        {
          title: detection.logPattern,
          displayName: `Log Dataset${dataSourceSuffix}`,
          timeFieldName: detection.logTimeField,
          signalType: 'logs',
          schemaMappings,
          // @ts-expect-error TS2322 see note above on trace dataset.
          dataSourceRef,
        },
        effectiveDataSourceId
      );
    } catch (createError) {
      // eslint-disable-next-line no-console
      console.warn('Failed to create log dataset:', createError);
    }
  }

  if (result.traceDatasetId && result.logDatasetId) {
    try {
      const correlationResponse = await savedObjectsClient.create(
        'correlations',
        {
          title: `trace-to-logs_${detection.tracePattern}`,
          correlationType: `${CORRELATION_TYPE_PREFIXES.TRACE_TO_LOGS}${detection.tracePattern}`,
          version: '1.0.0',
          entities: [
            { tracesDataset: { id: 'references[0].id' } },
            { logsDataset: { id: 'references[1].id' } },
          ],
        },
        {
          references: [
            {
              name: 'entities[0].index',
              type: 'index-pattern',
              id: result.traceDatasetId,
            },
            {
              name: 'entities[1].index',
              type: 'index-pattern',
              id: result.logDatasetId,
            },
          ],
        }
      );
      result.correlationId = correlationResponse.id;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to create correlation:', error);
    }
  }

  return result;
}

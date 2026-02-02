/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { CORRELATION_TYPE_PREFIXES } from '../../../data/common';
import { DetectionResult } from './auto_detect_trace_data';

export interface CreateDatasetsResult {
  traceDatasetId: string | null;
  logDatasetId: string | null;
  correlationId: string | null;
}

/**
 * Create auto-detected trace and log datasets with correlation
 */
export async function createAutoDetectedDatasets(
  savedObjectsClient: SavedObjectsClientContract,
  detection: DetectionResult,
  dataSourceId?: string
): Promise<CreateDatasetsResult> {
  const result: CreateDatasetsResult = {
    traceDatasetId: null,
    logDatasetId: null,
    correlationId: null,
  };

  // Use datasource title from detection if available, otherwise use provided dataSourceId
  const effectiveDataSourceId = detection.dataSourceId || dataSourceId;
  const dataSourceSuffix = detection.dataSourceTitle ? ` - ${detection.dataSourceTitle}` : '';

  // 1. Create trace dataset (check if it already exists first)
  if (detection.tracesDetected && detection.tracePattern && detection.traceTimeField) {
    const displayName = `Trace Dataset${dataSourceSuffix}`;

    // Check if an index pattern with this title already exists
    try {
      const existingPatterns = await savedObjectsClient.find({
        type: 'index-pattern',
        searchFields: ['title'],
        search: detection.tracePattern,
        hasReference: effectiveDataSourceId
          ? { type: 'data-source', id: effectiveDataSourceId }
          : undefined,
      });

      // If a matching pattern exists, use it instead of creating a new one
      if (existingPatterns.total > 0) {
        result.traceDatasetId = existingPatterns.savedObjects[0].id;
      } else {
        // Create new trace dataset
        const traceResponse = await savedObjectsClient.create(
          'index-pattern',
          {
            title: detection.tracePattern,
            displayName,
            timeFieldName: detection.traceTimeField,
            signalType: 'traces',
          },
          {
            references: effectiveDataSourceId
              ? [
                  {
                    id: effectiveDataSourceId,
                    type: 'data-source',
                    name: 'dataSource',
                  },
                ]
              : [],
          }
        );
        result.traceDatasetId = traceResponse.id;
      }
    } catch (error) {
      // If check fails, try to create anyway (will fail if duplicate, but that's ok)
      try {
        const traceResponse = await savedObjectsClient.create(
          'index-pattern',
          {
            title: detection.tracePattern,
            displayName,
            timeFieldName: detection.traceTimeField,
            signalType: 'traces',
          },
          {
            references: effectiveDataSourceId
              ? [
                  {
                    id: effectiveDataSourceId,
                    type: 'data-source',
                    name: 'dataSource',
                  },
                ]
              : [],
          }
        );
        result.traceDatasetId = traceResponse.id;
      } catch (createError) {
        // eslint-disable-next-line no-console
        console.warn('Failed to create trace dataset:', createError);
      }
    }
  }

  // 2. Create log dataset with schema mappings for correlation (check if it already exists first)
  if (detection.logsDetected && detection.logPattern && detection.logTimeField) {
    const displayName = `Log Dataset${dataSourceSuffix}`;

    // Check if an index pattern with this title already exists
    try {
      const existingPatterns = await savedObjectsClient.find({
        type: 'index-pattern',
        searchFields: ['title'],
        search: detection.logPattern,
        hasReference: effectiveDataSourceId
          ? { type: 'data-source', id: effectiveDataSourceId }
          : undefined,
      });

      // If a matching pattern exists, use it instead of creating a new one
      if (existingPatterns.total > 0) {
        result.logDatasetId = existingPatterns.savedObjects[0].id;
      } else {
        // Create new log dataset
        const logResponse = await savedObjectsClient.create(
          'index-pattern',
          {
            title: detection.logPattern,
            displayName,
            timeFieldName: detection.logTimeField,
            signalType: 'logs',
            schemaMappings: JSON.stringify({
              otelLogs: {
                timestamp: detection.logTimeField || 'time',
                traceId: 'traceId',
                spanId: 'spanId',
                serviceName: 'resource.attributes.service.name',
              },
            }),
          },
          {
            references: effectiveDataSourceId
              ? [
                  {
                    id: effectiveDataSourceId,
                    type: 'data-source',
                    name: 'dataSource',
                  },
                ]
              : [],
          }
        );
        result.logDatasetId = logResponse.id;
      }
    } catch (error) {
      // If check fails, try to create anyway (will fail if duplicate, but that's ok)
      try {
        const logResponse = await savedObjectsClient.create(
          'index-pattern',
          {
            title: detection.logPattern,
            displayName,
            timeFieldName: detection.logTimeField,
            signalType: 'logs',
            schemaMappings: JSON.stringify({
              otelLogs: {
                timestamp: detection.logTimeField || 'time',
                traceId: 'traceId',
                spanId: 'spanId',
                serviceName: 'resource.attributes.service.name',
              },
            }),
          },
          {
            references: effectiveDataSourceId
              ? [
                  {
                    id: effectiveDataSourceId,
                    type: 'data-source',
                    name: 'dataSource',
                  },
                ]
              : [],
          }
        );
        result.logDatasetId = logResponse.id;
      } catch (createError) {
        // eslint-disable-next-line no-console
        console.warn('Failed to create log dataset:', createError);
      }
    }
  }

  // 3. Create correlation if both trace and log datasets were created
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

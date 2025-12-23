/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
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

  // 1. Create trace dataset
  if (detection.tracesDetected && detection.tracePattern && detection.traceTimeField) {
    const traceResponse = await savedObjectsClient.create('index-pattern', {
      title: detection.tracePattern,
      displayName: 'Trace Dataset',
      timeFieldName: detection.traceTimeField,
      signalType: 'traces',
      ...(dataSourceId && {
        dataSourceRef: {
          id: dataSourceId,
          type: 'data-source',
        },
      }),
    });
    result.traceDatasetId = traceResponse.id;
  }

  // 2. Create log dataset with schema mappings for correlation
  if (detection.logsDetected && detection.logPattern && detection.logTimeField) {
    const logResponse = await savedObjectsClient.create('index-pattern', {
      title: detection.logPattern,
      displayName: 'Log Dataset',
      timeFieldName: detection.logTimeField,
      signalType: 'logs',
      ...(dataSourceId && {
        dataSourceRef: {
          id: dataSourceId,
          type: 'data-source',
        },
      }),
      schemaMappings: JSON.stringify({
        otelLogs: {
          timeField: 'time',
          traceId: 'traceId',
          spanId: 'spanId',
          serviceName: 'resource.attributes.service.name',
        },
      }),
    });
    result.logDatasetId = logResponse.id;
  }

  // 3. Create correlation if both trace and log datasets were created
  if (result.traceDatasetId && result.logDatasetId) {
    const correlationResponse = await savedObjectsClient.create(
      'correlations',
      {
        correlationType: 'APM-Correlation',
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
  }

  return result;
}

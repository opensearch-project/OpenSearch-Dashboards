/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { IndexPatternsContract } from '../../../data/public';

export interface DetectionResult {
  tracesDetected: boolean;
  logsDetected: boolean;
  tracePattern: string | null;
  logPattern: string | null;
  traceTimeField: string | null;
  logTimeField: string | null;
  dataSourceId?: string;
  dataSourceTitle?: string;
}

/**
 * Auto-detect trace data following OpenTelemetry conventions
 * Checks for otel-v1-apm-span* (traces) and logs-otel-v1* (logs)
 */
export async function detectTraceData(
  savedObjectsClient: SavedObjectsClientContract,
  indexPatternsService: IndexPatternsContract,
  dataSourceId?: string
): Promise<DetectionResult> {
  const result: DetectionResult = {
    tracesDetected: false,
    logsDetected: false,
    tracePattern: null,
    logPattern: null,
    traceTimeField: null,
    logTimeField: null,
    dataSourceId,
  };

  // 1. Check if trace datasets already exist
  try {
    // Get all index patterns and filter by signalType
    const allIndexPatterns = await indexPatternsService.getIds();

    // Check each index pattern for signalType === 'traces'
    for (const id of allIndexPatterns) {
      try {
        const indexPattern = await indexPatternsService.get(id);
        // Only check patterns from the target datasource
        if (
          indexPattern.dataSourceRef?.id !== dataSourceId &&
          (indexPattern.dataSourceRef?.id || dataSourceId)
        ) {
          continue;
        }
        if (indexPattern.signalType === 'traces') {
          // Already have trace datasets, no need to auto-detect
          return result;
        }
      } catch (getError: any) {
        // Skip if can't load this pattern (might be deleted/stale reference)
        continue;
      }
    }
  } catch (error) {
    // If loading fails, continue with detection
  }

  // 2. Check for conventional trace indices: otel-v1-apm-span*
  try {
    const traceFields = await indexPatternsService.getFieldsForWildcard({
      pattern: 'otel-v1-apm-span*',
      dataSourceId,
    });

    // Verify required trace fields exist
    // @ts-expect-error TS7006 TODO(ts-error): fixme
    const hasSpanId = traceFields.some((f) => f.name === 'spanId');
    // @ts-expect-error TS7006 TODO(ts-error): fixme
    const hasTraceId = traceFields.some((f) => f.name === 'traceId');
    // @ts-expect-error TS7006 TODO(ts-error): fixme
    const hasEndTime = traceFields.some((f) => f.name === 'endTime');

    if (hasSpanId && hasTraceId && hasEndTime) {
      result.tracesDetected = true;
      result.tracePattern = 'otel-v1-apm-span*';
      result.traceTimeField = 'endTime';
    }
  } catch (error) {
    // No matching indices found, continue
  }

  // 3. Check for conventional log indices: logs-otel-v1*
  try {
    const logFields = await indexPatternsService.getFieldsForWildcard({
      pattern: 'logs-otel-v1*',
      dataSourceId,
    });

    // Verify correlation fields exist
    // @ts-expect-error TS7006 TODO(ts-error): fixme
    const hasTraceId = logFields.some((f) => f.name === 'traceId');
    // @ts-expect-error TS7006 TODO(ts-error): fixme
    const hasSpanId = logFields.some((f) => f.name === 'spanId');
    // @ts-expect-error TS7006 TODO(ts-error): fixme
    const hasTime = logFields.some((f) => f.name === 'time');

    if (hasTraceId && hasSpanId && hasTime) {
      result.logsDetected = true;
      result.logPattern = 'logs-otel-v1*';
      result.logTimeField = 'time';
    }
  } catch (error) {
    // No matching indices found
  }

  return result;
}

/**
 * Detect trace data across all OpenSearch datasource connections
 * Returns detection results for each datasource that has matching indices
 */
export async function detectTraceDataAcrossDataSources(
  savedObjectsClient: SavedObjectsClientContract,
  indexPatternsService: IndexPatternsContract
): Promise<DetectionResult[]> {
  const results: DetectionResult[] = [];

  // 1. Fetch all data sources
  try {
    const dataSourcesResp = await savedObjectsClient.find<any>({
      type: 'data-source',
      perPage: 10000,
    });

    // 2. Check each data source for trace data
    for (const dataSource of dataSourcesResp.savedObjects) {
      try {
        const detection = await detectTraceData(
          savedObjectsClient,
          indexPatternsService,
          dataSource.id
        );

        // If traces or logs detected, include datasource info and add to results
        if (detection.tracesDetected || detection.logsDetected) {
          // Create a new object with datasource info instead of mutating
          const detectionWithSource: DetectionResult = {
            ...detection,
            dataSourceId: dataSource.id,
            dataSourceTitle: dataSource.attributes.title,
          };
          results.push(detectionWithSource);
        }
      } catch (error) {
        // Skip this datasource if detection fails
        continue;
      }
    }
  } catch (error) {
    // If fetching data sources fails, fall through
  }

  // 3. Also check local cluster (no datasource) - but only if no datasources were found
  // This prevents duplicates when a datasource points to the local cluster
  if (results.length === 0) {
    try {
      const localDetection = await detectTraceData(
        savedObjectsClient,
        indexPatternsService,
        undefined
      );

      if (localDetection.tracesDetected || localDetection.logsDetected) {
        // Create a new object with local cluster title
        const detectionWithSource: DetectionResult = {
          ...localDetection,
          dataSourceTitle: 'Local Cluster',
        };
        results.push(detectionWithSource);
      }
    } catch (error) {
      // Continue if local cluster check fails
    }
  }

  return results;
}

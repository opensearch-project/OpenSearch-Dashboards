/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { isValidTimeField, pickTimeField, TRACE_TIME_FIELD_CANDIDATES } from '../../../data/common';
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
  dataSourceId?: string,
  // When a caller scans many datasources at once, it can compute whether this
  // datasource already has a trace dataset a single time and pass it in, so this
  // function does not repeat the lookup per datasource.
  hasExistingTraceDataset?: boolean
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

  // 1. Skip auto-detection if a trace dataset already exists for this datasource.
  //    Resolve this via a single signalType-projected find rather than fetching
  //    every index pattern individually via get(id): the per-pattern loop caused
  //    an N+1 of _bulk_get calls on page load, each also triggering an uncached
  //    data-source lookup. Callers scanning multiple datasources should pass
  //    `hasExistingTraceDataset` (computed once) to avoid repeating the find.
  let traceDatasetAlreadyExists = hasExistingTraceDataset;
  if (traceDatasetAlreadyExists === undefined) {
    try {
      const indexPatternsResp = await savedObjectsClient.find<{ signalType?: string }>({
        type: 'index-pattern',
        fields: ['signalType'],
        perPage: 10000,
      });

      traceDatasetAlreadyExists = indexPatternsResp.savedObjects.some((obj) => {
        if (obj.attributes?.signalType !== 'traces') {
          return false;
        }
        // Only consider patterns that belong to the target datasource (references
        // are always returned by find, independent of the fields projection).
        const patternDataSourceId = (obj.references || []).find(
          (ref) => ref.type === 'data-source'
        )?.id;
        // Match when ids are equal, or both undefined (local cluster).
        return patternDataSourceId === dataSourceId;
      });
    } catch {
      // If loading fails, continue with detection
      traceDatasetAlreadyExists = false;
    }
  }

  if (traceDatasetAlreadyExists) {
    // Already have trace datasets for this datasource, no need to auto-detect
    return result;
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

    // Filter to date fields actually valid for a Date Histogram (aggregatable, non-nested),
    // then apply trace-specific precedence (startTime → endTime).
    const validDateFieldNames = traceFields
      // @ts-expect-error TS7006 TODO(ts-error): fixme
      .filter((f) => isValidTimeField(f))
      // @ts-expect-error TS7006 TODO(ts-error): fixme
      .map((f) => f.name);
    const traceTimeField = pickTimeField(validDateFieldNames, TRACE_TIME_FIELD_CANDIDATES);

    if (hasSpanId && hasTraceId && traceTimeField) {
      result.tracesDetected = true;
      result.tracePattern = 'otel-v1-apm-span*';
      result.traceTimeField = traceTimeField;
    }
  } catch {
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
  } catch {
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

  // Determine, in a single find, which datasources already have a trace dataset so
  // each per-datasource detection below can skip its own lookup (avoids an N+1 of
  // finds). References are always returned by find, independent of the projection.
  const traceDataSourceIds = new Set<string | undefined>();
  let signalTypeLookupSucceeded = true;
  try {
    const indexPatternsResp = await savedObjectsClient.find<{ signalType?: string }>({
      type: 'index-pattern',
      fields: ['signalType'],
      perPage: 10000,
    });
    indexPatternsResp.savedObjects.forEach((obj) => {
      if (obj.attributes?.signalType === 'traces') {
        const dsId = (obj.references || []).find((ref) => ref.type === 'data-source')?.id;
        traceDataSourceIds.add(dsId);
      }
    });
  } catch {
    // If the lookup fails, fall back to per-datasource detection (pass undefined so
    // each detectTraceData resolves the check itself).
    signalTypeLookupSucceeded = false;
  }

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
          dataSource.id,
          signalTypeLookupSucceeded ? traceDataSourceIds.has(dataSource.id) : undefined
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
      } catch {
        // Skip this datasource if detection fails
        continue;
      }
    }
  } catch {
    // If fetching data sources fails, fall through
  }

  // 3. Also check local cluster (no datasource) - but only if no datasources were found
  // This prevents duplicates when a datasource points to the local cluster
  if (results.length === 0) {
    try {
      const localDetection = await detectTraceData(
        savedObjectsClient,
        indexPatternsService,
        undefined,
        signalTypeLookupSucceeded ? traceDataSourceIds.has(undefined) : undefined
      );

      if (localDetection.tracesDetected || localDetection.logsDetected) {
        // Create a new object with local cluster title
        const detectionWithSource: DetectionResult = {
          ...localDetection,
          dataSourceTitle: 'Local Cluster',
        };
        results.push(detectionWithSource);
      }
    } catch {
      // Continue if local cluster check fails
    }
  }

  return results;
}

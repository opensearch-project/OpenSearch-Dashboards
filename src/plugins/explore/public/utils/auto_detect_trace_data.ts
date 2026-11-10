/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { isValidTimeField, pickTimeField, TRACE_TIME_FIELD_CANDIDATES } from '../../../data/common';
import { IndexPatternsContract } from '../../../data/public';
import {
  getIndexPatternSignalTypes,
  IndexPatternSignalType,
} from './get_index_pattern_signal_types';

const TRACES_SIGNAL_TYPE = 'traces';

/** Data Prepper `trace-analytics-plain-raw-v2` span index pattern. */
export const OTEL_V2_SPAN_INDEX_PATTERN = 'otel-v2-apm-span*';
/** Data Prepper `trace-analytics-plain-raw` (v1) span index pattern. */
export const OTEL_V1_SPAN_INDEX_PATTERN = 'otel-v1-apm-span*';
/**
 * Span index patterns probed in priority order. v2 comes first: when Data Prepper
 * writes to both (e.g. during a v1 → v2 migration), only the v2 pattern is used so
 * spans aren't double-counted. v1 remains the fallback for existing pipelines.
 */
export const OTEL_SPAN_INDEX_PATTERNS = [
  OTEL_V2_SPAN_INDEX_PATTERN,
  OTEL_V1_SPAN_INDEX_PATTERN,
] as const;

/**
 * Build the set of data source ids that already have at least one trace dataset,
 * from a precomputed list of index-pattern signal types.
 */
export const collectTraceDataSourceIds = (
  signalTypes: IndexPatternSignalType[]
): Set<string | undefined> => {
  const traceDataSourceIds = new Set<string | undefined>();
  signalTypes.forEach((pattern) => {
    if (pattern.signalType === TRACES_SIGNAL_TYPE) {
      traceDataSourceIds.add(pattern.dataSourceId);
    }
  });
  return traceDataSourceIds;
};

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
 * Checks for otel-v2-apm-span* then otel-v1-apm-span* (traces) and logs-otel-v1* (logs)
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
  //    Resolve this via a single projected find (see getIndexPatternSignalTypes).
  //    Callers scanning multiple datasources should pass `hasExistingTraceDataset`
  //    (computed once) so the lookup is not repeated per datasource.
  let traceDatasetAlreadyExists = hasExistingTraceDataset;
  if (traceDatasetAlreadyExists === undefined) {
    try {
      const signalTypes = await getIndexPatternSignalTypes(savedObjectsClient);
      // A pattern belongs to this datasource when its resolved data source id matches
      // (both undefined means the local cluster). getIndexPatternSignalTypes resolves
      // the id from references AND id-encoded formats, so remote patterns are not
      // misattributed to the local cluster.
      traceDatasetAlreadyExists = signalTypes.some(
        (pattern) =>
          pattern.signalType === TRACES_SIGNAL_TYPE && pattern.dataSourceId === dataSourceId
      );
    } catch {
      // If loading fails, continue with detection
      traceDatasetAlreadyExists = false;
    }
  }

  if (traceDatasetAlreadyExists) {
    // Already have trace datasets for this datasource, no need to auto-detect
    return result;
  }

  // 2. Check for conventional trace indices, preferring otel-v2-apm-span* over
  //    otel-v1-apm-span*. The first pattern with the required fields wins.
  for (const pattern of OTEL_SPAN_INDEX_PATTERNS) {
    try {
      const traceFields = await indexPatternsService.getFieldsForWildcard({
        pattern,
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
        result.tracePattern = pattern;
        result.traceTimeField = traceTimeField;
        break;
      }
    } catch {
      // No matching indices for this pattern, try the next one
    }
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
  indexPatternsService: IndexPatternsContract,
  // Optional precomputed index-pattern signal types. Callers that already fetched the
  // list (e.g. TraceAutoDetectCallout, to decide whether to render) should pass it so
  // we don't issue a duplicate find for the same data.
  precomputedSignalTypes?: IndexPatternSignalType[]
): Promise<DetectionResult[]> {
  const results: DetectionResult[] = [];

  // Determine, in a single find, which datasources already have a trace dataset so
  // each per-datasource detection below can skip its own lookup (avoids an N+1 of
  // finds). Reuse the caller's list when provided.
  const traceDataSourceIds = new Set<string | undefined>();
  let signalTypeLookupSucceeded = true;
  try {
    const signalTypes =
      precomputedSignalTypes ?? (await getIndexPatternSignalTypes(savedObjectsClient));
    collectTraceDataSourceIds(signalTypes).forEach((dsId) => traceDataSourceIds.add(dsId));
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

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
  };

  // 1. Check if trace datasets already exist
  try {
    // Get all index patterns and filter by signalType
    const allIndexPatterns = await indexPatternsService.getIds();

    // Check each index pattern for signalType === 'traces'
    for (const id of allIndexPatterns) {
      try {
        const indexPattern = await indexPatternsService.get(id);
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
    const hasSpanId = traceFields.some((f) => f.name === 'spanId');
    const hasTraceId = traceFields.some((f) => f.name === 'traceId');
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
    const hasTraceId = logFields.some((f) => f.name === 'traceId');
    const hasSpanId = logFields.some((f) => f.name === 'spanId');
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

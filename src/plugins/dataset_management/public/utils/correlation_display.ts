/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectReference } from '../../../../core/public';

/**
 * Maps internal correlation type to user-friendly display name
 */
export function getCorrelationTypeDisplay(correlationType: string): string {
  const displayMapping: Record<string, string> = {
    'APM-Correlation': 'Trace-to-logs',
    'Trace-to-logs': 'Trace-to-logs',
  };

  return displayMapping[correlationType] || correlationType;
}

/**
 * Resolves a reference placeholder like "references[0].id" to actual ID
 */
function resolveReference(idValue: string, references: SavedObjectReference[] = []): string {
  // Check if the ID is a reference placeholder like "references[0].id"
  const match = idValue.match(/^references\[(\d+)\]\.id$/);
  if (match) {
    const index = parseInt(match[1], 10);
    if (references[index]) {
      return references[index].id;
    }
  }
  // If not a placeholder or reference not found, return as-is
  return idValue;
}

/**
 * Extracts trace and log dataset IDs from correlation entities array
 * Properly handles the array structure by looking for tracesDataset and logsDataset properties
 * Resolves reference placeholders like "references[0].id" to actual dataset IDs
 */
export function extractDatasetIdsFromEntities(
  entities: Array<{
    tracesDataset?: { id: string };
    logsDataset?: { id: string };
  }>,
  references: SavedObjectReference[] = []
): {
  traceDatasetId: string;
  logDatasetIds: string[];
} {
  let traceDatasetId = '';
  const logDatasetIds: string[] = [];

  if (!entities || !Array.isArray(entities)) {
    return { traceDatasetId, logDatasetIds };
  }

  entities.forEach((entity) => {
    if (entity.tracesDataset?.id) {
      traceDatasetId = resolveReference(entity.tracesDataset.id, references);
    }
    if (entity.logsDataset?.id) {
      logDatasetIds.push(resolveReference(entity.logsDataset.id, references));
    }
  });

  return { traceDatasetId, logDatasetIds };
}

/**
 * Builds entities array structure for creating/updating correlations
 */
export function buildCorrelationEntities(
  traceDatasetId: string,
  logDatasetIds: string[]
): Array<{
  tracesDataset?: { id: string };
  logsDataset?: { id: string };
}> {
  const entities: Array<{
    tracesDataset?: { id: string };
    logsDataset?: { id: string };
  }> = [];

  // Add trace dataset entity
  entities.push({
    tracesDataset: { id: traceDatasetId },
  });

  // Add log dataset entities
  logDatasetIds.forEach((logId) => {
    entities.push({
      logsDataset: { id: logId },
    });
  });

  return entities;
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectReference } from '../../../../core/public';
import {
  getCorrelationTypeDisplay,
  extractDatasetIdsFromEntities,
  buildCorrelationEntities,
} from './correlation_display';

describe('correlation_display', () => {
  describe('getCorrelationTypeDisplay', () => {
    it('should return display name for trace-to-logs prefix', () => {
      const display = getCorrelationTypeDisplay('trace-to-logs-my-trace-dataset');
      expect(display).toBe('Trace-to-logs');
    });

    it('should return display name for another trace-to-logs prefix', () => {
      const display = getCorrelationTypeDisplay('trace-to-logs-otel-v1-apm-span*');
      expect(display).toBe('Trace-to-logs');
    });

    it('should return original value for unknown correlation type', () => {
      const display = getCorrelationTypeDisplay('Unknown-Type');
      expect(display).toBe('Unknown-Type');
    });

    it('should handle empty string', () => {
      const display = getCorrelationTypeDisplay('');
      expect(display).toBe('');
    });
  });

  describe('extractDatasetIdsFromEntities', () => {
    it('should extract trace and log dataset IDs from entities with references', () => {
      const entities = [
        { tracesDataset: { id: 'references[0].id' } },
        { logsDataset: { id: 'references[1].id' } },
        { logsDataset: { id: 'references[2].id' } },
      ];

      const references: SavedObjectReference[] = [
        { name: 'entities[0].index', type: 'index-pattern', id: 'trace-dataset-123' },
        { name: 'entities[1].index', type: 'index-pattern', id: 'logs-dataset-456' },
        { name: 'entities[2].index', type: 'index-pattern', id: 'logs-dataset-789' },
      ];

      const result = extractDatasetIdsFromEntities(entities, references);

      expect(result.traceDatasetId).toBe('trace-dataset-123');
      expect(result.logDatasetIds).toEqual(['logs-dataset-456', 'logs-dataset-789']);
    });

    it('should handle direct IDs (not reference placeholders)', () => {
      const entities = [
        { tracesDataset: { id: 'direct-trace-id' } },
        { logsDataset: { id: 'direct-logs-id-1' } },
        { logsDataset: { id: 'direct-logs-id-2' } },
      ];

      const references: SavedObjectReference[] = [];

      const result = extractDatasetIdsFromEntities(entities, references);

      expect(result.traceDatasetId).toBe('direct-trace-id');
      expect(result.logDatasetIds).toEqual(['direct-logs-id-1', 'direct-logs-id-2']);
    });

    it('should handle empty entities array', () => {
      const result = extractDatasetIdsFromEntities([], []);

      expect(result.traceDatasetId).toBe('');
      expect(result.logDatasetIds).toEqual([]);
    });

    it('should handle null entities', () => {
      const result = extractDatasetIdsFromEntities(null as any, []);

      expect(result.traceDatasetId).toBe('');
      expect(result.logDatasetIds).toEqual([]);
    });

    it('should handle undefined entities', () => {
      const result = extractDatasetIdsFromEntities(undefined as any, []);

      expect(result.traceDatasetId).toBe('');
      expect(result.logDatasetIds).toEqual([]);
    });

    it('should handle entities with only traces dataset', () => {
      const entities = [{ tracesDataset: { id: 'references[0].id' } }];

      const references: SavedObjectReference[] = [
        { name: 'entities[0].index', type: 'index-pattern', id: 'trace-dataset-123' },
      ];

      const result = extractDatasetIdsFromEntities(entities, references);

      expect(result.traceDatasetId).toBe('trace-dataset-123');
      expect(result.logDatasetIds).toEqual([]);
    });

    it('should handle entities with only logs datasets', () => {
      const entities = [
        { logsDataset: { id: 'references[0].id' } },
        { logsDataset: { id: 'references[1].id' } },
      ];

      const references: SavedObjectReference[] = [
        { name: 'entities[0].index', type: 'index-pattern', id: 'logs-dataset-456' },
        { name: 'entities[1].index', type: 'index-pattern', id: 'logs-dataset-789' },
      ];

      const result = extractDatasetIdsFromEntities(entities, references);

      expect(result.traceDatasetId).toBe('');
      expect(result.logDatasetIds).toEqual(['logs-dataset-456', 'logs-dataset-789']);
    });

    it('should handle reference index out of bounds gracefully', () => {
      const entities = [
        { tracesDataset: { id: 'references[5].id' } }, // Invalid index
        { logsDataset: { id: 'references[10].id' } }, // Invalid index
      ];

      const references: SavedObjectReference[] = [
        { name: 'entities[0].index', type: 'index-pattern', id: 'trace-dataset-123' },
      ];

      const result = extractDatasetIdsFromEntities(entities, references);

      // Should return placeholder as-is when reference not found
      expect(result.traceDatasetId).toBe('references[5].id');
      expect(result.logDatasetIds).toEqual(['references[10].id']);
    });

    it('should handle mixed reference and direct IDs', () => {
      const entities = [
        { tracesDataset: { id: 'references[0].id' } },
        { logsDataset: { id: 'direct-logs-id' } },
        { logsDataset: { id: 'references[1].id' } },
      ];

      const references: SavedObjectReference[] = [
        { name: 'entities[0].index', type: 'index-pattern', id: 'trace-dataset-123' },
        { name: 'entities[1].index', type: 'index-pattern', id: 'logs-dataset-789' },
      ];

      const result = extractDatasetIdsFromEntities(entities, references);

      expect(result.traceDatasetId).toBe('trace-dataset-123');
      expect(result.logDatasetIds).toEqual(['direct-logs-id', 'logs-dataset-789']);
    });

    it('should handle entities without references parameter', () => {
      const entities = [
        { tracesDataset: { id: 'direct-trace-id' } },
        { logsDataset: { id: 'direct-logs-id' } },
      ];

      const result = extractDatasetIdsFromEntities(entities);

      expect(result.traceDatasetId).toBe('direct-trace-id');
      expect(result.logDatasetIds).toEqual(['direct-logs-id']);
    });

    it('should handle multiple trace datasets (take last one)', () => {
      const entities = [
        { tracesDataset: { id: 'trace-1' } },
        { tracesDataset: { id: 'trace-2' } },
        { logsDataset: { id: 'logs-1' } },
      ];

      const result = extractDatasetIdsFromEntities(entities, []);

      // Last trace dataset ID should be used
      expect(result.traceDatasetId).toBe('trace-2');
      expect(result.logDatasetIds).toEqual(['logs-1']);
    });
  });

  describe('buildCorrelationEntities', () => {
    it('should build correct entities structure for single log dataset', () => {
      const entities = buildCorrelationEntities('trace-123', ['logs-456']);

      expect(entities).toEqual([
        { tracesDataset: { id: 'trace-123' } },
        { logsDataset: { id: 'logs-456' } },
      ]);
    });

    it('should build correct entities structure for multiple log datasets', () => {
      const entities = buildCorrelationEntities('trace-123', ['logs-456', 'logs-789', 'logs-012']);

      expect(entities).toEqual([
        { tracesDataset: { id: 'trace-123' } },
        { logsDataset: { id: 'logs-456' } },
        { logsDataset: { id: 'logs-789' } },
        { logsDataset: { id: 'logs-012' } },
      ]);
    });

    it('should build correct entities structure for empty log datasets array', () => {
      const entities = buildCorrelationEntities('trace-123', []);

      expect(entities).toEqual([{ tracesDataset: { id: 'trace-123' } }]);
    });

    it('should build correct entities structure for max allowed log datasets (5)', () => {
      const logIds = ['logs-1', 'logs-2', 'logs-3', 'logs-4', 'logs-5'];
      const entities = buildCorrelationEntities('trace-123', logIds);

      expect(entities.length).toBe(6); // 1 trace + 5 logs
      expect(entities[0]).toEqual({ tracesDataset: { id: 'trace-123' } });
      expect(entities[1]).toEqual({ logsDataset: { id: 'logs-1' } });
      expect(entities[5]).toEqual({ logsDataset: { id: 'logs-5' } });
    });

    it('should handle empty trace dataset ID', () => {
      const entities = buildCorrelationEntities('', ['logs-456']);

      expect(entities).toEqual([
        { tracesDataset: { id: '' } },
        { logsDataset: { id: 'logs-456' } },
      ]);
    });

    it('should preserve order of log dataset IDs', () => {
      const logIds = ['logs-c', 'logs-a', 'logs-b'];
      const entities = buildCorrelationEntities('trace-123', logIds);

      expect(entities[1]).toEqual({ logsDataset: { id: 'logs-c' } });
      expect(entities[2]).toEqual({ logsDataset: { id: 'logs-a' } });
      expect(entities[3]).toEqual({ logsDataset: { id: 'logs-b' } });
    });
  });

  describe('buildCorrelationEntities and extractDatasetIdsFromEntities integration', () => {
    it('should be reversible operations', () => {
      const originalTraceId = 'trace-dataset-123';
      const originalLogIds = ['logs-456', 'logs-789', 'logs-012'];

      // Build entities
      const entities = buildCorrelationEntities(originalTraceId, originalLogIds);

      // Note: buildCorrelationEntities creates direct IDs, not reference placeholders
      // So we don't need references for extraction
      const extracted = extractDatasetIdsFromEntities(entities, []);

      expect(extracted.traceDatasetId).toBe(originalTraceId);
      expect(extracted.logDatasetIds).toEqual(originalLogIds);
    });

    it('should work with reference placeholders', () => {
      const traceId = 'trace-123';
      const logIds = ['logs-456', 'logs-789'];

      // Build entities with reference placeholders (manual construction)
      const entities = [
        { tracesDataset: { id: 'references[0].id' } },
        { logsDataset: { id: 'references[1].id' } },
        { logsDataset: { id: 'references[2].id' } },
      ];

      const references: SavedObjectReference[] = [
        { name: 'entities[0].index', type: 'index-pattern', id: traceId },
        { name: 'entities[1].index', type: 'index-pattern', id: logIds[0] },
        { name: 'entities[2].index', type: 'index-pattern', id: logIds[1] },
      ];

      const extracted = extractDatasetIdsFromEntities(entities, references);

      expect(extracted.traceDatasetId).toBe(traceId);
      expect(extracted.logDatasetIds).toEqual(logIds);
    });
  });
});

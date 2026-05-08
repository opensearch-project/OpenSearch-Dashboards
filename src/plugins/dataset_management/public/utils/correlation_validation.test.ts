/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataView } from '../../../data/public';
import {
  validateCorrelationConstraints,
  validateMaxLogDatasets,
  checkMissingFieldMappings,
  validateFieldMappings,
  getRequiredFields,
  hasValidFieldMappings,
  getFieldMappingErrorMessage,
  isValidLogsDataset,
  isValidTraceDataset,
} from './correlation_validation';
import { CorrelationSavedObject, MAX_LOG_DATASETS_PER_CORRELATION } from '../types/correlations';

describe('correlation_validation', () => {
  describe('validateCorrelationConstraints', () => {
    const mockCorrelation: CorrelationSavedObject = {
      id: 'existing-correlation-1',
      type: 'correlations',
      attributes: {
        correlationType: 'Trace-to-logs',
        version: '1.0.0',
        entities: [
          { tracesDataset: { id: 'references[0].id' } },
          { logsDataset: { id: 'references[1].id' } },
        ],
      },
      references: [
        { name: 'entities[0].index', type: 'index-pattern', id: 'trace-dataset-1' },
        { name: 'entities[1].index', type: 'index-pattern', id: 'logs-dataset-1' },
      ],
    };

    it('should return valid when trace dataset is not in any correlation', () => {
      const result = validateCorrelationConstraints('new-trace-dataset', [mockCorrelation]);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid when trace dataset is already in another correlation', () => {
      const result = validateCorrelationConstraints('trace-dataset-1', [mockCorrelation]);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('already part of correlation');
      expect(result.error).toContain('existing-correlation-1');
    });

    it('should skip current correlation when editing (currentCorrelationId provided)', () => {
      const result = validateCorrelationConstraints(
        'trace-dataset-1',
        [mockCorrelation],
        'existing-correlation-1'
      );
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle empty correlations array', () => {
      const result = validateCorrelationConstraints('trace-dataset-1', []);
      expect(result.isValid).toBe(true);
    });

    it('should handle multiple correlations and find conflict', () => {
      const correlation2: CorrelationSavedObject = {
        ...mockCorrelation,
        id: 'other-correlation',
      };
      const result = validateCorrelationConstraints('trace-dataset-1', [
        mockCorrelation,
        correlation2,
      ]);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateMaxLogDatasets', () => {
    it('should return valid for 1 log dataset', () => {
      const result = validateMaxLogDatasets(['logs-1']);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for max allowed log datasets (5)', () => {
      const logDatasets = Array.from(
        { length: MAX_LOG_DATASETS_PER_CORRELATION },
        (_, i) => `logs-${i}`
      );
      const result = validateMaxLogDatasets(logDatasets);
      expect(result.isValid).toBe(true);
    });

    it('should return invalid when exceeding max log datasets', () => {
      const logDatasets = Array.from({ length: 6 }, (_, i) => `logs-${i}`);
      const result = validateMaxLogDatasets(logDatasets);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Cannot select more than 5');
      expect(result.error).toContain('Currently selected: 6');
    });

    it('should return invalid when no log datasets are selected', () => {
      const result = validateMaxLogDatasets([]);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('At least one log dataset must be selected');
    });
  });

  describe('checkMissingFieldMappings', () => {
    it('should return empty array when all required fields are present', () => {
      // @ts-expect-error TS2352 TODO(ts-error): fixme
      const dataset = {
        id: 'dataset-1',
        title: 'Test Dataset',
        schemaMappings: {
          otelLogs: {
            traceId: 'traceId',
            spanId: 'spanId',
            serviceName: 'serviceName',
            timestamp: 'timestamp',
          },
        },
      } as DataView;

      const missing = checkMissingFieldMappings(dataset);
      expect(missing).toEqual([]);
    });

    it('should return missing fields when some are not present', () => {
      // @ts-expect-error TS2352 TODO(ts-error): fixme
      const dataset = {
        id: 'dataset-1',
        title: 'Test Dataset',
        schemaMappings: {
          otelLogs: {
            traceId: 'traceId',
            spanId: 'spanId',
            // serviceName and timestamp missing
          },
        },
      } as DataView;

      const missing = checkMissingFieldMappings(dataset);
      expect(missing).toContain('serviceName');
      expect(missing).toContain('timestamp');
      expect(missing.length).toBe(2);
    });

    it('should return all required fields when otelLogs is missing', () => {
      const dataset = {
        id: 'dataset-1',
        title: 'Test Dataset',
        schemaMappings: {},
      } as DataView;

      const missing = checkMissingFieldMappings(dataset);
      expect(missing).toEqual(['traceId', 'spanId', 'serviceName', 'timestamp']);
    });

    it('should return all required fields when schemaMappings is null', () => {
      const dataset = ({
        id: 'dataset-1',
        title: 'Test Dataset',
        schemaMappings: null,
      } as any) as DataView;

      const missing = checkMissingFieldMappings(dataset);
      expect(missing).toEqual(['traceId', 'spanId', 'serviceName', 'timestamp']);
    });

    it('should handle schemaMappings as JSON string', () => {
      const dataset = ({
        id: 'dataset-1',
        title: 'Test Dataset',
        schemaMappings: JSON.stringify({
          otelLogs: {
            traceId: 'traceId',
            spanId: 'spanId',
            serviceName: 'serviceName',
            timestamp: 'timestamp',
          },
        }),
      } as any) as DataView;

      const missing = checkMissingFieldMappings(dataset);
      expect(missing).toEqual([]);
    });

    it('should return all fields when JSON parsing fails', () => {
      const dataset = ({
        id: 'dataset-1',
        title: 'Test Dataset',
        schemaMappings: 'invalid-json',
      } as any) as DataView;

      const missing = checkMissingFieldMappings(dataset);
      expect(missing).toEqual(['traceId', 'spanId', 'serviceName', 'timestamp']);
    });

    it('should detect empty string values as missing', () => {
      // @ts-expect-error TS2352 TODO(ts-error): fixme
      const dataset = {
        id: 'dataset-1',
        title: 'Test Dataset',
        schemaMappings: {
          otelLogs: {
            traceId: 'traceId',
            spanId: '',
            serviceName: '  ',
            timestamp: 'timestamp',
          },
        },
      } as DataView;

      const missing = checkMissingFieldMappings(dataset);
      expect(missing).toContain('spanId');
      expect(missing).toContain('serviceName');
      expect(missing.length).toBe(2);
    });
  });

  describe('validateFieldMappings', () => {
    it('should return valid result when all datasets have complete mappings', () => {
      // @ts-expect-error TS2352 TODO(ts-error): fixme
      const datasets = [
        {
          id: 'dataset-1',
          title: 'Dataset 1',
          schemaMappings: {
            otelLogs: {
              traceId: 'traceId',
              spanId: 'spanId',
              serviceName: 'serviceName',
              timestamp: 'timestamp',
            },
          },
        },
        {
          id: 'dataset-2',
          title: 'Dataset 2',
          schemaMappings: {
            otelLogs: {
              traceId: 'traceId',
              spanId: 'spanId',
              serviceName: 'serviceName',
              timestamp: 'timestamp',
            },
          },
        },
      ] as DataView[];

      const result = validateFieldMappings(datasets);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return invalid result with errors when some datasets have missing fields', () => {
      // @ts-expect-error TS2352 TODO(ts-error): fixme
      const datasets = [
        {
          id: 'dataset-1',
          title: 'Dataset 1',
          schemaMappings: {
            otelLogs: {
              traceId: 'traceId',
              spanId: 'spanId',
              serviceName: 'serviceName',
              timestamp: 'timestamp',
            },
          },
        },
        {
          id: 'dataset-2',
          title: 'Dataset 2',
          schemaMappings: {
            otelLogs: {
              traceId: 'traceId',
              // Missing spanId, serviceName, timestamp
            },
          },
        },
      ] as DataView[];

      const result = validateFieldMappings(datasets);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].datasetId).toBe('dataset-2');
      expect(result.errors[0].datasetTitle).toBe('Dataset 2');
      expect(result.errors[0].missingFields).toContain('spanId');
      expect(result.errors[0].missingFields).toContain('serviceName');
      expect(result.errors[0].missingFields).toContain('timestamp');
    });

    it('should handle empty datasets array', () => {
      const result = validateFieldMappings([]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('getRequiredFields', () => {
    it('should return array of required field names', () => {
      const fields = getRequiredFields();
      expect(fields).toEqual(['traceId', 'spanId', 'serviceName', 'timestamp']);
    });

    it('should return a new array (not the original)', () => {
      const fields1 = getRequiredFields();
      const fields2 = getRequiredFields();
      expect(fields1).not.toBe(fields2);
      expect(fields1).toEqual(fields2);
    });
  });

  describe('hasValidFieldMappings', () => {
    it('should return true when dataset has all required field mappings', () => {
      // @ts-expect-error TS2352 TODO(ts-error): fixme
      const dataset = {
        id: 'dataset-1',
        title: 'Test Dataset',
        schemaMappings: {
          otelLogs: {
            traceId: 'traceId',
            spanId: 'spanId',
            serviceName: 'serviceName',
            timestamp: 'timestamp',
          },
        },
      } as DataView;

      expect(hasValidFieldMappings(dataset)).toBe(true);
    });

    it('should return false when dataset has missing field mappings', () => {
      // @ts-expect-error TS2352 TODO(ts-error): fixme
      const dataset = {
        id: 'dataset-1',
        title: 'Test Dataset',
        schemaMappings: {
          otelLogs: {
            traceId: 'traceId',
            // Missing other fields
          },
        },
      } as DataView;

      expect(hasValidFieldMappings(dataset)).toBe(false);
    });
  });

  describe('getFieldMappingErrorMessage', () => {
    it('should return empty string when no errors', () => {
      const message = getFieldMappingErrorMessage([]);
      expect(message).toBe('');
    });

    it('should return specific message for single dataset error', () => {
      const errors = [
        {
          datasetId: 'dataset-1',
          datasetTitle: 'My Dataset',
          missingFields: ['traceId', 'spanId'],
        },
      ];

      const message = getFieldMappingErrorMessage(errors);
      expect(message).toContain('My Dataset');
      expect(message).toContain('traceId, spanId');
      expect(message).toContain('missing required field mappings');
    });

    it('should return summary message for multiple dataset errors', () => {
      const errors = [
        {
          datasetId: 'dataset-1',
          datasetTitle: 'Dataset 1',
          missingFields: ['traceId'],
        },
        {
          datasetId: 'dataset-2',
          datasetTitle: 'Dataset 2',
          missingFields: ['spanId'],
        },
      ];

      const message = getFieldMappingErrorMessage(errors);
      expect(message).toContain('2 datasets');
      expect(message).toContain('missing required field mappings');
    });
  });

  describe('isValidLogsDataset', () => {
    it('should return true for logs dataset', () => {
      const dataset = {
        id: 'dataset-1',
        title: 'Logs Dataset',
        signalType: 'logs',
      } as DataView;

      expect(isValidLogsDataset(dataset)).toBe(true);
    });

    it('should return false for non-logs dataset', () => {
      const dataset = {
        id: 'dataset-1',
        title: 'Trace Dataset',
        signalType: 'traces',
      } as DataView;

      expect(isValidLogsDataset(dataset)).toBe(false);
    });

    it('should return false for undefined signalType', () => {
      const dataset = {
        id: 'dataset-1',
        title: 'Unknown Dataset',
      } as DataView;

      expect(isValidLogsDataset(dataset)).toBe(false);
    });
  });

  describe('isValidTraceDataset', () => {
    it('should return true for trace dataset', () => {
      const dataset = {
        id: 'dataset-1',
        title: 'Trace Dataset',
        signalType: 'traces',
      } as DataView;

      expect(isValidTraceDataset(dataset)).toBe(true);
    });

    it('should return false for non-trace dataset', () => {
      const dataset = {
        id: 'dataset-1',
        title: 'Logs Dataset',
        signalType: 'logs',
      } as DataView;

      expect(isValidTraceDataset(dataset)).toBe(false);
    });

    it('should return false for undefined signalType', () => {
      const dataset = {
        id: 'dataset-1',
        title: 'Unknown Dataset',
      } as DataView;

      expect(isValidTraceDataset(dataset)).toBe(false);
    });
  });
});

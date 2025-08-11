/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from '../../../../../../../../../core/public';
import { DataPublicPluginStart } from '../../../../../../../../data/public';
import { Dataset } from '../../../../../../../../data/common';
import {
  fetchTraceLogsByTraceId,
  transformLogsResponseToHits,
  LogHit,
} from '../../server/ppl_request_logs';

export interface LogDataset {
  id: string;
  timeFieldName: string;
  title: string;
  type: string;
}

export interface CorrelatedFields {
  logServiceNameField: string;
  logTraceIdField: string;
  logSpanIdField: string;
  timestamp: string;
}

export interface LogEntity {
  id: string;
  name: string;
  type: string;
  meta: {
    correlatedFields: CorrelatedFields;
  };
}

export interface SavedObjectReference {
  id: string;
  type: string;
  name?: string;
}

export interface CorrelationEntity {
  tracesDataset?: {
    meta?: {
      correlatedFields?: CorrelatedFields;
    };
  };
  logsDataset?: {
    meta?: {
      correlatedFields?: CorrelatedFields;
    };
  };
}

export interface CorrelationAttributes {
  entities?: CorrelationEntity[];
  correlations?: {
    entities?: Array<{ id: string }>;
  };
}

export interface SavedObjectCorrelation {
  id: string;
  type: string;
  attributes: CorrelationAttributes;
  references?: SavedObjectReference[];
}

export interface IndexPatternAttributes {
  title: string;
  timeFieldName?: string;
  type?: string;
}

export class CorrelationService {
  constructor(private savedObjectsClient: SavedObjectsClientContract) {}

  /**
   * Find correlations using saved object client pattern
   */
  async findCorrelationsByDataset(datasetId: string, size: number = 10) {
    try {
      const allCorrelationsResponse = await this.savedObjectsClient.find({
        type: 'correlations',
        fields: ['correlations', 'references'],
        perPage: size,
      });

      const filteredCorrelations = allCorrelationsResponse.savedObjects.filter((correlation) => {
        const correlationAttrs = correlation.attributes as CorrelationAttributes;
        const hasReference = correlation.references?.some((ref) => ref.id === datasetId);
        const hasEntityReference = correlationAttrs?.correlations?.entities?.some(
          (entity: { id: string }) => entity.id === datasetId
        );

        return hasReference || hasEntityReference;
      });

      return {
        ...allCorrelationsResponse,
        savedObjects: filteredCorrelations,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to find correlations:', error);
      throw error;
    }
  }

  async fetchLogDataset(logDatasetId: string): Promise<LogDataset> {
    try {
      const indexPattern = await this.savedObjectsClient.get('index-pattern', logDatasetId);

      // Format the dataset object using the actual fields from the response
      const attributes = indexPattern.attributes as IndexPatternAttributes;
      const logDataset: LogDataset = {
        id: indexPattern.id,
        timeFieldName: attributes?.timeFieldName || 'time',
        title: attributes?.title || 'Unknown Title',
        type: attributes?.type || 'INDEX_PATTERN',
      };

      return logDataset;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch log dataset:', error);
      throw error;
    }
  }

  /**
   * Check correlations for current dataset and find log references
   */
  async checkCorrelationsForLogs(dataset: Dataset): Promise<LogDataset[]> {
    if (!dataset?.id) return [];

    try {
      // Find correlations that reference the current dataset
      const correlationsResponse = await this.findCorrelationsByDataset(dataset.id);
      const logDatasets: LogDataset[] = [];

      if (correlationsResponse.savedObjects && correlationsResponse.savedObjects.length > 0) {
        for (const correlation of correlationsResponse.savedObjects) {
          // Parse the correlation structure - it's stored in entities array
          const correlationAttrs = correlation.attributes as CorrelationAttributes;
          const entities = correlationAttrs?.entities;

          if (Array.isArray(entities)) {
            // Find the traces dataset (should match our current dataset)
            const tracesDatasetIndex = entities.findIndex(
              (item: CorrelationEntity) =>
                item.tracesDataset && correlation.references?.[0]?.id === dataset.id
            );

            if (tracesDatasetIndex !== -1) {
              // Look for logs dataset in the entities array
              const logsDatasetIndex = entities.findIndex(
                (item: CorrelationEntity) => item.logsDataset
              );

              if (logsDatasetIndex !== -1) {
                const logsDatasetItem = entities[logsDatasetIndex];
                const logsDatasetId = correlation.references?.[logsDatasetIndex]?.id;

                if (logsDatasetId && logsDatasetItem.logsDataset?.meta) {
                  // Fetch the actual log dataset (index pattern) details
                  const logDataset = await this.fetchLogDataset(logsDatasetId);
                  logDatasets.push(logDataset);
                }
              }
            }
          }
        }
      }

      return logDatasets;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to check correlations for logs:', error);
      return [];
    }
  }

  async checkCorrelationsAndFetchLogs(
    dataset: Dataset,
    data: DataPublicPluginStart,
    traceId: string
  ): Promise<{ logDatasets: LogDataset[]; logs: LogHit[] }> {
    if (!dataset?.id || !data || !traceId) {
      return { logDatasets: [], logs: [] };
    }

    try {
      const logDatasets = await this.checkCorrelationsForLogs(dataset);

      if (logDatasets.length > 0) {
        // Fetch logs for the trace using the first log dataset
        const logsResponse = await fetchTraceLogsByTraceId(data, {
          traceId,
          dataset: logDatasets[0], // Use first log dataset
          limit: 1000,
        });

        const logs = transformLogsResponseToHits(logsResponse);

        return { logDatasets, logs };
      }

      return { logDatasets, logs: [] };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in checkCorrelationsAndFetchLogs:', error);
      return { logDatasets: [], logs: [] };
    }
  }
}

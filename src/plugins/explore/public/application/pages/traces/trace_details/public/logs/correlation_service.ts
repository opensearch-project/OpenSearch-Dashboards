/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObjectsClientContract,
  IUiSettingsClient,
} from '../../../../../../../../../core/public';
import { DataPublicPluginStart } from '../../../../../../../../data/public';
import { Dataset } from '../../../../../../../../data/common';
import { SAMPLE_SIZE_SETTING } from '../../../../../../../common';
import {
  fetchTraceLogsByTraceId,
  transformLogsResponseToHits,
  LogHit,
} from '../../server/ppl_request_logs';

export interface CorrelatedFields {
  logServiceNameField: string;
  logTraceIdField: string;
  logSpanIdField: string;
  timestamp: string;
}

export interface LogEntity {
  id: string;
  name: string;
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
  schemaMappings?: string;
}

export interface DataSourceAttributes {
  title?: string;
  dataSourceEngineType?: string;
}

export class CorrelationService {
  constructor(
    private savedObjectsClient: SavedObjectsClientContract,
    private uiSettings: IUiSettingsClient,
    private dataPlugin?: DataPublicPluginStart
  ) {}

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

  async fetchLogDataset(logDatasetId: string): Promise<Dataset> {
    try {
      // Use dataviews API if available, fallback to saved objects client
      if (this.dataPlugin?.dataViews) {
        try {
          const dataView = await this.dataPlugin.dataViews.get(logDatasetId);
          return await this.dataPlugin.dataViews.convertToDataset(dataView);
        } catch (dataViewError) {
          // eslint-disable-next-line no-console
          console.warn(
            'Failed to fetch dataset using dataviews API, falling back to saved objects:',
            dataViewError
          );
        }
      }

      // Fallback to original saved objects approach
      const indexPattern = await this.savedObjectsClient.get('index-pattern', logDatasetId);

      // Format the dataset object using the actual fields from the response
      const attributes = indexPattern.attributes as IndexPatternAttributes;
      const logDataset: Dataset = {
        id: indexPattern.id,
        timeFieldName: attributes?.timeFieldName || 'time',
        title: attributes?.title || 'Unknown Title',
        type: attributes?.type || 'INDEX_PATTERN',
        schemaMappings: attributes?.schemaMappings
          ? JSON.parse(attributes.schemaMappings)
          : undefined,
      };

      // Extract datasource information from the log dataset's references if it exists
      if (indexPattern.references && indexPattern.references.length > 0) {
        const dataSourceRef = indexPattern.references.find((ref) => ref.type === 'data-source');
        if (dataSourceRef) {
          try {
            // Fetch the actual data source details
            const dataSource = await this.savedObjectsClient.get<DataSourceAttributes>(
              'data-source',
              dataSourceRef.id
            );
            const dataSourceAttrs = dataSource.attributes as DataSourceAttributes;
            // @ts-expect-error TS2741 TODO(ts-error): fixme
            logDataset.dataSource = {
              id: dataSource.id,
              title: dataSourceAttrs?.title || dataSourceRef.name || dataSource.id,
              type: dataSourceAttrs?.dataSourceEngineType || 'OpenSearch',
            };
          } catch (dataSourceError) {
            // eslint-disable-next-line no-console
            console.warn('Failed to fetch data source details for log dataset:', dataSourceError);
            // Fallback to reference information if data source fetch fails
            // @ts-expect-error TS2741 TODO(ts-error): fixme
            logDataset.dataSource = {
              id: dataSourceRef.id,
              title: dataSourceRef.name || dataSourceRef.id,
              type: 'OpenSearch', // Default type
            };
          }
        }
      }

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
  async checkCorrelationsForLogs(dataset: Dataset): Promise<Dataset[]> {
    if (!dataset?.id) return [];
    try {
      // Find correlations that reference the current dataset
      const correlationsResponse = await this.findCorrelationsByDataset(dataset.id);
      const logDatasets: Dataset[] = [];
      if (correlationsResponse.savedObjects && correlationsResponse.savedObjects.length > 0) {
        for (const correlation of correlationsResponse.savedObjects) {
          // Parse the correlation structure - it's stored in entities array
          const correlationAttrs = correlation.attributes as CorrelationAttributes;
          const entities = correlationAttrs?.entities;
          if (Array.isArray(entities) && correlation.references) {
            // Check if this correlation contains both traces and logs datasets
            const hasTracesDataset = entities.some((item: CorrelationEntity) => item.tracesDataset);
            const hasLogsDataset = entities.some((item: CorrelationEntity) => item.logsDataset);
            if (hasTracesDataset && hasLogsDataset) {
              // Find references that are not the current dataset (traces dataset)
              // These should be the log datasets
              const logDatasetRefs = correlation.references.filter((ref) => ref.id !== dataset.id);
              for (const logDatasetRef of logDatasetRefs) {
                try {
                  const logDataset = await this.fetchLogDataset(logDatasetRef.id);
                  logDatasets.push(logDataset);
                } catch (fetchError) {
                  // eslint-disable-next-line no-console
                  console.warn('Failed to fetch log dataset:', logDatasetRef.id, fetchError);
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
    traceId: string,
    size?: number
  ): Promise<{
    logDatasets: Dataset[];
    datasetLogs: Record<string, LogHit[]>;
    logHitCount: number;
  }> {
    if (!dataset?.id || !data || !traceId) {
      return { logDatasets: [], datasetLogs: {}, logHitCount: 0 };
    }
    let logHitCount = 0;
    const datasetLogs: Record<string, LogHit[]> = {};
    try {
      const logDatasets = await this.checkCorrelationsForLogs(dataset);
      if (logDatasets.length > 0) {
        const sampleSize = size || this.uiSettings.get(SAMPLE_SIZE_SETTING);
        // Fetch logs for all datasets
        for (const logDataset of logDatasets) {
          const logsResponse = await fetchTraceLogsByTraceId(data, {
            traceId,
            dataset: logDataset,
            limit: sampleSize,
          });
          const logs = transformLogsResponseToHits(logsResponse);
          logHitCount += logs.length;
          datasetLogs[logDataset.id] = logs;
        }
      }
      return { logDatasets, datasetLogs, logHitCount };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in checkCorrelationsAndFetchLogs:', error);
      return { logDatasets: [], datasetLogs: {}, logHitCount: 0 };
    }
  }
}

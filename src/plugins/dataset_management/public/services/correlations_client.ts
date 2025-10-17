/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObjectsClientContract,
  SavedObjectReference,
  SavedObjectsFindOptions,
} from '../../../../core/public';
import {
  CorrelationSavedObject,
  CorrelationAttributes,
  FindCorrelationsOptions,
  CreateCorrelationData,
  UpdateCorrelationData,
  CORRELATION_TYPES,
  CORRELATION_VERSION,
} from '../types/correlations';
import { extractDatasetIdsFromEntities } from '../utils/correlation_display';

/**
 * Client for managing correlations using the SavedObjects API
 */
export class CorrelationsClient {
  constructor(private savedObjectsClient: SavedObjectsClientContract) {}

  /**
   * Find correlations with optional filtering
   */
  async find(options: FindCorrelationsOptions = {}): Promise<CorrelationSavedObject[]> {
    const { datasetId, page = 1, perPage = 100 } = options;

    const findOptions: SavedObjectsFindOptions = {
      type: 'correlations',
      page,
      perPage,
    };

    // Filter by dataset ID if provided
    if (datasetId) {
      findOptions.hasReference = {
        type: 'index-pattern',
        id: datasetId,
      };
    }

    const response = await this.savedObjectsClient.find<CorrelationAttributes>(findOptions);

    return response.savedObjects as CorrelationSavedObject[];
  }

  /**
   * Get a single correlation by ID
   */
  async get(id: string): Promise<CorrelationSavedObject> {
    const response = await this.savedObjectsClient.get<CorrelationAttributes>('correlations', id);
    return response as CorrelationSavedObject;
  }

  /**
   * Create a new correlation
   */
  async create(data: CreateCorrelationData): Promise<CorrelationSavedObject> {
    const { traceDatasetId, logDatasetIds, correlationType, version } = data;

    // Build references array
    const references: SavedObjectReference[] = [
      {
        name: 'entities[0].index',
        type: 'index-pattern',
        id: traceDatasetId,
      },
      ...logDatasetIds.map((id, idx) => ({
        name: `entities[${idx + 1}].index`,
        type: 'index-pattern',
        id,
      })),
    ];

    // Build attributes
    const attributes: CorrelationAttributes = {
      correlationType: correlationType || CORRELATION_TYPES.TRACES_LOGS,
      version: version || CORRELATION_VERSION,
      entities: [
        { tracesDataset: { id: 'references[0].id' } },
        ...logDatasetIds.map((_, idx) => ({
          logsDataset: { id: `references[${idx + 1}].id` },
        })),
      ],
    };

    const response = await this.savedObjectsClient.create<CorrelationAttributes>(
      'correlations',
      attributes,
      {
        references,
      }
    );

    return response as CorrelationSavedObject;
  }

  /**
   * Update an existing correlation
   */
  async update(data: UpdateCorrelationData): Promise<CorrelationSavedObject> {
    const { id, logDatasetIds } = data;

    // Get existing correlation to preserve trace dataset
    const existing = await this.get(id);

    // Extract trace dataset ID from entities array
    const { traceDatasetId } = extractDatasetIdsFromEntities(
      existing.attributes.entities,
      existing.references
    );

    // Build new references array
    const references: SavedObjectReference[] = [
      {
        name: 'entities[0].index',
        type: 'index-pattern',
        id: traceDatasetId,
      },
      ...logDatasetIds.map((logId, idx) => ({
        name: `entities[${idx + 1}].index`,
        type: 'index-pattern',
        id: logId,
      })),
    ];

    // Build updated attributes
    const attributes: CorrelationAttributes = {
      correlationType: existing.attributes.correlationType,
      version: existing.attributes.version,
      entities: [
        { tracesDataset: { id: 'references[0].id' } },
        ...logDatasetIds.map((_, idx) => ({
          logsDataset: { id: `references[${idx + 1}].id` },
        })),
      ],
    };

    const response = await this.savedObjectsClient.update<CorrelationAttributes>(
      'correlations',
      id,
      attributes,
      {
        references,
      }
    );

    return { ...response, references } as CorrelationSavedObject;
  }

  /**
   * Delete a correlation
   */
  async delete(id: string): Promise<void> {
    await this.savedObjectsClient.delete('correlations', id);
  }

  /**
   * Get all correlations for a specific dataset
   */
  async getCorrelationsForDataset(datasetId: string): Promise<CorrelationSavedObject[]> {
    return this.find({ datasetId });
  }

  /**
   * Count correlations for a specific dataset
   */
  async countForDataset(datasetId: string): Promise<number> {
    const correlations = await this.find({ datasetId, perPage: 1 });
    return correlations.length;
  }

  /**
   * Check if a trace dataset is already part of a correlation
   */
  async isTraceDatasetCorrelated(traceDatasetId: string): Promise<boolean> {
    const correlations = await this.find({ datasetId: traceDatasetId });
    return correlations.length > 0;
  }

  /**
   * Get correlation that includes a specific trace dataset
   */
  async getCorrelationByTraceDataset(
    traceDatasetId: string
  ): Promise<CorrelationSavedObject | null> {
    const correlations = await this.find({ datasetId: traceDatasetId });

    // Find the correlation where this dataset is the trace dataset
    const correlation = correlations.find((corr) => {
      const { traceDatasetId: id } = extractDatasetIdsFromEntities(
        corr.attributes.entities,
        corr.references
      );
      return id === traceDatasetId;
    });

    return correlation || null;
  }
}

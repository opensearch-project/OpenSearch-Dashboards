/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientCommon, Dataset, DataSource, DataStructureCustomMeta } from '../..';
import { IndexPattern } from '../../index_patterns/index_patterns/index_pattern';
import { IDataView, DataViewSpec } from '../types';
import { FieldFormatsStartCommon } from '../../field_formats';
import { extractDatasetTypeFromUri } from '../';
import { DEFAULT_DATA } from '../../constants';

interface DataViewDeps {
  spec?: DataViewSpec;
  savedObjectsClient: SavedObjectsClientCommon;
  fieldFormats: FieldFormatsStartCommon;
  shortDotsEnable: boolean;
  metaFields: string[];
}

/**
 * @experimental This class is experimental and may change in future versions
 */
export class DataView extends IndexPattern implements IDataView {
  public savedObjectsClient: SavedObjectsClientCommon;
  public dataSourceMeta: DataViewSpec['dataSourceMeta'];

  constructor({
    spec = {},
    fieldFormats,
    shortDotsEnable = false,
    metaFields = [],
    savedObjectsClient,
  }: DataViewDeps) {
    super({
      spec,
      fieldFormats,
      shortDotsEnable,
      metaFields,
      savedObjectsClient,
    });

    this.savedObjectsClient = savedObjectsClient;
    this.dataSourceMeta = spec.dataSourceMeta;
  }

  /**
   * Initializes the data source reference by fetching the actual data source details.
   * This populates the dataSourceRef with the full data source information including title.
   *
   * FLOW CONTEXT:
   * This method is called during DataView creation (DataViewsService.create()) to enrich
   * the dataSourceRef with complete information. The spec only contains dataSourceRef.id
   * and dataSourceRef.type from the saved object reference, but we need the actual
   * data source title (name) for display purposes.
   *
   * CACHING BEHAVIOR:
   * - Each DataView instance has its own dataSourceRef object (not shared between instances)
   * - Multiple index-patterns may reference the same data-source ID
   * - SavedObjectsClient.get() cache prevents duplicate network requests for the same ID
   * - Example: 4 index-patterns with same data-source → 4 calls to this method → 1 network request
   *
   * OPTIMIZATION:
   * The fetched data is reused by toDataset() to avoid redundant fetches when converting
   * DataView to Dataset format. See toDataset() documentation for details.
   */
  public async initializeDataSourceRef(): Promise<void> {
    if (!this.dataSourceRef?.id) return;

    try {
      // FIXME: dataSourceRef.type is overloaded with conflicting meanings:
      // - For INDEX_PATTERN datasets: contains saved object type 'data-source' (correct)
      // - For INDEX datasets: contains structure type 'DATA_SOURCE' (incorrect - should be 'data-source')
      // - After initialization: contains engine type like 'OpenSearch', 'S3_GLUE' (metadata, not saved object type)
      //
      // The DataSource interface (src/plugins/data/common/datasets/types.ts:17) claims type is
      // "The engine type of the data source", but actual usage violates this contract:
      // - index_type.ts:56 sets type to DataStructure.type ('DATA_SOURCE')
      // - index_pattern_type.ts:148 sets type to dataSourceEngineType ('OpenSearch', 'S3_GLUE')
      // - SavedObjectReference.type expects saved object type ('data-source')
      //
      // This causes savedObjectsClient.get() to fail for INDEX datasets because 'DATA_SOURCE'
      // is not a registered saved object type. Valid saved object types are:
      // - 'data-source' (defined in src/plugins/data_source/server/saved_objects/data_source.ts:15)
      // - 'data-connection' (defined in src/plugins/data_source/server/saved_objects/data_connection.ts:9)
      //
      // TEMPORARY FIX: Hardcoding 'data-source' instead of using this.dataSourceRef.type
      // This works for INDEX_PATTERN datasets (already 'data-source') and fixes INDEX datasets
      // (which incorrectly have 'DATA_SOURCE'), but assumes all data sources are 'data-source' type.
      //
      // TODO: Proper fix - Normalize structure types to saved object types before calling get():
      //   const savedObjectType = this.dataSourceRef.type === 'DATA_SOURCE' ? 'data-source' : this.dataSourceRef.type;
      //   await this.savedObjectsClient.get(savedObjectType, this.dataSourceRef.id);
      const dataSourceSavedObject = await this.savedObjectsClient.get(
        'data-source',
        this.dataSourceRef.id
      );
      const attributes = dataSourceSavedObject.attributes as any;
      this.dataSourceRef = {
        id: this.dataSourceRef.id,
        type: attributes.dataSourceEngineType || this.dataSourceRef.type,
        version: attributes.dataSourceVersion || this.dataSourceRef.version,
        name: attributes.title || this.dataSourceRef.name || this.dataSourceRef.id,
      };
    } catch (error) {
      // If data source fetch fails, keep the existing dataSourceRef as-is
      // This ensures the DataView can still be used even if the data source is unavailable
    }
  }

  /**
   * Converts a DataView to a serializable Dataset object.
   * Maps dataSourceRef and includes only essential properties for backward compatibility.
   *
   * FLOW CONTEXT:
   * This method is typically called after dataViews.get() which creates a DataView and
   * calls initializeDataSourceRef(). The dataSourceRef is already populated with complete
   * data source information at this point.
   *
   * OPTIMIZATION STRATEGY:
   * Instead of fetching the data-source again, this method reuses the already-populated
   * dataSourceRef from initializeDataSourceRef(). This eliminates redundant fetches.
   *
   * TYPICAL CALL FLOW:
   * 1. dataViews.get(id)
   *    → DataViewsService.create()
   *    → new DataView()
   *    → initializeDataSourceRef() [FETCHES data-source, populates dataSourceRef.name]
   * 2. dataViews.convertToDataset(dataView)
   *    → toDataset() [REUSES dataSourceRef.name, no fetch needed]
   *
   * FALLBACK BEHAVIOR:
   * If dataSourceRef is incomplete (missing name), falls back to fetching the data-source.
   * This handles edge cases where toDataset() might be called without initializeDataSourceRef().
   *
   * PERFORMANCE IMPACT:
   * - Before optimization: 2 fetches per index-pattern (initializeDataSourceRef + toDataset)
   * - After optimization: 1 fetch per index-pattern (initializeDataSourceRef only)
   * - With SavedObjectsClient cache: 1 network request total for same data-source ID
   *
   * @returns Dataset object with data source information
   */
  public async toDataset(): Promise<Dataset> {
    const defaultType = DEFAULT_DATA.SET_TYPES.INDEX_PATTERN;
    const dataSourceReference = this.dataSourceRef || (this as any).dataSource;

    let dataSource: DataSource | undefined;
    let datasetType = this.type || defaultType;

    if (dataSourceReference?.id) {
      // Extract dataset type from dataSourceRef.name if available
      if (dataSourceReference.name && dataSourceReference.name !== 'dataSource') {
        const extractedType = extractDatasetTypeFromUri(dataSourceReference.name);
        if (extractedType) {
          datasetType = extractedType;
        }
      }

      // Check if dataSourceRef is already fully populated (has name/title)
      // If so, reuse it. Otherwise, fetch to ensure we have complete data.
      const hasCompleteInfo = dataSourceReference.name && dataSourceReference.name !== 'dataSource';

      if (hasCompleteInfo) {
        // Reuse the already-populated dataSourceRef from initializeDataSourceRef()
        dataSource = {
          id: dataSourceReference.id,
          title: dataSourceReference.name || dataSourceReference.id,
          type: dataSourceReference.type || 'OpenSearch',
          version: dataSourceReference.version || '',
        };
      } else {
        // Fallback: fetch data-source if dataSourceRef is incomplete
        // This handles edge cases where toDataset() is called without initializeDataSourceRef()
        try {
          const dataSourceSavedObject = await this.savedObjectsClient.get(
            'data-source',
            dataSourceReference.id
          );
          const attributes = dataSourceSavedObject.attributes as any;

          dataSource = {
            id: dataSourceReference.id,
            title: attributes.title || dataSourceReference.id,
            type: attributes.dataSourceEngineType || 'OpenSearch',
            version: attributes.dataSourceVersion || '',
          };
        } catch (error) {
          // If fetch fails, create minimal version from what we have
          dataSource = {
            id: dataSourceReference.id,
            title: dataSourceReference.id,
            type: 'OpenSearch',
            version: '',
          };
        }
      }
    }

    return {
      id: this.id || '',
      title: this.title,
      type: datasetType,
      timeFieldName: this.timeFieldName,
      displayName: this.displayName,
      description: this.description,
      schemaMappings: this.schemaMappings,
      dataSource,
    };
  }
}

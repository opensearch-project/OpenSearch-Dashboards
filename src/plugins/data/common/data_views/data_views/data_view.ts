/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientCommon, Dataset, DataSource } from '../..';
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
    this.initializeDataSourceRef();
  }

  public async initializeDataSourceRef(): Promise<void> {
    if (!this.dataSourceRef?.id) return;
    const dataSourceSavedObject = await this.savedObjectsClient.get(
      this.dataSourceRef.type,
      this.dataSourceRef.id
    );
    const attributes = dataSourceSavedObject.attributes as any;
    this.dataSourceRef = {
      id: this.dataSourceRef.id,
      type: attributes.dataSourceEngineType || this.dataSourceRef.type,
      name: attributes.title || this.dataSourceRef.name || this.dataSourceRef.id,
    };
  }

  /**
   * Converts a DataView to a serializable Dataset object
   * Maps dataSourceRef and includes only essential properties for backward compatibility
   */
  public async toDataset(): Promise<Dataset> {
    const defaultType = DEFAULT_DATA.SET_TYPES.INDEX_PATTERN;
    const dataSourceReference = this.dataSourceRef || (this as any).dataSource;

    let dataSource: DataSource | undefined;
    let datasetType = this.type || defaultType;

    if (dataSourceReference?.id) {
      try {
        const dataSourceSavedObject = await this.savedObjectsClient.get(
          'data-source',
          dataSourceReference.id
        );
        const attributes = dataSourceSavedObject.attributes as any;

        if (dataSourceReference.name) {
          const extractedType = extractDatasetTypeFromUri(dataSourceReference.name);
          if (extractedType) {
            datasetType = extractedType;
          }
        }

        dataSource = {
          id: dataSourceReference.id,
          title: attributes.title || dataSourceReference.name || dataSourceReference.id,
          type: attributes.dataSourceEngineType || 'OpenSearch',
        };
      } catch (error) {
        // If we can't fetch the data source, create a minimal version
        dataSource = {
          id: dataSourceReference.id,
          title: dataSourceReference.name || dataSourceReference.id,
          type: dataSourceReference.type || 'OpenSearch',
        };
      }
    }

    return {
      id: this.id || '',
      title: this.title,
      type: datasetType,
      timeFieldName: this.timeFieldName,
      dataSource,
    };
  }
}

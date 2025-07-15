/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientCommon } from '../..';
import { IndexPattern } from '../../index_patterns/index_patterns/index_pattern';
import { IDataView, DataViewSpec } from '../types';
import { FieldFormatsStartCommon } from '../../field_formats';

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

    if (this.dataSourceRef?.id) {
      this.initializeDataSourceRef();
    }
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
      type: this.dataSourceRef.type,
      name: attributes.title || this.dataSourceRef.name || this.dataSourceRef.id,
    };
  }
}

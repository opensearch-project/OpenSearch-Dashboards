/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { HttpSetup } from '../../../../core/public';
import { DatasetCreationManager, DatasetCreationConfig } from './creation';
import { DatasetListManager, DatasetListConfig } from './list';
import { FieldFormatEditors } from './field_format_editors';
import { EnvironmentService } from './environment';

import {
  BytesFormatEditor,
  ColorFormatEditor,
  DateFormatEditor,
  DateNanosFormatEditor,
  DurationFormatEditor,
  NumberFormatEditor,
  PercentFormatEditor,
  StaticLookupFormatEditor,
  StringFormatEditor,
  TruncateFormatEditor,
  UrlFormatEditor,
} from '../components/field_editor/components/field_format_editor';
import { DatasetTableColumnService } from './column_service';

interface SetupDependencies {
  httpClient: HttpSetup;
}

/**
 * Index patterns management service
 *
 * @internal
 */
export class DatasetManagementService {
  datasetCreationManager: DatasetCreationManager;
  datasetListConfig: DatasetListManager;
  fieldFormatEditors: FieldFormatEditors;
  environmentService: EnvironmentService;
  columnService: DatasetTableColumnService;

  constructor() {
    this.datasetCreationManager = new DatasetCreationManager();
    this.datasetListConfig = new DatasetListManager();
    this.fieldFormatEditors = new FieldFormatEditors();
    this.environmentService = new EnvironmentService();
    this.columnService = new DatasetTableColumnService();
  }

  public setup({ httpClient }: SetupDependencies) {
    const creationManagerSetup = this.datasetCreationManager.setup(httpClient);
    creationManagerSetup.addCreationConfig(DatasetCreationConfig);

    const datasetListConfigSetup = this.datasetListConfig.setup();
    datasetListConfigSetup.addListConfig(DatasetListConfig);

    const defaultFieldFormatEditors = [
      BytesFormatEditor,
      ColorFormatEditor,
      DateFormatEditor,
      DateNanosFormatEditor,
      DurationFormatEditor,
      NumberFormatEditor,
      PercentFormatEditor,
      StaticLookupFormatEditor,
      StringFormatEditor,
      TruncateFormatEditor,
      UrlFormatEditor,
    ];

    const fieldFormatEditorsSetup = this.fieldFormatEditors.setup(defaultFieldFormatEditors);

    return {
      creation: creationManagerSetup,
      list: datasetListConfigSetup,
      fieldFormatEditors: fieldFormatEditorsSetup,
      environment: this.environmentService.setup(),
      columns: this.columnService.setup(),
    };
  }

  public start() {
    return {
      creation: this.datasetCreationManager.start(),
      list: this.datasetListConfig.start(),
      fieldFormatEditors: this.fieldFormatEditors.start(),
      columns: this.columnService.start(),
    };
  }

  public stop() {
    // nothing to do here yet.
  }
}

/** @internal */
export type DatasetManagementServiceSetup = ReturnType<DatasetManagementService['setup']>;
export type DatasetManagementServiceStart = ReturnType<DatasetManagementService['start']>;

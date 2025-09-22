/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
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

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceManagementPluginSetup } from '../../data_source_management/public';
import { DataSourcePluginSetup } from '../../data_source/public';
import { NavigationPublicPluginStart } from '../../navigation/public';

export interface DataImporterPluginSetupDeps {
  dataSourceManagement?: DataSourceManagementPluginSetup;
  dataSource?: DataSourcePluginSetup;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataImporterPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataImporterPluginStart {}

export interface DataImporterPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}

export interface ImportResponse {
  message: {
    total: number;
    message: string;
    failedRows: number[];
  };
  success: boolean;
}

export interface PreviewResponse {
  predictedMapping: Record<string, any>;
  documents: Array<Record<string, any>>;
  existingMapping?: Record<string, any>;
}

export interface CatIndicesResponse {
  indices: string[];
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NavigationPublicPluginStart } from '../../navigation/public';

// Minimal interface for data source management to avoid importing the entire bundle
export interface DataSourceManagement {
  ui: {
    DataSourceSelector: React.ComponentType<any>;
  };
}

export interface DataImporterPluginSetupDeps {
  dataSourceManagement?: DataSourceManagement;
}

import { PublicConfigSchema } from '../config';

export interface DataImporterPluginSetup {
  config: PublicConfigSchema;
}
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

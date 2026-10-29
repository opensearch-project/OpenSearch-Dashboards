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

import { PublicConfigSchema } from '../config';

export interface DataImporterPluginSetup {
  config: PublicConfigSchema;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataImporterPluginStart {}

export interface DataImporterPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}

/**
 * One bucket of import failures sharing a cause (mirrors the server's IngestErrorSummary)
 */
export interface ImportErrorSummary {
  type: string;
  reason: string;
  count: number;
  sampleRows: number[];
}

export interface ImportResponse {
  message: {
    total: number;
    message: string;
    /**
     * Full list of failed row numbers
     */
    failedRows: number[];
    /**
     * Top failure causes, most frequent first; prefer this over failedRows for display
     */
    errorSummary?: ImportErrorSummary[];
  };
  /**
   * True only when every row was indexed
   */
  success: boolean;
  /**
   * True when some rows were indexed and some failed
   */
  partial?: boolean;
  /**
   * Present only when an import identifier (alias) was requested: whether the filtered alias was
   * created. False means indexed rows are not reachable through the alias.
   */
  aliasCreated?: boolean;
  /**
   * Present when the alias could not be created: a user-facing explanation (with a call to action
   * for recognized permission denials). The UI must surface it as a failure.
   */
  aliasError?: string;
}

export interface PreviewResponse {
  predictedMapping: Record<string, any>;
  documents: Array<Record<string, any>>;
  existingMapping?: Record<string, any>;
}

export interface CatIndicesResponse {
  indices: string[];
}

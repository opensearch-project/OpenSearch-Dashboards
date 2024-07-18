/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from '../../../core/public';
import { WorkspaceClient } from './workspace_client';
import { DataSourceManagementPluginSetup } from '../../../plugins/data_source_management/public';

export type Services = CoreStart & {
  workspaceClient: WorkspaceClient;
  dataSourceManagement?: DataSourceManagementPluginSetup;
};

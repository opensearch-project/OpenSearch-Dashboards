/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from '../../../core/public';
import { WorkspaceClient } from './workspace_client';
import { DataSourceManagementPluginSetup } from '../../../plugins/data_source_management/public';
import { NavigationPublicPluginStart } from '../../../plugins/navigation/public';

export type Services = CoreStart & {
  workspaceClient: WorkspaceClient;
  dataSourceManagement?: DataSourceManagementPluginSetup;
  navigationUI?: NavigationPublicPluginStart['ui'];
};

export interface WorkspaceUseCaseFeature {
  id: string;
  title?: string;
}

export interface WorkspaceUseCase {
  id: string;
  title: string;
  description: string;
  features: WorkspaceUseCaseFeature[];
  systematic?: boolean;
  order?: number;
}

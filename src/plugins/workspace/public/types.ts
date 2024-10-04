/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from '../../../core/public';
import { WorkspaceClient } from './workspace_client';
import { DataSourceManagementPluginSetup } from '../../../plugins/data_source_management/public';
import { NavigationPublicPluginStart } from '../../../plugins/navigation/public';
import { ContentManagementPluginStart } from '../../../plugins/content_management/public';
import { DataSourceAttributes } from '../../../plugins/data_source/common/data_sources';
import type { AddCollaboratorsModal } from './components/add_collaborators_modal';
import { WorkspaceCollaboratorTypesService } from './services';

export type Services = CoreStart & {
  workspaceClient: WorkspaceClient;
  dataSourceManagement?: DataSourceManagementPluginSetup;
  navigationUI?: NavigationPublicPluginStart['ui'];
  contentManagement?: ContentManagementPluginStart;
  collaboratorTypes: WorkspaceCollaboratorTypesService;
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
  icon?: string;
}

export interface DataSourceAttributesWithWorkspaces extends Omit<DataSourceAttributes, 'endpoint'> {
  workspaces?: string[];
}

export type WorkspaceCollaboratorPermissionType = 'user' | 'group';
export type WorkspaceCollaboratorAccessLevel = 'readOnly' | 'readAndWrite' | 'admin';

export interface WorkspaceCollaborator {
  collaboratorId: string;
  permissionType: WorkspaceCollaboratorPermissionType;
  accessLevel: WorkspaceCollaboratorAccessLevel;
}

export interface WorkspacePluginSetup {
  collaboratorTypes: WorkspaceCollaboratorTypesService;
  ui: {
    AddCollaboratorsModal: typeof AddCollaboratorsModal;
  };
}

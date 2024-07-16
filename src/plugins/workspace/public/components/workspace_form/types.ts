/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ApplicationStart,
  PublicAppInfo,
  SavedObjectsStart,
} from '../../../../../core/public';
import type { WorkspacePermissionMode } from '../../../common/constants';
import type { WorkspaceOperationType, WorkspacePermissionItemType } from './constants';
import { DataSource } from '../../../common/types';
import { DataSourceManagementPluginSetup } from '../../../../../plugins/data_source_management/public';

export interface WorkspaceUserPermissionSetting {
  id: number;
  type: WorkspacePermissionItemType.User;
  userId: string;
  modes: WorkspacePermissionMode[];
}

export interface WorkspaceUserGroupPermissionSetting {
  id: number;
  type: WorkspacePermissionItemType.Group;
  group: string;
  modes: WorkspacePermissionMode[];
}

export type WorkspacePermissionSetting =
  | WorkspaceUserPermissionSetting
  | WorkspaceUserGroupPermissionSetting;

export interface WorkspaceFormSubmitData {
  name: string;
  description?: string;
  features?: string[];
  color?: string;
  permissionSettings?: WorkspacePermissionSetting[];
  selectedDataSources?: DataSource[];
}

export interface WorkspaceFormData extends WorkspaceFormSubmitData {
  id: string;
  reserved?: boolean;
}

export enum WorkspaceFormErrorCode {
  InvalidWorkspaceName,
  WorkspaceNameMissing,
  UseCaseMissing,
  InvalidPermissionType,
  InvalidPermissionModes,
  PermissionUserIdMissing,
  PermissionUserGroupMissing,
  DuplicateUserIdPermissionSetting,
  DuplicateUserGroupPermissionSetting,
  PermissionSettingOwnerMissing,
  InvalidDataSource,
  DuplicateDataSource,
}

export interface WorkspaceFormError {
  message: string;
  code: WorkspaceFormErrorCode;
}

export type WorkspaceFormErrors = {
  [key in keyof Omit<
    WorkspaceFormData,
    'permissionSettings' | 'description' | 'selectedDataSources'
  >]?: WorkspaceFormError;
} & {
  permissionSettings?: {
    overall?: WorkspaceFormError;
    fields?: { [key: number]: WorkspaceFormError };
  };
  selectedDataSources?: { [key: number]: WorkspaceFormError };
};

export interface WorkspaceFormProps {
  application: ApplicationStart;
  savedObjects: SavedObjectsStart;
  onSubmit?: (formData: WorkspaceFormSubmitData) => void;
  defaultValues?: WorkspaceFormData;
  operationType: WorkspaceOperationType;
  workspaceConfigurableApps?: PublicAppInfo[];
  permissionEnabled?: boolean;
  dataSourceManagement?: DataSourceManagementPluginSetup;
}

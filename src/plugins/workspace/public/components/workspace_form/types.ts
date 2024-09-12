/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ApplicationStart, SavedObjectsStart } from '../../../../../core/public';
import type { WorkspacePermissionMode } from '../../../common/constants';
import type { WorkspaceOperationType, WorkspacePermissionItemType } from './constants';
import { DataSourceConnection } from '../../../common/types';
import { DataSourceManagementPluginSetup } from '../../../../../plugins/data_source_management/public';
import { WorkspaceUseCase } from '../../types';

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
  features: string[];
  color?: string;
  permissionSettings?: WorkspacePermissionSetting[];
  selectedDataSourceConnections?: DataSourceConnection[];
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
  InvalidColor,
}

export interface WorkspaceFormError {
  message: string;
  code: WorkspaceFormErrorCode;
}

export type WorkspaceFormErrors = {
  [key in keyof Omit<
    WorkspaceFormSubmitData,
    'permissionSettings' | 'description' | 'selectedDataSourceConnections'
  >]?: WorkspaceFormError;
} & {
  permissionSettings?: {
    overall?: WorkspaceFormError;
    fields?: { [key: number]: WorkspaceFormError };
  };
  selectedDataSourceConnections?: { [key: number]: WorkspaceFormError };
};

export interface WorkspaceFormProps {
  application: ApplicationStart;
  savedObjects: SavedObjectsStart;
  onSubmit?: (formData: WorkspaceFormSubmitData) => void;
  defaultValues?: Partial<WorkspaceFormSubmitData>;
  operationType: WorkspaceOperationType;
  permissionEnabled?: boolean;
  dataSourceManagement?: DataSourceManagementPluginSetup;
  availableUseCases: WorkspaceUseCase[];
}

export interface AvailableUseCaseItem
  extends Pick<WorkspaceUseCase, 'id' | 'title' | 'features' | 'description' | 'systematic'> {
  disabled?: boolean;
}

export interface WorkspaceFormDataState
  extends Omit<WorkspaceFormSubmitData, 'name' | 'permissionSettings'> {
  name: string;
  useCase: string | undefined;
  selectedDataSourceConnections: DataSourceConnection[];
  permissionSettings: Array<
    Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>
  >;
}

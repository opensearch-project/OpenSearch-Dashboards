/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  AppMountParameters,
  ApplicationStart,
  SavedObjectsStart,
  WorkspacePermissionMode,
} from '../../../../../core/public';
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
  shouldNavigate?: boolean;
}

export enum WorkspaceFormErrorCode {
  InvalidWorkspaceName,
  WorkspaceNameMissing,
  UseCaseMissing,
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
  onSubmit?: (
    formData: WorkspaceFormSubmitData,
    refresh?: boolean
  ) => Promise<{ result: boolean; success: true } | undefined>;
  defaultValues?: Partial<WorkspaceFormSubmitData>;
  operationType: WorkspaceOperationType;
  permissionEnabled?: boolean;
  dataSourceManagement?: DataSourceManagementPluginSetup;
  availableUseCases: WorkspaceUseCase[];
  onAppLeave: AppMountParameters['onAppLeave'];
}

export interface AvailableUseCaseItem
  extends Pick<
    WorkspaceUseCase,
    'id' | 'title' | 'features' | 'description' | 'systematic' | 'icon'
  > {
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

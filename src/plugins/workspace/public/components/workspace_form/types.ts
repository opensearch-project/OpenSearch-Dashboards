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
import { WorkspaceUseCase } from '../../types';

export type WorkspacePermissionSetting =
  | {
      id: number;
      type: WorkspacePermissionItemType.User;
      userId: string;
      modes: WorkspacePermissionMode[];
    }
  | {
      id: number;
      type: WorkspacePermissionItemType.Group;
      group: string;
      modes: WorkspacePermissionMode[];
    };

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

export type WorkspaceFormErrors = {
  [key in keyof Omit<WorkspaceFormData, 'permissionSettings' | 'selectedDataSources'>]?: string;
} & {
  permissionSettings?: { [key: number]: string };
  selectedDataSources?: { [key: number]: string };
};

export interface WorkspaceFormProps {
  application: ApplicationStart;
  savedObjects: SavedObjectsStart;
  onSubmit?: (formData: WorkspaceFormSubmitData) => void;
  defaultValues?: WorkspaceFormData;
  operationType?: WorkspaceOperationType;
  workspaceConfigurableApps?: PublicAppInfo[];
  permissionEnabled?: boolean;
  permissionLastAdminItemDeletable?: boolean;
  availableUseCases?: WorkspaceUseCase[];
}

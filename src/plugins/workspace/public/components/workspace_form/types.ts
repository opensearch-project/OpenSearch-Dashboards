/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ApplicationStart, PublicAppInfo } from '../../../../../core/public';
import type { WorkspacePermissionMode } from '../../../common/constants';
import type { WorkspaceOperationType, WorkspacePermissionItemType } from './constants';

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
}

export interface WorkspaceFormData extends WorkspaceFormSubmitData {
  id: string;
  reserved?: boolean;
}

export interface WorkspaceFeature {
  id: string;
  name: string;
}

export interface WorkspaceFeatureGroup {
  name: string;
  features: WorkspaceFeature[];
}

export type WorkspaceFormErrors = {
  [key in keyof Omit<WorkspaceFormData, 'permissionSettings'>]?: string;
} & {
  permissionSettings?: { [key: number]: string };
};

export interface WorkspaceFormProps {
  application: ApplicationStart;
  onSubmit?: (formData: WorkspaceFormSubmitData) => void;
  defaultValues?: WorkspaceFormData;
  operationType?: WorkspaceOperationType;
  workspaceConfigurableApps?: PublicAppInfo[];
  permissionEnabled?: boolean;
  permissionLastAdminItemDeletable?: boolean;
}

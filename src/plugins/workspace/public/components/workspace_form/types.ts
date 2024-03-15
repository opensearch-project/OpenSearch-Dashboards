/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WorkspacePermissionItemType, WorkspaceOperationType } from './constants';
import type { WorkspacePermissionMode } from '../../../common/constants';
import type { App, ApplicationStart } from '../../../../../core/public';

export type WorkspacePermissionSetting =
  | { type: WorkspacePermissionItemType.User; userId: string; modes: WorkspacePermissionMode[] }
  | { type: WorkspacePermissionItemType.Group; group: string; modes: WorkspacePermissionMode[] };

export interface WorkspaceFormSubmitData {
  name: string;
  description?: string;
  features?: string[];
  color?: string;
  icon?: string;
  defaultVISTheme?: string;
  permissions: WorkspacePermissionSetting[];
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

export type WorkspaceFormErrors = Omit<
  { [key in keyof WorkspaceFormData]?: string },
  'permissions'
> & {
  permissions?: string[];
};

export interface WorkspaceFormProps {
  application: ApplicationStart;
  onSubmit?: (formData: WorkspaceFormSubmitData) => void;
  defaultValues?: WorkspaceFormData;
  operationType?: WorkspaceOperationType;
  permissionEnabled?: boolean;
  permissionLastAdminItemDeletable?: boolean;
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WorkspaceOperationType } from './constants';
import type { ApplicationStart } from '../../../../../core/public';

export interface WorkspaceFormSubmitData {
  name: string;
  description?: string;
  features?: string[];
  color?: string;
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

export type WorkspaceFormErrors = { [key in keyof WorkspaceFormData]?: string };

export interface WorkspaceFormProps {
  application: ApplicationStart;
  onSubmit?: (formData: WorkspaceFormSubmitData) => void;
  defaultValues?: WorkspaceFormData;
  operationType?: WorkspaceOperationType;
}

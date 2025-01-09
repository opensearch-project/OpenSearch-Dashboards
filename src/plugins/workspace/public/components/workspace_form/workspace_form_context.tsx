/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, FormEventHandler, ReactNode } from 'react';
import { EuiColorPickerOutput } from '@elastic/eui/src/components/color_picker/color_picker';
import { DataSourceConnection } from '../../../common/types';
import { WorkspaceFormProps, WorkspaceFormErrors } from './types';
import { AppMountParameters, PublicAppInfo } from '../../../../../core/public';
import { useWorkspaceForm } from './use_workspace_form';
import { WorkspaceFormDataState } from '../workspace_form';
import { WorkspacePermissionSetting } from './types';
import { WorkspacePrivacyItemType } from './constants';

interface WorkspaceFormContextProps {
  formId: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  setDescription: React.Dispatch<React.SetStateAction<string | undefined>>;
  formData: WorkspaceFormDataState;
  isEditing: boolean;
  formErrors: WorkspaceFormErrors;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  applications: PublicAppInfo[];
  numberOfErrors: number;
  numberOfChanges: number;
  handleResetForm: () => void;
  handleFormSubmit: FormEventHandler;
  handleColorChange: (text: string, output: EuiColorPickerOutput) => void;
  handleUseCaseChange: (newUseCase: string) => void;
  setPermissionSettings: React.Dispatch<
    React.SetStateAction<WorkspaceFormDataState['permissionSettings']>
  >;
  setSelectedDataSourceConnections: React.Dispatch<React.SetStateAction<DataSourceConnection[]>>;
  onAppLeave: AppMountParameters['onAppLeave'];
  handleSubmitPermissionSettings: (
    permissionSettings: WorkspacePermissionSetting[]
  ) => Promise<void>;
  privacyType: WorkspacePrivacyItemType;
  setPrivacyType: (newPrivacyType: WorkspacePrivacyItemType) => void;
}

const initialContextValue: WorkspaceFormContextProps = {} as WorkspaceFormContextProps;
export const WorkspaceFormContext = createContext<WorkspaceFormContextProps>(initialContextValue);
interface ContextProps extends WorkspaceFormProps {
  children: ReactNode;
}

export const WorkspaceFormProvider = ({
  children,
  application,
  defaultValues,
  operationType,
  onSubmit,
  permissionEnabled,
  savedObjects,
  availableUseCases,
  onAppLeave,
}: ContextProps) => {
  const workspaceFormContextValue = useWorkspaceForm({
    application,
    defaultValues,
    operationType,
    onSubmit,
    permissionEnabled,
    savedObjects,
    availableUseCases,
    onAppLeave,
  });

  return (
    <WorkspaceFormContext.Provider value={workspaceFormContextValue}>
      {children}
    </WorkspaceFormContext.Provider>
  );
};

export const useWorkspaceFormContext = () => useContext(WorkspaceFormContext);

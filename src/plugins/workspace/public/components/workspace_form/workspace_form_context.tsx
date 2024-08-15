/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, FormEventHandler, ReactNode } from 'react';
import { EuiColorPickerOutput } from '@elastic/eui/src/components/color_picker/color_picker';
import { DataSource } from '../../../common/types';
import { WorkspaceFormProps, WorkspaceFormErrors, WorkspacePermissionSetting } from './types';
import { PublicAppInfo } from '../../../../../core/public';
import { useWorkspaceForm } from './use_workspace_form';

interface WorkspaceFormContextProps {
  formId: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  setDescription: React.Dispatch<React.SetStateAction<string | undefined>>;
  formData: any;
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
    React.SetStateAction<
      Array<Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>>
    >
  >;
  setSelectedDataSources: React.Dispatch<React.SetStateAction<DataSource[]>>;
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
}: ContextProps) => {
  const workspaceFormContextValue = useWorkspaceForm({
    application,
    defaultValues,
    operationType,
    onSubmit,
    permissionEnabled,
    savedObjects,
    availableUseCases,
  });

  return (
    <WorkspaceFormContext.Provider value={workspaceFormContextValue}>
      {children}
    </WorkspaceFormContext.Provider>
  );
};

export const useWorkspaceFormContext = () => useContext(WorkspaceFormContext);

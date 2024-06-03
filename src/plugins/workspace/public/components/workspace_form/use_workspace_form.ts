/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, FormEventHandler, useRef, useMemo, useEffect } from 'react';
import { htmlIdGenerator, EuiFieldTextProps, EuiColorPickerProps } from '@elastic/eui';
import { useApplications } from '../../hooks';
import {
  getUseCaseFeatureConfig,
  getUseCaseFromFeatureConfig,
  isUseCaseFeatureConfig,
} from '../../utils';

import { WorkspaceFormTabs } from './constants';
import { WorkspaceFormProps, WorkspaceFormErrors, WorkspacePermissionSetting } from './types';
import { appendDefaultFeatureIds, getNumberOfErrors, validateWorkspaceForm } from './utils';

const workspaceHtmlIdGenerator = htmlIdGenerator();

const isNotNull = <T extends unknown>(value: T | null): value is T => !!value;

export const useWorkspaceForm = ({ application, defaultValues, onSubmit }: WorkspaceFormProps) => {
  const applications = useApplications(application);
  const [name, setName] = useState(defaultValues?.name);
  const [description, setDescription] = useState(defaultValues?.description);
  const [color, setColor] = useState(defaultValues?.color);

  const [selectedTab, setSelectedTab] = useState(WorkspaceFormTabs.UsersAndPermissions);
  const [featureConfigs, setFeatureConfigs] = useState(
    appendDefaultFeatureIds(defaultValues?.features ?? [])
  );
  const selectedUseCases = useMemo(
    () => featureConfigs.map(getUseCaseFromFeatureConfig).filter(isNotNull),
    [featureConfigs]
  );
  const [permissionSettings, setPermissionSettings] = useState<
    Array<Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>>
  >(
    defaultValues?.permissionSettings && defaultValues.permissionSettings.length > 0
      ? defaultValues.permissionSettings
      : []
  );

  const [formErrors, setFormErrors] = useState<WorkspaceFormErrors>({});
  const numberOfErrors = useMemo(() => getNumberOfErrors(formErrors), [formErrors]);
  const formIdRef = useRef<string>();
  const getFormData = () => ({
    name,
    description,
    features: featureConfigs,
    useCases: selectedUseCases,
    color,
    permissionSettings,
  });
  const getFormDataRef = useRef(getFormData);
  getFormDataRef.current = getFormData;

  if (!formIdRef.current) {
    formIdRef.current = workspaceHtmlIdGenerator();
  }

  const handleUseCasesChange = useCallback(
    (newUseCases: string[]) => {
      setFeatureConfigs((previousFeatureConfigs) => {
        return [
          ...previousFeatureConfigs.filter(
            (featureConfig) => !isUseCaseFeatureConfig(featureConfig)
          ),
          ...newUseCases.map((useCaseItem) => getUseCaseFeatureConfig(useCaseItem)),
        ];
      });
    },
    [setFeatureConfigs]
  );

  const handleFormSubmit = useCallback<FormEventHandler>(
    (e) => {
      e.preventDefault();
      const formData = getFormDataRef.current();
      const currentFormErrors: WorkspaceFormErrors = validateWorkspaceForm(formData);
      setFormErrors(currentFormErrors);
      if (getNumberOfErrors(currentFormErrors) > 0) {
        return;
      }

      onSubmit?.({
        name: formData.name!,
        description: formData.description,
        features: formData.features,
        color: formData.color,
        permissionSettings: formData.permissionSettings as WorkspacePermissionSetting[],
      });
    },
    [onSubmit]
  );

  const handleNameInputChange = useCallback<Required<EuiFieldTextProps>['onChange']>((e) => {
    setName(e.target.value);
  }, []);

  const handleDescriptionInputChange = useCallback<Required<EuiFieldTextProps>['onChange']>((e) => {
    setDescription(e.target.value);
  }, []);

  const handleColorChange = useCallback<Required<EuiColorPickerProps>['onChange']>((text) => {
    setColor(text);
  }, []);

  const handleTabPermissionClick = useCallback(() => {
    setSelectedTab(WorkspaceFormTabs.UsersAndPermissions);
  }, []);

  return {
    formId: formIdRef.current,
    formData: getFormData(),
    formErrors,
    selectedTab,
    applications,
    numberOfErrors,
    handleFormSubmit,
    handleColorChange,
    handleUseCasesChange,
    handleNameInputChange,
    setPermissionSettings,
    handleTabPermissionClick,
    handleDescriptionInputChange,
  };
};

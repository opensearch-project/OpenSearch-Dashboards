/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, FormEventHandler, useRef, useMemo } from 'react';
import { htmlIdGenerator, EuiColorPickerProps } from '@elastic/eui';

import { useApplications } from '../../hooks';
import { getFirstUseCaseOfFeatureConfigs, isUseCaseFeatureConfig } from '../../utils';
import { DataSourceConnection } from '../../../common/types';
import { getUseCaseFeatureConfig } from '../../../common/utils';
import {
  WorkspaceFormProps,
  WorkspaceFormErrors,
  WorkspacePermissionSetting,
  WorkspaceFormDataState,
} from './types';
import { getNumberOfChanges, getNumberOfErrors, validateWorkspaceForm } from './utils';
import { WorkspacePermissionItemType } from './constants';

const workspaceHtmlIdGenerator = htmlIdGenerator();

export const useWorkspaceForm = ({
  application,
  defaultValues,
  onSubmit,
  permissionEnabled,
  onAppLeave,
}: WorkspaceFormProps) => {
  const applications = useApplications(application);
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [description, setDescription] = useState(defaultValues?.description);
  const [color, setColor] = useState(defaultValues?.color);
  const defaultValuesRef = useRef(defaultValues);
  const [isEditing, setIsEditing] = useState(false);

  const [featureConfigs, setFeatureConfigs] = useState<string[]>(defaultValues?.features ?? []);
  const selectedUseCase = useMemo(() => getFirstUseCaseOfFeatureConfigs(featureConfigs), [
    featureConfigs,
  ]);
  const [permissionSettings, setPermissionSettings] = useState<
    WorkspaceFormDataState['permissionSettings']
  >(defaultValues?.permissionSettings ?? []);

  const [selectedDataSourceConnections, setSelectedDataSourceConnections] = useState<
    DataSourceConnection[]
  >(
    defaultValues?.selectedDataSourceConnections &&
      defaultValues.selectedDataSourceConnections.length > 0
      ? defaultValues.selectedDataSourceConnections
      : []
  );

  const [formErrors, setFormErrors] = useState<WorkspaceFormErrors>({});
  const numberOfErrors = useMemo(() => getNumberOfErrors(formErrors), [formErrors]);
  const formIdRef = useRef<string>();
  const getFormData = (): WorkspaceFormDataState => ({
    name,
    description,
    features: featureConfigs,
    useCase: selectedUseCase,
    color,
    permissionSettings,
    selectedDataSourceConnections,
  });
  const getFormDataRef = useRef(getFormData);
  getFormDataRef.current = getFormData;
  const formData = getFormData();
  const numberOfChanges = defaultValuesRef.current
    ? getNumberOfChanges(formData, defaultValuesRef.current)
    : 0;

  if (!formIdRef.current) {
    formIdRef.current = workspaceHtmlIdGenerator();
  }

  const handleUseCaseChange = useCallback(
    (newUseCase: string) => {
      setFeatureConfigs((previousFeatureConfigs) => {
        return [
          ...previousFeatureConfigs.filter(
            (featureConfig) => !isUseCaseFeatureConfig(featureConfig)
          ),
          getUseCaseFeatureConfig(newUseCase),
        ];
      });
    },
    [setFeatureConfigs]
  );

  const getSubmitFormData = (submitFormData: WorkspaceFormDataState) => {
    return {
      name: submitFormData.name!,
      description: submitFormData.description,
      color: submitFormData.color || '#FFFFFF',
      features: submitFormData.features,
      permissionSettings: submitFormData.permissionSettings as WorkspacePermissionSetting[],
      selectedDataSourceConnections: submitFormData.selectedDataSourceConnections,
    };
  };

  const handleFormSubmit = useCallback<FormEventHandler>(
    async (e) => {
      e.preventDefault();
      const currentFormData = getFormDataRef.current();
      currentFormData.permissionSettings = currentFormData.permissionSettings.filter(
        (item) =>
          (item.type === WorkspacePermissionItemType.User && !!item.userId) ||
          (item.type === WorkspacePermissionItemType.Group && !!item.group)
      );
      const currentFormErrors: WorkspaceFormErrors = validateWorkspaceForm(
        currentFormData,
        !!permissionEnabled
      );
      setFormErrors(currentFormErrors);
      if (getNumberOfErrors(currentFormErrors) > 0) {
        return;
      }

      const submitFormData = getSubmitFormData(currentFormData);
      const result = await onSubmit?.(submitFormData);
      if (result?.success) {
        defaultValuesRef.current = submitFormData;
        setIsEditing(false);
      }
    },
    [onSubmit, permissionEnabled]
  );

  const handleSubmitPermissionSettings = async (settings: WorkspacePermissionSetting[]) => {
    const currentFormData = getFormDataRef.current();
    const result = await onSubmit?.({
      ...getSubmitFormData(currentFormData),
      permissionSettings: settings,
    });
    if (result) {
      setPermissionSettings(settings);
    }
  };

  const handleColorChange = useCallback<Required<EuiColorPickerProps>['onChange']>((text) => {
    setColor(text);
  }, []);

  const handleResetForm = useCallback(() => {
    const resetValues = defaultValuesRef.current;
    setName(resetValues?.name ?? '');
    setDescription(resetValues?.description ?? '');
    setColor(resetValues?.color);
    setFeatureConfigs(resetValues?.features ?? []);
    setFormErrors({});
    setIsEditing(false);
  }, []);

  return {
    formId: formIdRef.current,
    formData,
    isEditing,
    formErrors,
    setIsEditing,
    applications,
    numberOfErrors,
    numberOfChanges,
    handleResetForm,
    setName,
    setDescription,
    handleFormSubmit,
    handleColorChange,
    handleUseCaseChange,
    setPermissionSettings,
    setSelectedDataSourceConnections,
    onAppLeave,
    handleSubmitPermissionSettings,
  };
};

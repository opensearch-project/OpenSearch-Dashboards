/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, FormEventHandler, useRef, useMemo } from 'react';
import {
  htmlIdGenerator,
  EuiFieldTextProps,
  EuiTextAreaProps,
  EuiColorPickerProps,
} from '@elastic/eui';

import { useApplications } from '../../hooks';
import {
  getUseCaseFeatureConfig,
  getUseCaseFromFeatureConfig,
  isUseCaseFeatureConfig,
} from '../../utils';
import { DataSource } from '../../../common/types';
import { WorkspaceFormProps, WorkspaceFormErrors, WorkspacePermissionSetting } from './types';
import {
  appendDefaultFeatureIds,
  generatePermissionSettingsState,
  getNumberOfChanges,
  getNumberOfErrors,
  validateWorkspaceForm,
} from './utils';
import { WorkspacePermissionItemType } from './constants';

const workspaceHtmlIdGenerator = htmlIdGenerator();

const isNotNull = <T extends unknown>(value: T | null): value is T => !!value;

export const useWorkspaceForm = ({
  application,
  defaultValues,
  operationType,
  onSubmit,
  permissionEnabled,
}: WorkspaceFormProps) => {
  const applications = useApplications(application);
  const [name, setName] = useState(defaultValues?.name);
  const [description, setDescription] = useState(defaultValues?.description);
  const [color, setColor] = useState(defaultValues?.color);
  const defaultValuesRef = useRef(defaultValues);
  const initialPermissionSettingsRef = useRef(
    generatePermissionSettingsState(operationType, defaultValues?.permissionSettings)
  );

  const [featureConfigs, setFeatureConfigs] = useState(
    appendDefaultFeatureIds(defaultValues?.features ?? [])
  );
  const selectedUseCases = useMemo(
    () => featureConfigs.map(getUseCaseFromFeatureConfig).filter(isNotNull),
    [featureConfigs]
  );
  const [permissionSettings, setPermissionSettings] = useState<
    Array<Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>>
  >(initialPermissionSettingsRef.current);

  const [selectedDataSources, setSelectedDataSources] = useState<DataSource[]>(
    defaultValues?.selectedDataSources && defaultValues.selectedDataSources.length > 0
      ? defaultValues.selectedDataSources
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
    selectedDataSources,
  });
  const getFormDataRef = useRef(getFormData);
  getFormDataRef.current = getFormData;
  const formData = getFormData();
  const numberOfChanges = defaultValuesRef.current
    ? getNumberOfChanges(formData, {
        ...defaultValuesRef.current,
        // The user form will insert some empty permission rows, should ignore these rows not treated as user new added.
        permissionSettings: initialPermissionSettingsRef.current,
      })
    : 0;

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

      onSubmit?.({
        name: currentFormData.name!,
        description: currentFormData.description,
        color: currentFormData.color,
        features: currentFormData.features,
        permissionSettings: currentFormData.permissionSettings as WorkspacePermissionSetting[],
        selectedDataSources: currentFormData.selectedDataSources,
      });
    },
    [onSubmit, permissionEnabled]
  );

  const handleNameInputChange = useCallback<Required<EuiFieldTextProps>['onChange']>((e) => {
    setName(e.target.value);
  }, []);

  const handleDescriptionChange = useCallback<Required<EuiTextAreaProps>['onChange']>((e) => {
    setDescription(e.target.value);
  }, []);

  const handleColorChange = useCallback<Required<EuiColorPickerProps>['onChange']>((text) => {
    setColor(text);
  }, []);

  return {
    formId: formIdRef.current,
    formData,
    formErrors,
    applications,
    numberOfErrors,
    numberOfChanges,
    handleFormSubmit,
    handleColorChange,
    handleUseCasesChange,
    handleNameInputChange,
    setPermissionSettings,
    setSelectedDataSources,
    handleDescriptionChange,
  };
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, FormEventHandler, useRef, useMemo, useEffect } from 'react';
import { htmlIdGenerator, EuiFieldTextProps, EuiColorPickerProps } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useApplications } from '../../hooks';
import { featureMatchesConfig } from '../../utils';

import { WorkspacePermissionItemType, WorkspaceFormTabs } from './constants';
import { WorkspacePermissionSetting, WorkspaceFormProps, WorkspaceFormErrors } from './types';
import {
  appendDefaultFeatureIds,
  getNumberOfErrors,
  isUserOrGroupPermissionSettingDuplicated,
  isValidNameOrDescription,
  isValidWorkspacePermissionSetting,
} from './utils';

const workspaceHtmlIdGenerator = htmlIdGenerator();

export const useWorkspaceForm = ({ application, defaultValues, onSubmit }: WorkspaceFormProps) => {
  const applications = useApplications(application);
  const [name, setName] = useState(defaultValues?.name);
  const [description, setDescription] = useState(defaultValues?.description);
  const [color, setColor] = useState(defaultValues?.color);

  const [selectedTab, setSelectedTab] = useState(WorkspaceFormTabs.FeatureVisibility);
  const [numberOfErrors, setNumberOfErrors] = useState(0);
  // The matched feature id list based on original feature config,
  // the feature category will be expanded to list of feature ids
  const defaultFeatures = useMemo(() => {
    // The original feature list, may contain feature id and category wildcard like @management, etc.
    const defaultOriginalFeatures = defaultValues?.features ?? [];
    return applications.filter(featureMatchesConfig(defaultOriginalFeatures)).map((app) => app.id);
  }, [defaultValues?.features, applications]);

  const defaultFeaturesRef = useRef(defaultFeatures);
  defaultFeaturesRef.current = defaultFeatures;

  const [selectedFeatureIds, setSelectedFeatureIds] = useState(
    appendDefaultFeatureIds(defaultFeatures)
  );
  const [permissionSettings, setPermissionSettings] = useState<
    Array<Partial<WorkspacePermissionSetting>>
  >(
    defaultValues?.permissions && defaultValues.permissions.length > 0
      ? defaultValues.permissions
      : []
  );

  const [formErrors, setFormErrors] = useState<WorkspaceFormErrors>({});
  const formIdRef = useRef<string>();
  const getFormData = () => ({
    name,
    description,
    features: selectedFeatureIds,
    color,
    permissions: permissionSettings,
  });
  const getFormDataRef = useRef(getFormData);
  getFormDataRef.current = getFormData;

  if (!formIdRef.current) {
    formIdRef.current = workspaceHtmlIdGenerator();
  }

  const handleFormSubmit = useCallback<FormEventHandler>(
    (e) => {
      e.preventDefault();
      let currentFormErrors: WorkspaceFormErrors = {};
      const formData = getFormDataRef.current();
      if (!formData.name) {
        currentFormErrors = {
          ...currentFormErrors,
          name: i18n.translate('workspace.form.detail.name.empty', {
            defaultMessage: "Name can't be empty.",
          }),
        };
      }
      if (!isValidNameOrDescription(formData.name)) {
        currentFormErrors = {
          ...currentFormErrors,
          name: i18n.translate('workspace.form.detail.name.invalid', {
            defaultMessage: 'Invalid workspace name',
          }),
        };
      }
      if (!isValidNameOrDescription(formData.description)) {
        currentFormErrors = {
          ...currentFormErrors,
          description: i18n.translate('workspace.form.detail.description.invalid', {
            defaultMessage: 'Invalid workspace description',
          }),
        };
      }
      const permissionErrors: string[] = new Array(formData.permissions.length);
      for (let i = 0; i < formData.permissions.length; i++) {
        const permission = formData.permissions[i];
        if (isValidWorkspacePermissionSetting(permission)) {
          if (
            isUserOrGroupPermissionSettingDuplicated(formData.permissions.slice(0, i), permission)
          ) {
            permissionErrors[i] = i18n.translate('workspace.form.permission.invalidate.group', {
              defaultMessage: 'Duplicate permission setting',
            });
            continue;
          }
          continue;
        }
        if (!permission.type) {
          permissionErrors[i] = i18n.translate('workspace.form.permission.invalidate.type', {
            defaultMessage: 'Invalid type',
          });
          continue;
        }
        if (!permission.modes || permission.modes.length === 0) {
          permissionErrors[i] = i18n.translate('workspace.form.permission.invalidate.modes', {
            defaultMessage: 'Invalid permission modes',
          });
          continue;
        }
        if (permission.type === WorkspacePermissionItemType.User && !permission.userId) {
          permissionErrors[i] = i18n.translate('workspace.form.permission.invalidate.userId', {
            defaultMessage: 'Invalid userId',
          });
          continue;
        }
        if (permission.type === WorkspacePermissionItemType.Group && !permission.group) {
          permissionErrors[i] = i18n.translate('workspace.form.permission.invalidate.group', {
            defaultMessage: 'Invalid user group',
          });
          continue; // this line is need for more conditions
        }
      }
      if (permissionErrors.some((error) => !!error)) {
        currentFormErrors = {
          ...currentFormErrors,
          permissions: permissionErrors,
        };
      }
      const currentNumberOfErrors = getNumberOfErrors(currentFormErrors);
      setFormErrors(currentFormErrors);
      setNumberOfErrors(currentNumberOfErrors);
      if (currentNumberOfErrors > 0) {
        return;
      }

      const featureConfigChanged =
        formData.features.length !== defaultFeatures.length ||
        formData.features.some((feat) => !defaultFeatures.includes(feat));

      if (!featureConfigChanged) {
        // If feature config not changed, set workspace feature config to the original value.
        // The reason why we do this is when a workspace feature is configured by wildcard,
        // such as `['@management']` or `['*']`. The form value `formData.features` will be
        // expanded to array of individual feature id, if the feature hasn't changed, we will
        // set the feature config back to the original value so that category wildcard won't
        // expanded to feature ids
        formData.features = defaultValues?.features ?? [];
      }

      const permissions = formData.permissions.filter(isValidWorkspacePermissionSetting);
      onSubmit?.({ ...formData, name: formData.name!, permissions });
    },
    [defaultFeatures, onSubmit, defaultValues?.features]
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

  const handleTabFeatureClick = useCallback(() => {
    setSelectedTab(WorkspaceFormTabs.FeatureVisibility);
  }, []);

  const handleTabPermissionClick = useCallback(() => {
    setSelectedTab(WorkspaceFormTabs.UsersAndPermissions);
  }, []);

  const handleFeaturesChange = useCallback((featureIds: string[]) => {
    setSelectedFeatureIds(featureIds);
  }, []);

  useEffect(() => {
    // When applications changed, reset form feature selection to original value
    setSelectedFeatureIds(appendDefaultFeatureIds(defaultFeaturesRef.current));
  }, [applications]);

  return {
    formId: formIdRef.current,
    formData: getFormData(),
    formErrors,
    selectedTab,
    applications,
    numberOfErrors,
    handleFormSubmit,
    handleColorChange,
    handleFeaturesChange,
    handleNameInputChange,
    handleTabFeatureClick,
    setPermissionSettings,
    handleTabPermissionClick,
    handleDescriptionInputChange,
  };
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState, FormEventHandler, useRef, useMemo } from 'react';
import { groupBy } from 'lodash';
import {
  EuiPanel,
  EuiSpacer,
  EuiTitle,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiText,
  EuiButton,
  EuiFlexItem,
  htmlIdGenerator,
  EuiFlexGrid,
  EuiCheckbox,
  EuiCheckboxGroup,
  EuiCheckboxGroupProps,
  EuiCheckboxProps,
  EuiFieldTextProps,
  EuiColorPicker,
  EuiColorPickerProps,
  EuiComboBox,
  EuiComboBoxProps,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

import {
  App,
  AppNavLinkStatus,
  ApplicationStart,
  DEFAULT_APP_CATEGORIES,
} from '../../../../../core/public';
import { useApplications } from '../../hooks';
import {
  WORKSPACE_OP_TYPE_CREATE,
  WORKSPACE_OP_TYPE_UPDATE,
  DEFAULT_CHECKED_FEATURES_IDS,
} from '../../../common/constants';
import {
  isFeatureDependBySelectedFeatures,
  getFinalFeatureIdsByDependency,
  generateFeatureDependencyMap,
} from '../utils/feature';

import { WorkspaceIconSelector } from './workspace_icon_selector';
import {
  WorkspacePermissionSetting,
  WorkspacePermissionSettingPanel,
} from './workspace_permission_setting_panel';

interface WorkspaceFeature extends Pick<App, 'dependencies'> {
  id: string;
  name: string;
}

interface WorkspaceFeatureGroup {
  name: string;
  features: WorkspaceFeature[];
}

export interface WorkspaceFormData {
  name: string;
  description?: string;
  features: string[];
  color?: string;
  icon?: string;
  defaultVISTheme?: string;
  permissions: WorkspacePermissionSetting[];
}

type WorkspaceFormErrors = Omit<{ [key in keyof WorkspaceFormData]?: string }, 'permissions'> & {
  permissions?: string[];
};

const isWorkspaceFeatureGroup = (
  featureOrGroup: WorkspaceFeature | WorkspaceFeatureGroup
): featureOrGroup is WorkspaceFeatureGroup => 'features' in featureOrGroup;

const isValidWorkspacePermissionSetting = (
  setting: Partial<WorkspacePermissionSetting>
): setting is WorkspacePermissionSetting =>
  !!setting.modes &&
  setting.modes.length > 0 &&
  ((setting.type === 'user' && !!setting.userId) || (setting.type === 'group' && !!setting.group));

const isDefaultCheckedFeatureId = (id: string) => {
  return DEFAULT_CHECKED_FEATURES_IDS.indexOf(id) > -1;
};

const appendDefaultFeatureIds = (ids: string[]) => {
  // concat default checked ids and unique the result
  return Array.from(new Set(ids.concat(DEFAULT_CHECKED_FEATURES_IDS)));
};

const workspaceHtmlIdGenerator = htmlIdGenerator();

const defaultVISThemeOptions = [{ label: 'Categorical', value: 'categorical' }];

interface WorkspaceFormProps {
  application: ApplicationStart;
  onSubmit?: (formData: WorkspaceFormData) => void;
  defaultValues?: WorkspaceFormData;
  opType?: string;
}

export const WorkspaceForm = ({
  application,
  onSubmit,
  defaultValues,
  opType,
}: WorkspaceFormProps) => {
  const applications = useApplications(application);

  const [name, setName] = useState(defaultValues?.name);
  const [description, setDescription] = useState(defaultValues?.description);
  const [color, setColor] = useState(defaultValues?.color);
  const [icon, setIcon] = useState(defaultValues?.icon);
  const [defaultVISTheme, setDefaultVISTheme] = useState(defaultValues?.defaultVISTheme);

  const [selectedFeatureIds, setSelectedFeatureIds] = useState(
    appendDefaultFeatureIds(defaultValues?.features || [])
  );
  const [permissionSettings, setPermissionSettings] = useState<
    Array<Partial<WorkspacePermissionSetting>>
  >(
    defaultValues?.permissions && defaultValues.permissions.length > 0
      ? defaultValues.permissions
      : [{}]
  );

  const [formErrors, setFormErrors] = useState<WorkspaceFormErrors>({});
  const formIdRef = useRef<string>();
  const getFormData = () => ({
    name,
    description,
    features: selectedFeatureIds,
    color,
    icon,
    defaultVISTheme,
    permissions: permissionSettings,
  });
  const getFormDataRef = useRef(getFormData);
  getFormDataRef.current = getFormData;

  const featureOrGroups = useMemo(() => {
    const category2Applications = groupBy(applications, 'category.label');
    return Object.keys(category2Applications).reduce<
      Array<WorkspaceFeature | WorkspaceFeatureGroup>
    >((previousValue, currentKey) => {
      const apps = category2Applications[currentKey];
      const features = apps
        .filter(
          ({ navLinkStatus, chromeless, category }) =>
            navLinkStatus !== AppNavLinkStatus.hidden &&
            !chromeless &&
            category?.id !== DEFAULT_APP_CATEGORIES.management.id
        )
        .map(({ id, title, dependencies }) => ({
          id,
          name: title,
          dependencies,
        }));
      if (features.length === 0) {
        return previousValue;
      }
      if (features.length === 1 || currentKey === 'undefined') {
        return [...previousValue, ...features];
      }
      return [
        ...previousValue,
        {
          name: apps[0].category?.label || '',
          features,
        },
      ];
    }, []);
  }, [applications]);

  const selectedDefaultVISThemeOptions = useMemo(
    () => defaultVISThemeOptions.filter((item) => item.value === defaultVISTheme),
    [defaultVISTheme]
  );

  const allFeatures = useMemo(
    () =>
      featureOrGroups.reduce<WorkspaceFeature[]>(
        (previousData, currentData) => [
          ...previousData,
          ...(isWorkspaceFeatureGroup(currentData) ? currentData.features : [currentData]),
        ],
        []
      ),
    [featureOrGroups]
  );

  const featureDependencies = useMemo(() => generateFeatureDependencyMap(allFeatures), [
    allFeatures,
  ]);

  if (!formIdRef.current) {
    formIdRef.current = workspaceHtmlIdGenerator();
  }

  const handleFeatureChange = useCallback<EuiCheckboxGroupProps['onChange']>(
    (featureId) => {
      setSelectedFeatureIds((previousData) => {
        if (!previousData.includes(featureId)) {
          return getFinalFeatureIdsByDependency([featureId], featureDependencies, previousData);
        }

        if (isFeatureDependBySelectedFeatures(featureId, previousData, featureDependencies)) {
          return previousData;
        }

        return previousData.filter((selectedId) => selectedId !== featureId);
      });
    },
    [featureDependencies]
  );

  const handleFeatureCheckboxChange = useCallback<EuiCheckboxProps['onChange']>(
    (e) => {
      handleFeatureChange(e.target.id);
    },
    [handleFeatureChange]
  );

  const handleFeatureGroupChange = useCallback<EuiCheckboxProps['onChange']>(
    (e) => {
      for (const featureOrGroup of featureOrGroups) {
        if (isWorkspaceFeatureGroup(featureOrGroup) && featureOrGroup.name === e.target.id) {
          const groupFeatureIds = featureOrGroup.features.map((feature) => feature.id);
          setSelectedFeatureIds((previousData) => {
            const notExistsIds = groupFeatureIds.filter((id) => !previousData.includes(id));
            if (notExistsIds.length > 0) {
              return getFinalFeatureIdsByDependency(
                notExistsIds,
                featureDependencies,
                previousData
              );
            }
            let groupRemainFeatureIds = groupFeatureIds;
            const outGroupFeatureIds = previousData.filter(
              (featureId) => !groupFeatureIds.includes(featureId)
            );

            while (true) {
              const lastRemainFeatures = groupRemainFeatureIds.length;
              groupRemainFeatureIds = groupRemainFeatureIds.filter((featureId) =>
                isFeatureDependBySelectedFeatures(
                  featureId,
                  [...outGroupFeatureIds, ...groupRemainFeatureIds],
                  featureDependencies
                )
              );
              if (lastRemainFeatures === groupRemainFeatureIds.length) {
                break;
              }
            }

            return [...outGroupFeatureIds, ...groupRemainFeatureIds];
          });
        }
      }
    },
    [featureOrGroups, featureDependencies]
  );

  const handleFormSubmit = useCallback<FormEventHandler>(
    (e) => {
      e.preventDefault();
      const formData = getFormDataRef.current();
      if (!formData.name) {
        setFormErrors({
          name: i18n.translate('workspace.form.name.empty', {
            defaultMessage: "Name can't be empty.",
          }),
        });
        return;
      }
      const permissionErrors: string[] = new Array(formData.permissions.length);
      for (let i = 0; i < formData.permissions.length; i++) {
        const permission = formData.permissions[i];
        if (isValidWorkspacePermissionSetting(permission)) {
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
        if (permission.type === 'user' && !permission.userId) {
          permissionErrors[i] = i18n.translate('workspace.form.permission.invalidate.userId', {
            defaultMessage: 'Invalid userId',
          });
          continue;
        }
        if (permission.type === 'group' && !permission.group) {
          permissionErrors[i] = i18n.translate('workspace.form.permission.invalidate.group', {
            defaultMessage: 'Invalid user group',
          });
          continue;
        }
      }
      if (permissionErrors.some((error) => !!error)) {
        setFormErrors({ permissions: permissionErrors });
        return;
      }
      const permissions = formData.permissions.filter(isValidWorkspacePermissionSetting);
      setFormErrors({});
      onSubmit?.({ ...formData, name: formData.name, permissions });
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

  const handleIconChange = useCallback((newIcon: string) => {
    setIcon(newIcon);
  }, []);

  const handleDefaultVISThemeInputChange = useCallback<
    Required<EuiComboBoxProps<string>>['onChange']
  >((options) => {
    setDefaultVISTheme(options[0]?.value);
  }, []);

  return (
    <EuiForm id={formIdRef.current} onSubmit={handleFormSubmit} component="form">
      <EuiPanel>
        <EuiTitle size="s">
          <h2>Workspace details</h2>
        </EuiTitle>
        <EuiSpacer />
        <EuiFormRow label="Name" isInvalid={!!formErrors.name} error={formErrors.name}>
          <EuiFieldText value={name} onChange={handleNameInputChange} />
        </EuiFormRow>
        <EuiFormRow
          label={
            <>
              Description - <i>optional</i>
            </>
          }
        >
          <EuiFieldText value={description} onChange={handleDescriptionInputChange} />
        </EuiFormRow>
        <EuiFormRow label="Color" isInvalid={!!formErrors.color} error={formErrors.color}>
          <EuiColorPicker color={color} onChange={handleColorChange} />
        </EuiFormRow>
        <EuiFormRow label="Icon" isInvalid={!!formErrors.icon} error={formErrors.icon}>
          <WorkspaceIconSelector value={icon} onChange={handleIconChange} color={color} />
        </EuiFormRow>
        <EuiFormRow
          label="Default VIS Theme"
          isInvalid={!!formErrors.defaultVISTheme}
          error={formErrors.defaultVISTheme}
        >
          <EuiComboBox
            options={defaultVISThemeOptions}
            singleSelection
            onChange={handleDefaultVISThemeInputChange}
            selectedOptions={selectedDefaultVISThemeOptions}
            isClearable={false}
          />
        </EuiFormRow>
      </EuiPanel>
      <EuiSpacer />
      <EuiPanel>
        <EuiTitle size="s">
          <h2>Workspace features</h2>
        </EuiTitle>
        <EuiFlexGrid style={{ paddingLeft: 20, paddingTop: 20 }} columns={2}>
          {featureOrGroups.map((featureOrGroup) => {
            const features = isWorkspaceFeatureGroup(featureOrGroup) ? featureOrGroup.features : [];
            const selectedIds = selectedFeatureIds.filter((id) =>
              (isWorkspaceFeatureGroup(featureOrGroup)
                ? featureOrGroup.features
                : [featureOrGroup]
              ).find((item) => item.id === id)
            );
            return (
              <EuiFlexItem key={featureOrGroup.name}>
                <EuiCheckbox
                  id={
                    isWorkspaceFeatureGroup(featureOrGroup)
                      ? featureOrGroup.name
                      : featureOrGroup.id
                  }
                  onChange={
                    isWorkspaceFeatureGroup(featureOrGroup)
                      ? handleFeatureGroupChange
                      : handleFeatureCheckboxChange
                  }
                  label={`${featureOrGroup.name}${
                    features.length > 0 ? `(${selectedIds.length}/${features.length})` : ''
                  }`}
                  checked={selectedIds.length > 0}
                  disabled={
                    !isWorkspaceFeatureGroup(featureOrGroup) &&
                    isDefaultCheckedFeatureId(featureOrGroup.id)
                  }
                  indeterminate={
                    isWorkspaceFeatureGroup(featureOrGroup) &&
                    selectedIds.length > 0 &&
                    selectedIds.length < features.length
                  }
                />
                {isWorkspaceFeatureGroup(featureOrGroup) && (
                  <EuiCheckboxGroup
                    options={featureOrGroup.features.map((item) => ({
                      id: item.id,
                      label: item.name,
                      disabled: isDefaultCheckedFeatureId(item.id),
                    }))}
                    idToSelectedMap={selectedIds.reduce(
                      (previousValue, currentValue) => ({
                        ...previousValue,
                        [currentValue]: true,
                      }),
                      {}
                    )}
                    onChange={handleFeatureChange}
                    style={{ marginLeft: 40 }}
                  />
                )}
              </EuiFlexItem>
            );
          })}
        </EuiFlexGrid>
      </EuiPanel>
      <EuiSpacer />
      <EuiPanel>
        <EuiTitle size="s">
          <h2>Members & permissions</h2>
        </EuiTitle>
        <WorkspacePermissionSettingPanel
          errors={formErrors.permissions}
          value={permissionSettings}
          onChange={setPermissionSettings}
        />
      </EuiPanel>
      <EuiSpacer />
      <EuiText textAlign="right">
        {opType === WORKSPACE_OP_TYPE_CREATE && (
          <EuiButton form={formIdRef.current} type="submit" fill>
            Create workspace
          </EuiButton>
        )}
        {opType === WORKSPACE_OP_TYPE_UPDATE && (
          <EuiButton form={formIdRef.current} type="submit" fill>
            Update workspace
          </EuiButton>
        )}
      </EuiText>
    </EuiForm>
  );
};

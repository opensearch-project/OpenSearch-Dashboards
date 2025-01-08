/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { euiPaletteColorBlind } from '@elastic/eui';
import type { SavedObjectPermissions } from '../../../../../core/types';
import { WorkspacePermissionMode } from '../../../../../core/public';
import { isUseCaseFeatureConfig } from '../../utils';
import {
  optionIdToWorkspacePermissionModesMap,
  permissionModeOptions,
  WorkspacePermissionItemType,
  WorkspacePrivacyItemType,
} from './constants';

import {
  WorkspaceFormDataState,
  WorkspaceFormError,
  WorkspaceFormErrorCode,
  WorkspaceFormErrors,
  WorkspaceFormSubmitData,
  WorkspacePermissionSetting,
  WorkspaceUserGroupPermissionSetting,
  WorkspaceUserPermissionSetting,
} from './types';
import { DataSourceConnection } from '../../../common/types';
import { validateWorkspaceColor } from '../../../common/utils';
import { PermissionModeId } from '../../../../../core/public';

export const isValidFormTextInput = (input?: string) => {
  /**
   * This regular expression is from the workspace form name and description field UI.
   * It only accepts below characters.
   **/
  const regex = /^[0-9a-zA-Z()_\[\]\-\s]+$/;
  return typeof input === 'string' && regex.test(input);
};

export const EMPTY_PERMISSIONS: SavedObjectPermissions = {
  library_read: {},
  library_write: {},
  read: {},
  write: {},
} as const;

export const getNumberOfErrors = (formErrors: WorkspaceFormErrors) => {
  let numberOfErrors = 0;
  if (formErrors.name) {
    numberOfErrors += 1;
  }
  if (formErrors.permissionSettings?.fields) {
    numberOfErrors += Object.keys(formErrors.permissionSettings.fields).length;
  }
  if (formErrors.permissionSettings?.overall) {
    numberOfErrors += 1;
  }
  if (formErrors.selectedDataSourceConnections) {
    numberOfErrors += Object.keys(formErrors.selectedDataSourceConnections).length;
  }
  if (formErrors.features) {
    numberOfErrors += 1;
  }
  if (formErrors.color) {
    numberOfErrors += 1;
  }
  return numberOfErrors;
};

export const hasSameUserIdOrGroup = (
  permissionSettings: Array<Partial<WorkspacePermissionSetting>>,
  permissionSettingToCheck: WorkspacePermissionSetting
) =>
  permissionSettings.some(
    (permissionSetting) =>
      (permissionSetting.type === WorkspacePermissionItemType.User &&
        permissionSettingToCheck.type === WorkspacePermissionItemType.User &&
        permissionSetting.userId === permissionSettingToCheck.userId) ||
      (permissionSetting.type === WorkspacePermissionItemType.Group &&
        permissionSettingToCheck.type === WorkspacePermissionItemType.Group &&
        permissionSetting.group === permissionSettingToCheck.group)
  );

/**
 * This function is for converting passed permission modes to permission option id,
 * it will return Read as default if permission modes not matched.
 *
 * @param modes permission modes
 * @returns permission option id
 */
export const getPermissionModeId = (modes: WorkspacePermissionMode[]) => {
  for (const key in optionIdToWorkspacePermissionModesMap) {
    if (optionIdToWorkspacePermissionModesMap[key].every((mode) => modes?.includes(mode))) {
      return key as PermissionModeId;
    }
  }
  return PermissionModeId.Read;
};

export const getPermissionModeName = (modes: WorkspacePermissionMode[]) => {
  for (const key in optionIdToWorkspacePermissionModesMap) {
    if (optionIdToWorkspacePermissionModesMap[key].every((mode) => modes?.includes(mode))) {
      return permissionModeOptions.find((option) => option.value === key)?.inputDisplay;
    }
  }
  return permissionModeOptions.find((option) => option.value === PermissionModeId.Read)
    ?.inputDisplay;
};

export const convertPermissionSettingsToPermissions = (
  permissionItems: WorkspacePermissionSetting[] | undefined
) => {
  if (!permissionItems || permissionItems.length === 0) {
    // Workspace object should always have permissions, set it as an empty object here instead of undefined.
    return EMPTY_PERMISSIONS;
  }
  return permissionItems.reduce<SavedObjectPermissions>((previous, current) => {
    current.modes.forEach((mode) => {
      if (!previous[mode]) {
        previous[mode] = {};
      }
      switch (current.type) {
        case WorkspacePermissionItemType.User:
          previous[mode].users = previous[mode].users?.includes(current.userId)
            ? previous[mode].users
            : [...(previous[mode].users || []), current.userId];
          break;
        case WorkspacePermissionItemType.Group:
          previous[mode].groups = previous[mode].groups?.includes(current.group)
            ? previous[mode].groups
            : [...(previous[mode].groups || []), current.group];
          break;
      }
    });
    return previous;
  }, {});
};

export const convertPermissionsToPermissionSettings = (permissions: SavedObjectPermissions) => {
  const permissionSettings: WorkspacePermissionSetting[] = [];
  const finalPermissionSettings: WorkspacePermissionSetting[] = [];
  const settingType2Modes: { [key: string]: WorkspacePermissionMode[] } = {};

  const processUsersOrGroups = (
    usersOrGroups: string[] | undefined,
    type: WorkspacePermissionItemType,
    mode: WorkspacePermissionMode
  ) => {
    usersOrGroups?.forEach((userOrGroup) => {
      const settingTypeKey = `${type}-${userOrGroup}`;
      const modes = settingType2Modes[settingTypeKey] ?? [];

      modes.push(mode);
      if (modes.length === 1) {
        permissionSettings.push({
          // This id is for type safe, and will be overwrite in below.
          id: 0,
          modes,
          ...(type === WorkspacePermissionItemType.User
            ? { type: WorkspacePermissionItemType.User, userId: userOrGroup }
            : { type: WorkspacePermissionItemType.Group, group: userOrGroup }),
        });
        settingType2Modes[settingTypeKey] = modes;
      }
    });
  };

  // Since owner should always be the first row of permissions, specific the process order let owner moved to the top
  [
    WorkspacePermissionMode.Write,
    WorkspacePermissionMode.LibraryWrite,
    WorkspacePermissionMode.LibraryRead,
    WorkspacePermissionMode.Read,
  ].forEach((mode) => {
    if (permissions[mode]) {
      processUsersOrGroups(permissions[mode].users, WorkspacePermissionItemType.User, mode);
      processUsersOrGroups(permissions[mode].groups, WorkspacePermissionItemType.Group, mode);
    }
  });

  let id = 0;
  /**
   * One workspace permission setting may include multi setting options,
   * for loop the workspace permission setting array to separate it to multi rows.
   **/
  permissionSettings.forEach((currentPermissionSettings) => {
    /**
     * For loop the option id to workspace permission modes map,
     * if one settings includes all permission modes in a specific option,
     * add these permission modes to the result array.
     */
    for (const key in optionIdToWorkspacePermissionModesMap) {
      if (!Object.prototype.hasOwnProperty.call(optionIdToWorkspacePermissionModesMap, key)) {
        continue;
      }
      const modesForCertainPermissionId = optionIdToWorkspacePermissionModesMap[key];
      if (
        modesForCertainPermissionId.every((mode) => currentPermissionSettings.modes?.includes(mode))
      ) {
        finalPermissionSettings.push({
          ...currentPermissionSettings,
          id,
          modes: modesForCertainPermissionId,
        });
        id++;
      }
    }
  });

  return finalPermissionSettings;
};

export const isSelectedDataSourceConnectionsDuplicated = (
  selectedDataSourceConnections: DataSourceConnection[],
  row: DataSourceConnection
) => selectedDataSourceConnections.some((connection) => connection.id === row.id);

export const validateWorkspaceForm = (formData: Partial<WorkspaceFormDataState>) => {
  const formErrors: WorkspaceFormErrors = {};
  const { name, color, features, selectedDataSourceConnections } = formData;
  if (name && name.trim()) {
    if (!isValidFormTextInput(name)) {
      formErrors.name = {
        code: WorkspaceFormErrorCode.InvalidWorkspaceName,
        message: i18n.translate('workspace.form.detail.name.invalid', {
          defaultMessage: 'Name is invalid. Enter a valid name.',
        }),
      };
    }
  } else {
    formErrors.name = {
      code: WorkspaceFormErrorCode.WorkspaceNameMissing,
      message: i18n.translate('workspace.form.detail.name.empty', {
        defaultMessage: 'Name is required. Enter a name.',
      }),
    };
  }
  if (!features || !features.some((featureConfig) => isUseCaseFeatureConfig(featureConfig))) {
    formErrors.features = {
      code: WorkspaceFormErrorCode.UseCaseMissing,
      message: i18n.translate('workspace.form.features.emptyUseCase', {
        defaultMessage: 'Use case is required. Select a use case.',
      }),
    };
  }
  if (color && (!validateWorkspaceColor(color) || !euiPaletteColorBlind().includes(color))) {
    formErrors.color = {
      code: WorkspaceFormErrorCode.InvalidColor,
      message: i18n.translate('workspace.form.features.invalidColor', {
        defaultMessage: 'Color is invalid. Choose a valid color.',
      }),
    };
  }
  if (selectedDataSourceConnections) {
    const dataSourcesErrors: { [key: number]: WorkspaceFormError } = {};
    for (let i = 0; i < selectedDataSourceConnections.length; i++) {
      const row = selectedDataSourceConnections[i];
      if (!row.id) {
        dataSourcesErrors[i] = {
          code: WorkspaceFormErrorCode.InvalidDataSource,
          message: i18n.translate('workspace.form.dataSource.invalid', {
            defaultMessage: 'Invalid data source',
          }),
        };
      } else if (
        isSelectedDataSourceConnectionsDuplicated(selectedDataSourceConnections.slice(0, i), row)
      ) {
        dataSourcesErrors[i] = {
          code: WorkspaceFormErrorCode.DuplicateDataSource,
          message: i18n.translate('workspace.form.permission.invalidate.group', {
            defaultMessage: 'Duplicate data sources',
          }),
        };
      }
    }
    if (Object.keys(dataSourcesErrors).length > 0) {
      formErrors.selectedDataSourceConnections = dataSourcesErrors;
    }
  }
  return formErrors;
};

export const generateNextPermissionSettingsId = (permissionSettings: Array<{ id: number }>) => {
  return permissionSettings.length === 0
    ? 0
    : Math.max(...permissionSettings.map(({ id }) => id)) + 1;
};

interface PermissionSettingLike
  extends Omit<Partial<WorkspaceUserPermissionSetting>, 'type'>,
    Omit<Partial<WorkspaceUserGroupPermissionSetting>, 'type'> {
  type?: string;
}

export const isWorkspacePermissionSetting = (
  permissionSetting: PermissionSettingLike
): permissionSetting is WorkspacePermissionSetting => {
  const { modes, type, userId, group } = permissionSetting;
  if (!modes) {
    return false;
  }
  const arrayStringify = (array: string[]) => array.sort().join();
  const stringifyModes = arrayStringify(modes);
  if (
    Object.values(optionIdToWorkspacePermissionModesMap).every(
      (validModes) => arrayStringify([...validModes]) !== stringifyModes
    )
  ) {
    return false;
  }
  if (type !== WorkspacePermissionItemType.User && type !== WorkspacePermissionItemType.Group) {
    return false;
  }
  if (type === WorkspacePermissionItemType.User && !userId) {
    return false;
  }
  if (type === WorkspacePermissionItemType.Group && !group) {
    return false;
  }
  return true;
};

export const getNumberOfChanges = (
  newFormData: Partial<WorkspaceFormDataState>,
  initialFormData: Partial<WorkspaceFormSubmitData>
) => {
  let count = 0;
  if (newFormData.name !== initialFormData.name) {
    count++;
  }
  // if newFormData.description is '' and initialFormData.description is undefined, count remains unchanged
  if ((newFormData.description || '') !== (initialFormData.description || '')) {
    count++;
  }
  if (newFormData.color !== initialFormData.color) {
    count++;
  }
  if (
    newFormData.features?.length !== initialFormData.features?.length ||
    newFormData.features?.some((item) => !initialFormData.features?.includes(item))
  ) {
    count++;
  }
  if (
    convertPermissionsToPrivacyType(newFormData.permissionSettings ?? []) !==
    convertPermissionsToPrivacyType(initialFormData.permissionSettings ?? [])
  ) {
    count++;
  }
  return count;
};

export const convertPermissionsToPrivacyType = (
  permissionSettings: WorkspaceFormDataState['permissionSettings']
) => {
  const modes = permissionSettings.find(
    (item) => item.type === WorkspacePermissionItemType.User && item.userId === '*'
  )?.modes;
  if (modes?.includes(WorkspacePermissionMode.LibraryWrite)) {
    return WorkspacePrivacyItemType.AnyoneCanEdit;
  }
  if (modes?.includes(WorkspacePermissionMode.LibraryRead)) {
    return WorkspacePrivacyItemType.AnyoneCanView;
  }
  return WorkspacePrivacyItemType.PrivateToCollaborators;
};

export const getPermissionSettingsWithPrivacyType = (
  permissionSettings: WorkspaceFormDataState['permissionSettings'],
  privacyType: WorkspacePrivacyItemType
): WorkspaceFormDataState['permissionSettings'] => {
  const newSettings = permissionSettings.filter(
    (item) => !(item.type === WorkspacePermissionItemType.User && item.userId === '*')
  );

  if (
    privacyType === WorkspacePrivacyItemType.AnyoneCanView ||
    privacyType === WorkspacePrivacyItemType.AnyoneCanEdit
  ) {
    newSettings.push({
      id: generateNextPermissionSettingsId(permissionSettings),
      type: WorkspacePermissionItemType.User,
      userId: '*',
      modes:
        optionIdToWorkspacePermissionModesMap[
          privacyType === WorkspacePrivacyItemType.AnyoneCanView
            ? PermissionModeId.Read
            : PermissionModeId.ReadAndWrite
        ],
    });
  }
  return newSettings;
};

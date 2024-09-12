/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import type { SavedObjectPermissions } from '../../../../../core/types';
import { CURRENT_USER_PLACEHOLDER, WorkspacePermissionMode } from '../../../common/constants';
import { isUseCaseFeatureConfig } from '../../utils';
import {
  optionIdToWorkspacePermissionModesMap,
  WorkspaceOperationType,
  WorkspacePermissionItemType,
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
      return key;
    }
  }
  return PermissionModeId.Read;
};

export const convertPermissionSettingsToPermissions = (
  permissionItems: WorkspacePermissionSetting[] | undefined
) => {
  if (!permissionItems || permissionItems.length === 0) {
    return undefined;
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

const validateUserPermissionSetting = (
  setting: WorkspaceUserPermissionSetting,
  previousPermissionSettings: Array<Partial<WorkspacePermissionSetting>>
) => {
  if (!!setting.userId && hasSameUserIdOrGroup(previousPermissionSettings, setting)) {
    return {
      code: WorkspaceFormErrorCode.DuplicateUserIdPermissionSetting,
      message: i18n.translate(
        'workspace.form.permission.invalidate.DuplicateUserIdPermissionSetting',
        {
          defaultMessage: 'User must be unique. Enter a unique user.',
        }
      ),
    };
  }
};

const validateUserGroupPermissionSetting = (
  setting: WorkspaceUserGroupPermissionSetting,
  previousPermissionSettings: Array<Partial<WorkspacePermissionSetting>>
) => {
  if (!!setting.group && hasSameUserIdOrGroup(previousPermissionSettings, setting)) {
    return {
      code: WorkspaceFormErrorCode.DuplicateUserGroupPermissionSetting,
      message: i18n.translate(
        'workspace.form.permission.invalidate.duplicateUserGroupPermissionSetting',
        {
          defaultMessage: 'User group must be unique. Enter a unique user group.',
        }
      ),
    };
  }
};

const validatePermissionSettings = (
  permissionSettings?: Array<
    Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>
  >
) => {
  const permissionSettingOwnerMissingError = {
    code: WorkspaceFormErrorCode.PermissionSettingOwnerMissing,
    message: i18n.translate('workspace.form.permission.setting.owner.missing', {
      defaultMessage: 'Add a workspace owner.',
    }),
  };
  if (!permissionSettings) {
    return {
      overall: permissionSettingOwnerMissingError,
    };
  }

  const permissionSettingsErrors: { [key: number]: WorkspaceFormError } = {};
  for (let i = 0; i < permissionSettings.length; i++) {
    const setting = permissionSettings[i];
    if (!setting.type) {
      permissionSettingsErrors[setting.id] = {
        code: WorkspaceFormErrorCode.InvalidPermissionType,
        message: i18n.translate('workspace.form.permission.invalidate.type', {
          defaultMessage: 'Invalid type',
        }),
      };
    } else if (!setting.modes || setting.modes.length === 0) {
      permissionSettingsErrors[setting.id] = {
        code: WorkspaceFormErrorCode.InvalidPermissionModes,
        message: i18n.translate('workspace.form.permission.invalidate.modes', {
          defaultMessage: 'Invalid permission modes',
        }),
      };
    } else if (setting.type === WorkspacePermissionItemType.User) {
      const validateResult = validateUserPermissionSetting(
        setting as WorkspaceUserPermissionSetting,
        permissionSettings.slice(0, i)
      );
      if (validateResult) {
        permissionSettingsErrors[setting.id] = validateResult;
      }
    } else if (setting.type === WorkspacePermissionItemType.Group) {
      const validateResult = validateUserGroupPermissionSetting(
        setting as WorkspaceUserGroupPermissionSetting,
        permissionSettings.slice(0, i)
      );
      if (validateResult) {
        permissionSettingsErrors[setting.id] = validateResult;
      }
    }
  }
  return {
    ...(!permissionSettings.some(
      (setting) => setting.modes && getPermissionModeId(setting.modes) === PermissionModeId.Owner
    )
      ? { overall: permissionSettingOwnerMissingError }
      : {}),
    ...(Object.keys(permissionSettingsErrors).length > 0
      ? { fields: permissionSettingsErrors }
      : {}),
  };
};
export const isSelectedDataSourceConnectionsDuplicated = (
  selectedDataSourceConnections: DataSourceConnection[],
  row: DataSourceConnection
) => selectedDataSourceConnections.some((connection) => connection.id === row.id);

export const validateWorkspaceForm = (
  formData: Partial<WorkspaceFormDataState>,
  isPermissionEnabled: boolean
) => {
  const formErrors: WorkspaceFormErrors = {};
  const { name, permissionSettings, color, features, selectedDataSourceConnections } = formData;
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
      message: i18n.translate('workspace.form.features.empty', {
        defaultMessage: 'Use case is required. Select a use case.',
      }),
    };
  }
  if (color && !validateWorkspaceColor(color)) {
    formErrors.color = {
      code: WorkspaceFormErrorCode.InvalidColor,
      message: i18n.translate('workspace.form.features.empty', {
        defaultMessage: 'Color is invalid. Enter a valid color.',
      }),
    };
  }
  if (isPermissionEnabled) {
    formErrors.permissionSettings = validatePermissionSettings(permissionSettings);
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

/**
 *
 * Generate permission settings state with provided operation type and  permission settings,
 * It will always return current user as an Owner and an empty user group permission settings
 * when operation type is create or no users and groups in provided permission settings.
 * It will append current user to result permission settings if no user in provided permission settings.
 * It will append an empty permission group to result permission settings if no user group in provided permission settings.
 * It will always return original permission settings if both user or user group in provided permission settings.
 *
 * @param operationType
 * @param permissionSettings
 * @returns
 */
export const generatePermissionSettingsState = (
  operationType: WorkspaceOperationType,
  permissionSettings?: WorkspacePermissionSetting[]
): WorkspacePermissionSetting[] => {
  const emptyUserPermission: WorkspaceUserPermissionSetting = {
    id: 1,
    type: WorkspacePermissionItemType.User,
    userId: '',
    modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Owner],
  };
  const emptyUserGroupPermission: WorkspaceUserGroupPermissionSetting = {
    id: 2,
    type: WorkspacePermissionItemType.Group,
    group: '',
    modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
  };

  if (operationType === WorkspaceOperationType.Create) {
    return [
      {
        ...emptyUserPermission,
        userId: CURRENT_USER_PLACEHOLDER,
      },
      emptyUserGroupPermission,
    ];
  }

  const finalPermissionSettings = [...(permissionSettings ?? [])];
  const userPermissionExists = finalPermissionSettings.find(
    (setting) => setting.type === WorkspacePermissionItemType.User
  );
  const groupPermissionExists = finalPermissionSettings.find(
    (setting) => setting.type === WorkspacePermissionItemType.Group
  );
  if (!userPermissionExists) {
    finalPermissionSettings.push({
      ...emptyUserPermission,
      id: generateNextPermissionSettingsId(finalPermissionSettings),
    } as typeof finalPermissionSettings[0]);
  }
  if (!groupPermissionExists) {
    finalPermissionSettings.push({
      ...emptyUserGroupPermission,
      id: generateNextPermissionSettingsId(finalPermissionSettings),
    } as typeof finalPermissionSettings[0]);
  }
  return finalPermissionSettings;
};

interface PermissionSettingLike
  extends Omit<Partial<WorkspaceUserPermissionSetting>, 'type'>,
    Omit<Partial<WorkspaceUserGroupPermissionSetting>, 'type'> {
  type?: string;
}
const isSamePermissionSetting = (a: PermissionSettingLike, b: PermissionSettingLike) => {
  return (
    a.id === b.id &&
    a.type === b.type &&
    a.userId === b.userId &&
    a.group === b.group &&
    a.modes?.length === b.modes?.length &&
    a.modes?.every((mode) => b.modes?.includes(mode))
  );
};

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
  // Count all new added permission settings
  count +=
    newFormData.permissionSettings?.reduce((prevNewAddedCount, setting) => {
      if (!initialFormData.permissionSettings?.find((item) => item.id === setting.id)) {
        prevNewAddedCount += 1;
      }
      return prevNewAddedCount;
    }, 0) ?? 0;
  count +=
    initialFormData.permissionSettings?.reduce((prevDeletedAndModifiedCount, setting) => {
      const newSetting = newFormData.permissionSettings?.find((item) => item.id === setting.id);
      if (!newSetting) {
        // Count all delete permission settings
        prevDeletedAndModifiedCount += 1;
      } else if (!isSamePermissionSetting(newSetting, setting)) {
        // Count all modified permission settings
        prevDeletedAndModifiedCount += 1;
      }
      return prevDeletedAndModifiedCount;
    }, 0) ?? 0;
  return count;
};

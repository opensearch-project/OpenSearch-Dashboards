/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { EuiButton, EuiFormRow, EuiText, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspacePermissionSetting } from './types';
import {
  WorkspacePermissionItemType,
  optionIdToWorkspacePermissionModesMap,
  PermissionModeId,
} from './constants';
import {
  WorkspacePermissionSettingInput,
  WorkspacePermissionSettingInputProps,
} from './workspace_permission_setting_input';
import { generateWorkspacePermissionItemKey, getPermissionModeId } from './utils';

interface WorkspacePermissionSettingPanelProps {
  errors?: string[];
  lastAdminItemDeletable: boolean;
  permissionSettings: Array<Partial<WorkspacePermissionSetting>>;
  onChange?: (value: Array<Partial<WorkspacePermissionSetting>>) => void;
}

interface UserOrGroupSectionProps
  extends Omit<WorkspacePermissionSettingPanelProps, 'lastAdminItemDeletable'> {
  title: string;
  nonDeletableIndex: number;
  type: WorkspacePermissionItemType;
}

const UserOrGroupSection = ({
  type,
  title,
  errors,
  onChange,
  permissionSettings,
  nonDeletableIndex,
}: UserOrGroupSectionProps) => {
  const transformedValue = useMemo(() => {
    if (!permissionSettings) {
      return [];
    }
    const result: Array<Partial<WorkspacePermissionSetting>> = [];
    /**
     * One workspace permission setting may include multi setting options,
     * for loop the workspace permission setting array to separate it to multi rows.
     **/
    for (let i = 0; i < permissionSettings.length; i++) {
      const valueItem = permissionSettings[i];
      // Incomplete workspace permission setting don't need to separate to multi rows
      if (
        !valueItem.modes ||
        !valueItem.type ||
        (valueItem.type === 'user' && !valueItem.userId) ||
        (valueItem.type === 'group' && !valueItem.group)
      ) {
        result.push(valueItem);
        continue;
      }
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
        if (modesForCertainPermissionId.every((mode) => valueItem.modes?.includes(mode))) {
          result.push({ ...valueItem, modes: modesForCertainPermissionId });
        }
      }
    }
    return result;
  }, [permissionSettings]);

  // default permission mode is read
  const handleAddNewOne = useCallback(() => {
    onChange?.([
      ...(transformedValue ?? []),
      { type, modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read] },
    ]);
  }, [onChange, type, transformedValue]);

  const handleDelete = useCallback(
    (index: number) => {
      onChange?.((transformedValue ?? []).filter((_item, itemIndex) => itemIndex !== index));
    },
    [onChange, transformedValue]
  );

  const handlePermissionModesChange = useCallback<
    WorkspacePermissionSettingInputProps['onPermissionModesChange']
  >(
    (modes, index) => {
      onChange?.(
        (transformedValue ?? []).map((item, itemIndex) =>
          index === itemIndex ? { ...item, modes } : item
        )
      );
    },
    [onChange, transformedValue]
  );

  const handleGroupOrUserIdChange = useCallback<
    WorkspacePermissionSettingInputProps['onGroupOrUserIdChange']
  >(
    (userOrGroupIdWithType, index) => {
      onChange?.(
        (transformedValue ?? []).map((item, itemIndex) =>
          index === itemIndex
            ? { ...userOrGroupIdWithType, ...(item.modes ? { modes: item.modes } : {}) }
            : item
        )
      );
    },
    [onChange, transformedValue]
  );

  // assume that group items are always deletable
  return (
    <div>
      <EuiText>
        <strong>{title}</strong>
      </EuiText>
      <EuiSpacer size="s" />
      {transformedValue?.map((item, index) => (
        <React.Fragment key={generateWorkspacePermissionItemKey(item, index)}>
          <EuiFormRow isInvalid={!!errors?.[index]} error={errors?.[index]}>
            <WorkspacePermissionSettingInput
              {...item}
              type={type}
              index={index}
              deletable={index !== nonDeletableIndex}
              onDelete={handleDelete}
              onGroupOrUserIdChange={handleGroupOrUserIdChange}
              onPermissionModesChange={handlePermissionModesChange}
            />
          </EuiFormRow>
        </React.Fragment>
      ))}
      <EuiButton
        fill
        fullWidth={false}
        onClick={handleAddNewOne}
        data-test-subj={`workspaceForm-permissionSettingPanel-${type}-addNew`}
      >
        {i18n.translate('workspace.form.permissionSettingPanel.addNew', {
          defaultMessage: 'Add New',
        })}
      </EuiButton>
    </div>
  );
};

export const WorkspacePermissionSettingPanel = ({
  errors,
  onChange,
  permissionSettings,
  lastAdminItemDeletable,
}: WorkspacePermissionSettingPanelProps) => {
  const userPermissionSettings = useMemo(
    () =>
      permissionSettings?.filter(
        (permissionSettingItem) => permissionSettingItem.type === WorkspacePermissionItemType.User
      ) ?? [],
    [permissionSettings]
  );
  const groupPermissionSettings = useMemo(
    () =>
      permissionSettings?.filter(
        (permissionSettingItem) => permissionSettingItem.type === WorkspacePermissionItemType.Group
      ) ?? [],
    [permissionSettings]
  );

  const handleUserPermissionSettingsChange = useCallback(
    (newSettings) => {
      onChange?.([...newSettings, ...groupPermissionSettings]);
    },
    [groupPermissionSettings, onChange]
  );

  const handleGroupPermissionSettingsChange = useCallback(
    (newSettings) => {
      onChange?.([...userPermissionSettings, ...newSettings]);
    },
    [userPermissionSettings, onChange]
  );

  const nonDeletableIndex = useMemo(() => {
    let userNonDeletableIndex = -1;
    let groupNonDeletableIndex = -1;
    const newPermissionSettings = [...userPermissionSettings, ...groupPermissionSettings];
    if (!lastAdminItemDeletable) {
      const adminPermissionSettings = newPermissionSettings.filter(
        (permission) => getPermissionModeId(permission.modes ?? []) === PermissionModeId.Admin
      );
      if (adminPermissionSettings.length === 1) {
        if (adminPermissionSettings[0].type === WorkspacePermissionItemType.User) {
          userNonDeletableIndex = userPermissionSettings.findIndex(
            (permission) => getPermissionModeId(permission.modes ?? []) === PermissionModeId.Admin
          );
        } else {
          groupNonDeletableIndex = groupPermissionSettings.findIndex(
            (permission) => getPermissionModeId(permission.modes ?? []) === PermissionModeId.Admin
          );
        }
      }
    }
    return { userNonDeletableIndex, groupNonDeletableIndex };
  }, [userPermissionSettings, groupPermissionSettings, lastAdminItemDeletable]);

  const { userNonDeletableIndex, groupNonDeletableIndex } = nonDeletableIndex;

  return (
    <div>
      <UserOrGroupSection
        title={i18n.translate('workspace.form.permissionSettingPanel.userTitle', {
          defaultMessage: 'User',
        })}
        errors={errors}
        onChange={handleUserPermissionSettingsChange}
        nonDeletableIndex={userNonDeletableIndex}
        permissionSettings={userPermissionSettings}
        type={WorkspacePermissionItemType.User}
      />
      <EuiSpacer size="s" />
      <UserOrGroupSection
        title={i18n.translate('workspace.form.permissionSettingPanel.userGroupTitle', {
          defaultMessage: 'User Groups',
        })}
        errors={errors}
        onChange={handleGroupPermissionSettingsChange}
        nonDeletableIndex={groupNonDeletableIndex}
        permissionSettings={groupPermissionSettings}
        type={WorkspacePermissionItemType.Group}
      />
    </div>
  );
};

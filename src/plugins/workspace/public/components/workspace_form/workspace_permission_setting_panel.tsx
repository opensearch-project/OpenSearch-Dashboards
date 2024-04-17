/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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
import { generateNextPermissionSettingsId, getPermissionModeId } from './utils';

export interface WorkspacePermissionSettingPanelProps {
  errors?: { [key: number]: string };
  lastAdminItemDeletable: boolean;
  permissionSettings: Array<
    Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>
  >;
  onChange?: (
    value: Array<Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>>
  ) => void;
}

interface UserOrGroupSectionProps
  extends Omit<WorkspacePermissionSettingPanelProps, 'lastAdminItemDeletable'> {
  title: string;
  nonDeletableIndex: number;
  type: WorkspacePermissionItemType;
  nextIdGenerator: () => number;
}

const UserOrGroupSection = ({
  type,
  title,
  errors,
  onChange,
  nextIdGenerator,
  permissionSettings,
  nonDeletableIndex,
}: UserOrGroupSectionProps) => {
  // default permission mode is read
  const handleAddNewOne = useCallback(() => {
    onChange?.([
      ...permissionSettings,
      {
        id: nextIdGenerator(),
        type,
        modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
      },
    ]);
  }, [onChange, type, permissionSettings, nextIdGenerator]);

  const handleDelete = useCallback(
    (index: number) => {
      onChange?.(permissionSettings.filter((_item, itemIndex) => itemIndex !== index));
    },
    [onChange, permissionSettings]
  );

  const handlePermissionModesChange = useCallback<
    WorkspacePermissionSettingInputProps['onPermissionModesChange']
  >(
    (modes, index) => {
      onChange?.(
        permissionSettings.map((item, itemIndex) =>
          index === itemIndex ? { ...item, modes } : item
        )
      );
    },
    [onChange, permissionSettings]
  );

  const handleGroupOrUserIdChange = useCallback<
    WorkspacePermissionSettingInputProps['onGroupOrUserIdChange']
  >(
    (userOrGroupIdWithType, index) => {
      onChange?.(
        permissionSettings.map((item, itemIndex) =>
          index === itemIndex
            ? {
                id: item.id,
                ...userOrGroupIdWithType,
                ...(item.modes ? { modes: item.modes } : {}),
              }
            : item
        )
      );
    },
    [onChange, permissionSettings]
  );

  return (
    <div>
      <EuiText>
        <strong>{title}</strong>
      </EuiText>
      <EuiSpacer size="s" />
      {permissionSettings.map((item, index) => (
        <React.Fragment key={item.id}>
          <EuiFormRow isInvalid={!!errors?.[item.id]} error={errors?.[item.id]}>
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

  const { userNonDeletableIndex, groupNonDeletableIndex } = useMemo(() => {
    if (
      lastAdminItemDeletable ||
      // Permission setting can be deleted if there are more than one admin setting
      [...userPermissionSettings, ...groupPermissionSettings].filter(
        (permission) =>
          permission.modes && getPermissionModeId(permission.modes) === PermissionModeId.Admin
      ).length > 1
    ) {
      return { userNonDeletableIndex: -1, groupNonDeletableIndex: -1 };
    }
    return {
      userNonDeletableIndex: userPermissionSettings.findIndex(
        (permission) =>
          permission.modes && getPermissionModeId(permission.modes) === PermissionModeId.Admin
      ),
      groupNonDeletableIndex: groupPermissionSettings.findIndex(
        (permission) =>
          permission.modes && getPermissionModeId(permission.modes) === PermissionModeId.Admin
      ),
    };
  }, [userPermissionSettings, groupPermissionSettings, lastAdminItemDeletable]);

  const nextIdRef = useRef(generateNextPermissionSettingsId(permissionSettings));

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

  const nextIdGenerator = useCallback(() => {
    const nextId = nextIdRef.current;
    nextIdRef.current++;
    return nextId;
  }, []);

  useEffect(() => {
    nextIdRef.current = Math.max(
      nextIdRef.current,
      generateNextPermissionSettingsId(permissionSettings)
    );
  }, [permissionSettings]);

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
        nextIdGenerator={nextIdGenerator}
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
        nextIdGenerator={nextIdGenerator}
      />
    </div>
  );
};

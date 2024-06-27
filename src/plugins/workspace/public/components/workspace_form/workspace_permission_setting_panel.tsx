/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { EuiButton, EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspaceFormError, WorkspacePermissionSetting } from './types';
import {
  WorkspacePermissionItemType,
  optionIdToWorkspacePermissionModesMap,
  PermissionModeId,
} from './constants';
import {
  WorkspacePermissionSettingInput,
  WorkspacePermissionSettingInputProps,
} from './workspace_permission_setting_input';
import { generateNextPermissionSettingsId } from './utils';

export interface WorkspacePermissionSettingPanelProps {
  errors?: { [key: number]: WorkspaceFormError };
  disabledUserOrGroupInputIds: number[];
  permissionSettings: Array<
    Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>
  >;
  onChange?: (
    value: Array<Pick<WorkspacePermissionSetting, 'id'> & Partial<WorkspacePermissionSetting>>
  ) => void;
}

interface UserOrGroupSectionProps extends WorkspacePermissionSettingPanelProps {
  type: WorkspacePermissionItemType;
  nextIdGenerator: () => number;
}

const UserOrGroupSection = ({
  type,
  errors,
  onChange,
  nextIdGenerator,
  permissionSettings,
  disabledUserOrGroupInputIds,
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
      <EuiFlexGroup gutterSize="m">
        <EuiFlexItem style={{ maxWidth: 400 }}>
          <EuiFormRow
            label={
              type === WorkspacePermissionItemType.User
                ? i18n.translate('workspaceForm.permissionSetting.userLabel', {
                    defaultMessage: 'User',
                  })
                : i18n.translate('workspaceForm.permissionSetting.groupLabel', {
                    defaultMessage: 'User group',
                  })
            }
          >
            <></>
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem style={{ maxWidth: 332 }}>
          <EuiFormRow
            label={i18n.translate('workspaceForm.permissionSetting.permissionLabel', {
              defaultMessage: 'Permissions',
            })}
          >
            <></>
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="xs" />
      {permissionSettings.map((item, index) => (
        <React.Fragment key={item.id}>
          <EuiFormRow fullWidth isInvalid={!!errors?.[item.id]} error={errors?.[item.id]?.message}>
            <WorkspacePermissionSettingInput
              {...item}
              type={type}
              index={index}
              userOrGroupDisabled={disabledUserOrGroupInputIds.includes(item.id)}
              onDelete={handleDelete}
              onGroupOrUserIdChange={handleGroupOrUserIdChange}
              onPermissionModesChange={handlePermissionModesChange}
            />
          </EuiFormRow>
        </React.Fragment>
      ))}
      <EuiButton
        fullWidth={false}
        onClick={handleAddNewOne}
        data-test-subj={`workspaceForm-permissionSettingPanel-${type}-addNew`}
        color="secondary"
      >
        {type === WorkspacePermissionItemType.User
          ? i18n.translate('workspace.form.permissionSettingPanel.addUser', {
              defaultMessage: 'Add user',
            })
          : i18n.translate('workspace.form.permissionSettingPanel.addUserGroup', {
              defaultMessage: 'Add user group',
            })}
      </EuiButton>
    </div>
  );
};

export const WorkspacePermissionSettingPanel = ({
  errors,
  onChange,
  permissionSettings,
  disabledUserOrGroupInputIds,
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
        errors={errors}
        onChange={handleUserPermissionSettingsChange}
        permissionSettings={userPermissionSettings}
        type={WorkspacePermissionItemType.User}
        nextIdGenerator={nextIdGenerator}
        disabledUserOrGroupInputIds={disabledUserOrGroupInputIds}
      />
      <EuiSpacer size="m" />
      <UserOrGroupSection
        errors={errors}
        onChange={handleGroupPermissionSettingsChange}
        permissionSettings={groupPermissionSettings}
        type={WorkspacePermissionItemType.Group}
        nextIdGenerator={nextIdGenerator}
        disabledUserOrGroupInputIds={disabledUserOrGroupInputIds}
      />
    </div>
  );
};

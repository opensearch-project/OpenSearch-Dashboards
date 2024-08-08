/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiButtonIcon, EuiSelect, EuiComboBox } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspacePermissionMode } from '../../../common/constants';
import {
  WorkspacePermissionItemType,
  optionIdToWorkspacePermissionModesMap,
  PermissionModeId,
} from './constants';
import { getPermissionModeId } from './utils';
import './workspace_permission_setting_input.scss';

const permissionModeOptions = [
  {
    value: PermissionModeId.Read,
    label: i18n.translate('workspace.form.permissionSettingPanel.permissionModeOptions.read', {
      defaultMessage: 'Read',
    }),
  },
  {
    value: PermissionModeId.ReadAndWrite,
    label: i18n.translate(
      'workspace.form.permissionSettingPanel.permissionModeOptions.readAndWrite',
      {
        defaultMessage: 'Read & Write',
      }
    ),
  },
  {
    value: PermissionModeId.Owner,
    label: i18n.translate('workspace.form.permissionSettingPanel.permissionModeOptions.owner', {
      defaultMessage: 'Owner',
    }),
  },
];

const typeOptions = [
  {
    value: WorkspacePermissionItemType.User,
    text: i18n.translate('workspace.form.permissionSettingPanel.typeOptions.user', {
      defaultMessage: 'User',
    }),
  },
  {
    value: WorkspacePermissionItemType.Group,
    text: i18n.translate('workspace.form.permissionSettingPanel.typeOptions.group', {
      defaultMessage: 'Group',
    }),
  },
];

export interface WorkspacePermissionSettingInputProps {
  index: number;
  type: WorkspacePermissionItemType;
  userId?: string;
  group?: string;
  modes?: WorkspacePermissionMode[];
  deletable?: boolean;
  userOrGroupDisabled: boolean;
  onGroupOrUserIdChange: (
    groupOrUserId:
      | { type: WorkspacePermissionItemType.User; userId?: string }
      | { type: WorkspacePermissionItemType.Group; group?: string },
    index: number
  ) => void;
  onPermissionModesChange: (
    WorkspacePermissionMode: WorkspacePermissionMode[],
    index: number
  ) => void;
  onTypeChange: (
    WorkspacePermissionItemType:
      | WorkspacePermissionItemType.User
      | WorkspacePermissionItemType.Group,
    index: number
  ) => void;
  onDelete: (index: number) => void;
}

export const WorkspacePermissionSettingInput = ({
  index,
  type,
  userId,
  group,
  modes,
  deletable = true,
  userOrGroupDisabled,
  onDelete,
  onGroupOrUserIdChange,
  onPermissionModesChange,
  onTypeChange,
}: WorkspacePermissionSettingInputProps) => {
  const groupOrUserIdSelectedOptions = useMemo(
    () => (group || userId ? [{ label: (group || userId) as string }] : []),
    [group, userId]
  );

  // const permissionModesSelectedId = useMemo(() => getPermissionModeId(modes ?? []), [modes]);
  const idSelected = useMemo(() => getPermissionModeId(modes ?? []), [modes]);
  const permissionModesSelected = useMemo(() => {
    const permissionModeSelected = permissionModeOptions.find(
      (option) => option.value === idSelected
    );
    return permissionModeSelected ? [permissionModeSelected] : [];
  }, [idSelected]);

  const handleGroupOrUserIdCreate = useCallback(
    (groupOrUserId) => {
      onGroupOrUserIdChange(
        type === WorkspacePermissionItemType.Group
          ? { type, group: groupOrUserId }
          : { type, userId: groupOrUserId },
        index
      );
    },
    [index, type, onGroupOrUserIdChange]
  );

  const handleGroupOrUserIdChange = useCallback(
    (options) => {
      if (options.length === 0) {
        onGroupOrUserIdChange({ type }, index);
      }
    },
    [index, type, onGroupOrUserIdChange]
  );

  const handlePermissionModeOptionChange = useCallback(
    (option) => {
      if (option) {
        const id = option[0].value;
        if (optionIdToWorkspacePermissionModesMap[id]) {
          onPermissionModesChange([...optionIdToWorkspacePermissionModesMap[id]], index);
        }
      }
    },
    [index, onPermissionModesChange]
  );

  const handleTypeChange = useCallback(
    (e) => {
      if (e.target.value) {
        const option = e.target.value;
        onTypeChange(option, index);
      }
    },
    [index, onTypeChange]
  );

  const handleDelete = useCallback(() => {
    onDelete(index);
  }, [index, onDelete]);

  return (
    <EuiFlexGroup alignItems="center" gutterSize="m">
      <EuiFlexItem style={{ maxWidth: 400 }}>
        <EuiComboBox
          compressed={true}
          singleSelection={{ asPlainText: true }}
          selectedOptions={groupOrUserIdSelectedOptions}
          onCreateOption={handleGroupOrUserIdCreate}
          onChange={handleGroupOrUserIdChange}
          placeholder={
            type === WorkspacePermissionItemType.User
              ? i18n.translate('workspaceForm.permissionSetting.selectUser', {
                  defaultMessage: 'Select a user',
                })
              : i18n.translate('workspaceForm.permissionSetting.selectUserGroup', {
                  defaultMessage: 'Select a user group',
                })
          }
          isDisabled={userOrGroupDisabled}
          prepend={
            <EuiFlexItem style={{ maxWidth: 100 }}>
              <EuiSelect
                className="workspacePermissionSettingUserAndGroupSelect"
                compressed={true}
                options={typeOptions}
                onChange={handleTypeChange}
                value={type}
                style={{
                  boxShadow: 'none',
                  fontWeight: 'bold',
                }}
                data-test-subj="workspace.typeOptions"
              />
            </EuiFlexItem>
          }
        />
      </EuiFlexItem>
      <EuiFlexItem style={{ maxWidth: 200 }}>
        <EuiComboBox
          compressed={true}
          singleSelection={{ asPlainText: true }}
          options={permissionModeOptions}
          isDisabled={userOrGroupDisabled}
          selectedOptions={permissionModesSelected}
          onChange={handlePermissionModeOptionChange}
          isClearable={false}
          data-test-subj="workspace.permissionModeOptions"
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        {deletable && (
          <EuiButtonIcon
            color="danger"
            aria-label="Delete permission setting"
            iconType="trash"
            display="empty"
            size="m"
            onClick={handleDelete}
            isDisabled={!deletable}
          />
        )}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

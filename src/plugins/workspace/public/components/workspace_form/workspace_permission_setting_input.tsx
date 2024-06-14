/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import {
  EuiFlexGroup,
  EuiComboBox,
  EuiFlexItem,
  EuiButtonIcon,
  EuiButtonGroup,
  EuiFormRow,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspacePermissionMode } from '../../../common/constants';
import {
  WorkspacePermissionItemType,
  optionIdToWorkspacePermissionModesMap,
  PermissionModeId,
} from './constants';
import { getPermissionModeId } from './utils';

export const permissionModeOptions = [
  {
    id: PermissionModeId.Read,
    label: (
      <EuiText size="s">
        {i18n.translate('workspace.form.permissionSettingPanel.permissionModeOptions.read', {
          defaultMessage: 'Read',
        })}
      </EuiText>
    ),
  },
  {
    id: PermissionModeId.ReadAndWrite,
    label: (
      <EuiText size="s">
        {i18n.translate(
          'workspace.form.permissionSettingPanel.permissionModeOptions.readAndWrite',
          {
            defaultMessage: 'Read & Write',
          }
        )}
      </EuiText>
    ),
  },
  {
    id: PermissionModeId.Owner,
    label: (
      <EuiText size="s">
        {i18n.translate('workspace.form.permissionSettingPanel.permissionModeOptions.owner', {
          defaultMessage: 'Owner',
        })}
      </EuiText>
    ),
  },
];

export interface WorkspacePermissionSettingInputProps {
  index: number;
  deletable: boolean;
  type: WorkspacePermissionItemType;
  userId?: string;
  group?: string;
  modes?: WorkspacePermissionMode[];
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
  onDelete: (index: number) => void;
}

export const WorkspacePermissionSettingInput = ({
  index,
  type,
  userId,
  group,
  modes,
  deletable,
  onDelete,
  onGroupOrUserIdChange,
  onPermissionModesChange,
}: WorkspacePermissionSettingInputProps) => {
  const groupOrUserIdSelectedOptions = useMemo(
    () => (group || userId ? [{ label: (group || userId) as string }] : []),
    [group, userId]
  );

  const permissionModesSelectedId = useMemo(() => getPermissionModeId(modes ?? []), [modes]);
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
    (id: string) => {
      if (optionIdToWorkspacePermissionModesMap[id]) {
        onPermissionModesChange([...optionIdToWorkspacePermissionModesMap[id]], index);
      }
    },
    [index, onPermissionModesChange]
  );

  const handleDelete = useCallback(() => {
    onDelete(index);
  }, [index, onDelete]);

  return (
    <EuiFlexGroup alignItems="flexEnd" gutterSize="m">
      <EuiFlexItem style={{ maxWidth: 400 }}>
        <EuiFormRow
          label={
            index === 0
              ? type === WorkspacePermissionItemType.User
                ? i18n.translate('workspaceForm.permissionSetting.userLabel', {
                    defaultMessage: 'User',
                  })
                : i18n.translate('workspaceForm.permissionSetting.groupLabel', {
                    defaultMessage: 'User group',
                  })
              : undefined
          }
        >
          <EuiComboBox
            singleSelection
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
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem style={{ maxWidth: 332 }}>
        <EuiFormRow
          label={
            index === 0
              ? i18n.translate('workspaceForm.permissionSetting.permissionLabel', {
                  defaultMessage: 'Permissions',
                })
              : undefined
          }
        >
          <EuiButtonGroup
            type="single"
            isDisabled={!deletable}
            legend="Permission Modes"
            options={permissionModeOptions}
            idSelected={permissionModesSelectedId}
            onChange={handlePermissionModeOptionChange}
            buttonSize="m"
            isFullWidth
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          color="danger"
          aria-label="Delete permission setting"
          iconType="trash"
          display="base"
          size="m"
          onClick={handleDelete}
          isDisabled={!deletable}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

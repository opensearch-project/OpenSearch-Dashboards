/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiSuperSelect,
  EuiFieldText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspacePermissionMode } from '../../../../../core/public';
import {
  WorkspacePermissionItemType,
  optionIdToWorkspacePermissionModesMap,
  PERMISSION_TYPE_LABEL_ID,
  PERMISSION_COLLABORATOR_LABEL_ID,
  PERMISSION_ACCESS_LEVEL_LABEL_ID,
  permissionModeOptions,
  typeOptions,
} from './constants';
import { getPermissionModeId } from './utils';

export interface WorkspacePermissionSettingInputProps {
  index: number;
  type: WorkspacePermissionItemType;
  userId?: string;
  group?: string;
  modes?: WorkspacePermissionMode[];
  readOnly?: boolean;
  deletable?: boolean;
  userOrGroupDisabled: boolean;
  onGroupOrUserIdChange: (
    id:
      | { type: WorkspacePermissionItemType.User; userId?: string }
      | { type: WorkspacePermissionItemType.Group; group?: string },
    index: number
  ) => void;
  onPermissionModesChange: (modes: WorkspacePermissionMode[], index: number) => void;
  onTypeChange: (
    type: WorkspacePermissionItemType.User | WorkspacePermissionItemType.Group,
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
  readOnly = false,
  deletable = true,
  userOrGroupDisabled,
  onDelete,
  onGroupOrUserIdChange,
  onPermissionModesChange,
  onTypeChange,
}: WorkspacePermissionSettingInputProps) => {
  const permissionModesSelected = useMemo(
    () => getPermissionModeId(modes ?? []),

    [modes]
  );

  const handleGroupOrUserIdChange = useCallback(
    (event) => {
      const groupOrUserId = event.target.value;
      onGroupOrUserIdChange(
        type === WorkspacePermissionItemType.Group
          ? { type, group: groupOrUserId }
          : { type, userId: groupOrUserId },
        index
      );
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
    <EuiFlexGroup alignItems="center" gutterSize="s">
      <EuiFlexItem style={{ maxWidth: 150 }}>
        {readOnly ? (
          <EuiFieldText
            value={typeOptions.find((option) => option.value === type)?.inputDisplay}
            aria-labelledby={PERMISSION_TYPE_LABEL_ID}
            compressed
            readOnly
          />
        ) : (
          <EuiSuperSelect
            compressed={true}
            placeholder={i18n.translate('workspace.form.permissionSetting.selectType', {
              defaultMessage: 'Select',
            })}
            options={typeOptions}
            valueOfSelected={type}
            onChange={(value) => onTypeChange(value, index)}
            disabled={userOrGroupDisabled}
            readOnly={readOnly}
            data-test-subj="workspace-typeOptions"
            aria-labelledby={PERMISSION_TYPE_LABEL_ID}
          />
        )}
      </EuiFlexItem>
      <EuiFlexItem style={{ maxWidth: 400 }}>
        <EuiFieldText
          compressed={true}
          disabled={userOrGroupDisabled}
          readOnly={readOnly}
          onChange={handleGroupOrUserIdChange}
          value={(type === WorkspacePermissionItemType.User ? userId : group) ?? ''}
          data-test-subj="workspaceFormUserIdOrGroupInput"
          placeholder={
            type === WorkspacePermissionItemType.User
              ? i18n.translate('workspace.form.permissionSetting.selectUser', {
                  defaultMessage: 'Enter user name or user ID',
                })
              : i18n.translate('workspace.form.permissionSetting.selectUserGroup', {
                  defaultMessage: 'Enter group name or group ID',
                })
          }
          aria-labelledby={PERMISSION_COLLABORATOR_LABEL_ID}
        />
      </EuiFlexItem>
      <EuiFlexItem style={{ maxWidth: 150 }}>
        {readOnly ? (
          <EuiFieldText
            value={
              permissionModeOptions.find((option) => option.value === permissionModesSelected)
                ?.inputDisplay
            }
            aria-labelledby={PERMISSION_ACCESS_LEVEL_LABEL_ID}
            compressed
            readOnly
          />
        ) : (
          <EuiSuperSelect
            compressed={true}
            options={permissionModeOptions}
            valueOfSelected={permissionModesSelected}
            onChange={handlePermissionModeOptionChange}
            disabled={userOrGroupDisabled}
            data-test-subj="workspace-permissionModeOptions"
            aria-labelledby={PERMISSION_ACCESS_LEVEL_LABEL_ID}
          />
        )}
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        {deletable && !readOnly && (
          <EuiButtonIcon
            color="danger"
            aria-label="Delete permission setting"
            iconType="trash"
            display="empty"
            size="xs"
            onClick={handleDelete}
            isDisabled={!deletable}
          />
        )}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

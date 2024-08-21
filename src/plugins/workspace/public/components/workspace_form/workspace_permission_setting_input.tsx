/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiComboBox,
  EuiPopover,
  EuiButtonIcon,
  EuiButtonEmpty,
  EuiSelectable,
  EuiComboBoxOptionOption,
  EuiSelectableOption,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspacePermissionMode } from '../../../common/constants';
import {
  WorkspacePermissionItemType,
  optionIdToWorkspacePermissionModesMap,
  PermissionModeId,
} from './constants';
import { getPermissionModeId } from './utils';

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

export interface WorkspacePermissionSettingInputProps {
  index: number;
  type: WorkspacePermissionItemType;
  userId?: string;
  group?: string;
  modes?: WorkspacePermissionMode[];
  isEditing?: boolean;
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
  isEditing = true,
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

  const [isTypeListOpen, setIsTypeListOpen] = useState(false);

  const typeOptions = useMemo<Array<EuiSelectableOption<any>>>(
    () => [
      {
        value: WorkspacePermissionItemType.User,
        label: i18n.translate('workspace.form.permissionSettingPanel.typeOptions.user', {
          defaultMessage: 'User',
        }),
        checked: type === WorkspacePermissionItemType.User ? 'on' : undefined,
      },
      {
        value: WorkspacePermissionItemType.Group,
        label: i18n.translate('workspace.form.permissionSettingPanel.typeOptions.group', {
          defaultMessage: 'Group',
        }),
        checked: type === WorkspacePermissionItemType.Group ? 'on' : undefined,
      },
    ],
    [type]
  );

  const permissionModesSelected = useMemo(() => {
    const idSelected = getPermissionModeId(modes ?? []);
    const permissionModeSelected = permissionModeOptions.find(
      (option) => option.value === idSelected
    );
    return permissionModeSelected ? [permissionModeSelected] : [];
  }, [modes]);

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
    (options: Array<EuiComboBoxOptionOption<any>>) => {
      if (options.length === 0) {
        onGroupOrUserIdChange({ type }, index);
      }
    },
    [index, type, onGroupOrUserIdChange]
  );

  const handlePermissionModeOptionChange = useCallback(
    (option: Array<EuiComboBoxOptionOption<any>>) => {
      if (option.length > 0) {
        const id = option[0].value;
        if (optionIdToWorkspacePermissionModesMap[id]) {
          onPermissionModesChange([...optionIdToWorkspacePermissionModesMap[id]], index);
        }
      }
    },
    [index, onPermissionModesChange]
  );

  const handleTypeChange = useCallback(
    (options: Array<EuiSelectableOption<any>>) => {
      for (const option of options) {
        if (option.checked === 'on') {
          onTypeChange(option.value, index);
          setIsTypeListOpen(false);
          return;
        }
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
          isDisabled={userOrGroupDisabled || !isEditing}
          prepend={
            <EuiPopover
              button={
                <EuiButtonEmpty
                  iconType="arrowDown"
                  iconSide="right"
                  onClick={() => setIsTypeListOpen((current) => !current)}
                  data-test-subj="workspace-typeOptions"
                  isDisabled={userOrGroupDisabled || !isEditing}
                >
                  {type === WorkspacePermissionItemType.User
                    ? typeOptions[0].label
                    : typeOptions[1].label}
                </EuiButtonEmpty>
              }
              isOpen={isTypeListOpen}
              closePopover={() => setIsTypeListOpen(false)}
              panelPaddingSize="none"
            >
              <EuiSelectable
                singleSelection={true}
                options={typeOptions}
                listProps={{
                  bordered: true,
                  rowHeight: 32,
                  onFocusBadge: false,
                }}
                onChange={handleTypeChange}
              >
                {(list) => list}
              </EuiSelectable>
            </EuiPopover>
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
          data-test-subj="workspace-permissionModeOptions"
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        {deletable && isEditing && (
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

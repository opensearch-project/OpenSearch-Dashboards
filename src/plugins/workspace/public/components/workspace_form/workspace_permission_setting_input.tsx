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
} from '@elastic/eui';
import { WorkspacePermissionMode } from '../../../common/constants';
import {
  WorkspacePermissionItemType,
  optionIdToWorkspacePermissionModesMap,
  permissionModeOptions,
} from './constants';
import { getPermissionModeId } from './utils';

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
    <EuiFlexGroup alignItems="center" gutterSize="l">
      <EuiFlexItem>
        <EuiComboBox
          singleSelection
          selectedOptions={groupOrUserIdSelectedOptions}
          onCreateOption={handleGroupOrUserIdCreate}
          onChange={handleGroupOrUserIdChange}
          placeholder="Select"
          style={{ width: 200 }}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonGroup
          type="single"
          isDisabled={!deletable}
          legend="Permission Modes"
          options={permissionModeOptions}
          idSelected={permissionModesSelectedId}
          onChange={handlePermissionModeOptionChange}
        />
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

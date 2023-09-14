/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useRef } from 'react';
import {
  EuiDescribedFormGroup,
  EuiFlexGroup,
  EuiSuperSelect,
  EuiComboBox,
  EuiFlexItem,
  EuiButton,
  EuiButtonIcon,
  EuiButtonGroup,
  EuiFormRow,
} from '@elastic/eui';

import { WorkspacePermissionMode } from '../../../../../core/public';

export type WorkspacePermissionSetting = (
  | { type: 'user'; userId: string }
  | { type: 'group'; group: string }
) & {
  type: 'user' | 'group';
  userId?: string;
  group?: string;
  modes: Array<
    | WorkspacePermissionMode.LibraryRead
    | WorkspacePermissionMode.LibraryWrite
    | WorkspacePermissionMode.Management
  >;
};

const permissionModeOptions = [
  {
    id: WorkspacePermissionMode.LibraryRead,
    label: 'View',
    iconType: 'eye',
  },
  {
    id: WorkspacePermissionMode.LibraryWrite,
    label: 'Edit',
    iconType: 'pencil',
  },
  {
    id: WorkspacePermissionMode.Management,
    label: 'Management',
    iconType: 'visTimelion',
  },
];

const permissionTypeOptions = [
  { value: 'user' as const, inputDisplay: 'User' },
  { value: 'group' as const, inputDisplay: 'Group' },
];

const isWorkspacePermissionMode = (
  test: string
): test is
  | WorkspacePermissionMode.LibraryRead
  | WorkspacePermissionMode.LibraryWrite
  | WorkspacePermissionMode.Management =>
  test === WorkspacePermissionMode.LibraryRead ||
  test === WorkspacePermissionMode.LibraryWrite ||
  test === WorkspacePermissionMode.Management;

interface WorkspacePermissionSettingInputProps {
  index: number;
  deletable: boolean;
  type?: 'user' | 'group';
  userId?: string;
  group?: string;
  modes?: Array<
    | WorkspacePermissionMode.LibraryRead
    | WorkspacePermissionMode.LibraryWrite
    | WorkspacePermissionMode.Management
  >;
  onTypeChange: (type: 'user' | 'group', index: number) => void;
  onGroupOrUserIdChange: (
    groupOrUserId:
      | { type: 'user'; userId: string }
      | { type: 'group'; group: string }
      | { type: 'user' | 'group' },
    index: number
  ) => void;
  onPermissionModesChange: (
    WorkspacePermissionMode: Array<
      | WorkspacePermissionMode.LibraryRead
      | WorkspacePermissionMode.LibraryWrite
      | WorkspacePermissionMode.Management
    >,
    index: number
  ) => void;
  onDelete: (index: number) => void;
}

const WorkspacePermissionSettingInput = ({
  index,
  deletable,
  type,
  userId,
  group,
  modes,
  onDelete,
  onTypeChange,
  onGroupOrUserIdChange,
  onPermissionModesChange,
}: WorkspacePermissionSettingInputProps) => {
  const groupOrUserIdSelectedOptions = useMemo(
    () => (group || userId ? [{ label: (group || userId) as string }] : []),
    [group, userId]
  );
  const permissionModesIdToSelectMap = useMemo(
    () => ({
      [WorkspacePermissionMode.LibraryRead]: !!modes?.includes(WorkspacePermissionMode.LibraryRead),
      [WorkspacePermissionMode.LibraryWrite]: !!modes?.includes(
        WorkspacePermissionMode.LibraryWrite
      ),
      [WorkspacePermissionMode.Management]: !!modes?.includes(WorkspacePermissionMode.Management),
    }),
    [modes]
  );

  const handleTypeChange = useCallback(
    (newType: 'user' | 'group') => {
      onTypeChange(newType, index);
    },
    [onTypeChange, index]
  );

  const handleGroupOrUserIdCreate = useCallback(
    (groupOrUserId) => {
      if (!type) {
        return;
      }
      onGroupOrUserIdChange(
        type === 'group' ? { type, group: groupOrUserId } : { type, userId: groupOrUserId },
        index
      );
    },
    [index, type, onGroupOrUserIdChange]
  );

  const handleGroupOrUserIdChange = useCallback(
    (options) => {
      if (!type) {
        return;
      }
      if (options.length === 0) {
        onGroupOrUserIdChange({ type }, index);
      }
    },
    [index, type, onGroupOrUserIdChange]
  );

  const handlePermissionStateChange = useCallback(
    (id: string) => {
      if (isWorkspacePermissionMode(id)) {
        onPermissionModesChange(
          modes?.includes(id) ? modes.filter((value) => value !== id) : [...(modes ?? []), id],
          index
        );
      }
    },
    [index, modes, onPermissionModesChange]
  );

  const handleDelete = useCallback(() => {
    onDelete(index);
  }, [index, onDelete]);

  return (
    <EuiFlexGroup alignItems="center" gutterSize="xs">
      <EuiFlexItem grow={false}>
        <EuiSuperSelect
          options={permissionTypeOptions}
          valueOfSelected={type}
          onChange={handleTypeChange}
          placeholder="User Type"
          style={{ width: 100 }}
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiComboBox
          isDisabled={!type}
          singleSelection
          selectedOptions={groupOrUserIdSelectedOptions}
          onCreateOption={handleGroupOrUserIdCreate}
          onChange={handleGroupOrUserIdChange}
          placeholder="Select"
          fullWidth
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonGroup
          legend="Permission Modes"
          type="multi"
          options={permissionModeOptions}
          onChange={handlePermissionStateChange}
          isIconOnly
          idToSelectedMap={permissionModesIdToSelectMap}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          aria-label="Delete permission setting"
          iconType="trash"
          onClick={handleDelete}
          isDisabled={!deletable}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

interface WorkspacePermissionSettingPanelProps {
  errors?: string[];
  value?: Array<Partial<WorkspacePermissionSetting>>;
  onChange?: (value: Array<Partial<WorkspacePermissionSetting>>) => void;
  firstRowDeletable?: boolean;
}

export const WorkspacePermissionSettingPanel = ({
  errors,
  value,
  onChange,
  firstRowDeletable,
}: WorkspacePermissionSettingPanelProps) => {
  const valueRef = useRef(value);
  valueRef.current = value;

  const handleAddNewOne = useCallback(() => {
    onChange?.([...(valueRef.current ?? []), {}]);
  }, [onChange]);

  const handleDelete = useCallback(
    (index: number) => {
      onChange?.((valueRef.current ?? []).filter((_item, itemIndex) => itemIndex !== index));
    },
    [onChange]
  );

  const handlePermissionModesChange = useCallback<
    WorkspacePermissionSettingInputProps['onPermissionModesChange']
  >(
    (modes, index) => {
      onChange?.(
        (valueRef.current ?? []).map((item, itemIndex) =>
          index === itemIndex ? { ...item, modes } : item
        )
      );
    },
    [onChange]
  );

  const handleTypeChange = useCallback<WorkspacePermissionSettingInputProps['onTypeChange']>(
    (type, index) => {
      onChange?.(
        (valueRef.current ?? []).map((item, itemIndex) =>
          index === itemIndex ? { ...item, type } : item
        )
      );
    },
    [onChange]
  );

  const handleGroupOrUserIdChange = useCallback<
    WorkspacePermissionSettingInputProps['onGroupOrUserIdChange']
  >(
    (userOrGroupIdWithType, index) => {
      onChange?.(
        (valueRef.current ?? []).map((item, itemIndex) =>
          index === itemIndex
            ? { ...userOrGroupIdWithType, ...(item.modes ? { modes: item.modes } : {}) }
            : item
        )
      );
    },
    [onChange]
  );

  return (
    <EuiDescribedFormGroup title={<h3>Users, User Groups & Groups</h3>}>
      {value?.map((item, index) => (
        <React.Fragment key={index}>
          <EuiFormRow isInvalid={!!errors?.[index]} error={errors?.[index]}>
            <WorkspacePermissionSettingInput
              {...item}
              index={index}
              deletable={firstRowDeletable || index !== 0}
              onDelete={handleDelete}
              onTypeChange={handleTypeChange}
              onGroupOrUserIdChange={handleGroupOrUserIdChange}
              onPermissionModesChange={handlePermissionModesChange}
            />
          </EuiFormRow>
        </React.Fragment>
      ))}
      <EuiButton onClick={handleAddNewOne} fullWidth={false}>
        Add new
      </EuiButton>
    </EuiDescribedFormGroup>
  );
};

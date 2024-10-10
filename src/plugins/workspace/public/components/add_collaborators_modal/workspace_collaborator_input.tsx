/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiFieldText,
  EuiButtonGroup,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspaceCollaboratorAccessLevel } from '../../types';
import { WORKSPACE_ACCESS_LEVEL_NAMES } from '../../constants';

export const COLLABORATOR_ID_INPUT_LABEL_ID = 'collaborator_id_input_label';

export interface WorkspaceCollaboratorInputProps {
  index: number;
  error?: string;
  collaboratorId?: string;
  accessLevel: WorkspaceCollaboratorAccessLevel;
  collaboratorIdInputPlaceholder?: string;
  onCollaboratorIdChange: (id: string, index: number) => void;
  onAccessLevelChange: (accessLevel: WorkspaceCollaboratorAccessLevel, index: number) => void;
  onDelete: (index: number) => void;
}

const accessLevelKeys = Object.keys(
  WORKSPACE_ACCESS_LEVEL_NAMES
) as WorkspaceCollaboratorAccessLevel[];

const accessLevelButtonGroupOptions = accessLevelKeys.map((id) => ({
  id,
  label: <EuiText size="xs">{WORKSPACE_ACCESS_LEVEL_NAMES[id]}</EuiText>,
}));

const isAccessLevelKey = (test: string): test is WorkspaceCollaboratorAccessLevel =>
  (accessLevelKeys as string[]).includes(test);

export const WorkspaceCollaboratorInput = ({
  index,
  error,
  accessLevel,
  collaboratorId,
  onDelete,
  onAccessLevelChange,
  onCollaboratorIdChange,
  collaboratorIdInputPlaceholder,
}: WorkspaceCollaboratorInputProps) => {
  const handleCollaboratorIdChange = useCallback(
    (e) => {
      onCollaboratorIdChange(e.target.value, index);
    },
    [index, onCollaboratorIdChange]
  );

  const handlePermissionModeOptionChange = useCallback(
    (newAccessLevel: string) => {
      if (isAccessLevelKey(newAccessLevel)) {
        onAccessLevelChange(newAccessLevel, index);
      }
    },
    [index, onAccessLevelChange]
  );

  const handleDelete = useCallback(() => {
    onDelete(index);
  }, [index, onDelete]);

  return (
    <EuiFlexGroup alignItems="center" gutterSize="s">
      <EuiFlexItem>
        <EuiFieldText
          compressed={true}
          onChange={handleCollaboratorIdChange}
          value={collaboratorId}
          data-test-subj={`workspaceCollaboratorIdInput-${index}`}
          placeholder={collaboratorIdInputPlaceholder}
          aria-labelledby={COLLABORATOR_ID_INPUT_LABEL_ID}
          isInvalid={!!error}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonGroup
          options={accessLevelButtonGroupOptions}
          legend={i18n.translate('workspace.form.permissionSettingInput.accessLevelLegend', {
            defaultMessage: 'This is a access level button group',
          })}
          buttonSize="compressed"
          type="single"
          idSelected={accessLevel}
          onChange={handlePermissionModeOptionChange}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          color="danger"
          aria-label={`Delete collaborator ${index}`}
          iconType="trash"
          display="empty"
          size="xs"
          onClick={handleDelete}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

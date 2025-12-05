/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiSmallButton,
  EuiCompressedFormRow,
  EuiFormLabel,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';
import { WorkspaceCollaborator, WorkspaceCollaboratorAccessLevel } from '../../types';
import {
  WorkspaceCollaboratorInput,
  COLLABORATOR_ID_INPUT_LABEL_ID,
} from './workspace_collaborator_input';

export interface WorkspaceCollaboratorInner
  extends Pick<WorkspaceCollaborator, 'collaboratorId' | 'accessLevel'> {
  id: number;
}

export interface WorkspaceCollaboratorsPanelProps {
  label: string;
  errors?: { [key: number]: string };
  description?: string;
  collaborators: WorkspaceCollaboratorInner[];
  onChange: (value: WorkspaceCollaboratorInner[]) => void;
  collaboratorIdInputPlaceholder?: string;
  addAnotherButtonLabel: string;
}

export const WorkspaceCollaboratorsPanel = ({
  label,
  errors,
  description,
  collaborators,
  addAnotherButtonLabel,
  collaboratorIdInputPlaceholder,
  onChange,
}: WorkspaceCollaboratorsPanelProps) => {
  const handleAddNewOne = () => {
    const nextId = Math.max(...[0, ...collaborators.map(({ id }) => id)]) + 1;
    onChange([
      ...collaborators,
      {
        id: nextId,
        accessLevel: 'readOnly',
        collaboratorId: '',
      },
    ]);
  };

  const handleCollaboratorIdChange = (collaboratorId: string, passedIndex: number) => {
    onChange([
      ...collaborators.map((collaborator, index) =>
        index === passedIndex ? { ...collaborator, collaboratorId } : collaborator
      ),
    ]);
  };

  const handleAccessLevelChange = (
    accessLevel: WorkspaceCollaboratorAccessLevel,
    passedIndex: number
  ) => {
    onChange([
      ...collaborators.map((collaborator, index) =>
        index === passedIndex ? { ...collaborator, accessLevel } : collaborator
      ),
    ]);
  };

  const handleDelete = (index: number) => {
    onChange([...collaborators.slice(0, index), ...collaborators.slice(index + 1)]);
  };

  return (
    <>
      {collaborators.length > 0 && (
        <>
          <EuiFormLabel id={COLLABORATOR_ID_INPUT_LABEL_ID}>{label}</EuiFormLabel>
          <EuiSpacer size="xs" />
          {description && (
            <>
              <EuiText color="subdued" size="xs">
                {description}
              </EuiText>
              <EuiSpacer size="xs" />
            </>
          )}
        </>
      )}
      {collaborators.map((item, index) => (
        <EuiCompressedFormRow
          key={item.id}
          fullWidth
          error={errors?.[item.id]}
          isInvalid={!!errors?.[item.id]}
        >
          <WorkspaceCollaboratorInput
            index={index}
            accessLevel={item.accessLevel}
            collaboratorId={item.collaboratorId}
            onCollaboratorIdChange={handleCollaboratorIdChange}
            onAccessLevelChange={handleAccessLevelChange}
            onDelete={handleDelete}
            collaboratorIdInputPlaceholder={collaboratorIdInputPlaceholder}
            error={errors?.[item.id]}
          />
        </EuiCompressedFormRow>
      ))}
      <EuiCompressedFormRow fullWidth>
        <EuiSmallButton
          fullWidth={false}
          onClick={handleAddNewOne}
          data-test-subj={`workspaceForm-permissionSettingPanel-addNew`}
          color="primary"
          iconType="plusInCircle"
        >
          {addAnotherButtonLabel}
        </EuiSmallButton>
      </EuiCompressedFormRow>
    </>
  );
};

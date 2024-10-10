/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiAccordion,
  EuiHorizontalRule,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React, { useState } from 'react';
import { i18n } from '@osd/i18n';

import { WorkspaceCollaboratorPermissionType, WorkspaceCollaborator } from '../../types';
import {
  WorkspaceCollaboratorsPanel,
  WorkspaceCollaboratorInner,
} from './workspace_collaborators_panel';
import { DuplicateCollaboratorError } from './duplicate_collaborator_error';

const DUPLICATE_COLLABORATOR_ERROR_MESSAGE = i18n.translate(
  'workspace.addCollaboratorsModal.errors.duplicateCollaborator',
  {
    defaultMessage: 'A collaborator with this ID already exists.',
  }
);

const generateDuplicateCollaboratorErrors = (duplicateIds: number[]) =>
  duplicateIds.reduce<{ [key: number]: string }>(
    (previousValue, id) => ({
      ...previousValue,
      [id]: DUPLICATE_COLLABORATOR_ERROR_MESSAGE,
    }),
    {}
  );

export interface AddCollaboratorsModalProps {
  title: string;
  description?: string;
  inputLabel: string;
  addAnotherButtonLabel: string;
  inputDescription?: string;
  inputPlaceholder?: string;
  instruction?: {
    title: string;
    detail: string;
    link?: string;
  };
  permissionType: WorkspaceCollaboratorPermissionType;
  onClose: () => void;
  onAddCollaborators: (collaborators: WorkspaceCollaborator[]) => Promise<void>;
}

export const AddCollaboratorsModal = ({
  title,
  inputLabel,
  instruction,
  description,
  permissionType,
  inputDescription,
  inputPlaceholder,
  addAnotherButtonLabel,
  onClose,
  onAddCollaborators,
}: AddCollaboratorsModalProps) => {
  const [collaborators, setCollaborators] = useState<WorkspaceCollaboratorInner[]>([
    { id: 0, accessLevel: 'readOnly', collaboratorId: '' },
  ]);
  const [errors, setErrors] = useState<{ [key: number]: string }>({});

  const validInnerCollaborators = collaborators.flatMap((collaborator) => {
    if (!collaborator.collaboratorId) {
      return [];
    }
    return collaborator;
  });

  const handleAddCollaborators = async () => {
    const collaboratorId2IdsMap = validInnerCollaborators.reduce<{
      [key: string]: number[];
    }>((previousValue, collaborator) => {
      const key = collaborator.collaboratorId;
      const existingIds = previousValue[key];

      if (!existingIds) {
        return {
          ...previousValue,
          [key]: [collaborator.id],
        };
      }
      existingIds.push(collaborator.id);
      return previousValue;
    }, {});
    const duplicateIds = Object.keys(collaboratorId2IdsMap).flatMap((key) => {
      if (collaboratorId2IdsMap[key].length === 1) {
        return [];
      }
      return collaboratorId2IdsMap[key].slice(1);
    });
    setErrors(generateDuplicateCollaboratorErrors(duplicateIds));
    if (duplicateIds.length > 0) {
      return;
    }
    try {
      await onAddCollaborators(
        validInnerCollaborators.map(({ id, ...collaborator }) => ({
          ...collaborator,
          permissionType,
        }))
      );
    } catch (e) {
      if (e instanceof DuplicateCollaboratorError) {
        setErrors(
          generateDuplicateCollaboratorErrors(
            e.duplicateCollaboratorIds.flatMap(
              (collaboratorId) => collaboratorId2IdsMap[collaboratorId] ?? []
            )
          )
        );
        return;
      }
    }
  };

  return (
    <EuiModal style={{ minWidth: 748 }} onClose={onClose}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h2>{title}</h2>
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        {description && (
          <>
            <EuiText size="xs">{description}</EuiText>
            <EuiSpacer size="m" />
          </>
        )}
        {instruction && (
          <>
            <EuiAccordion
              id="workspace-details-add-collaborator-modal-instruction"
              buttonContent={<EuiText size="s">{instruction.title}</EuiText>}
            >
              <EuiSpacer size="xs" />
              <EuiSpacer size="s" />
              <EuiText size="xs">{instruction.detail}</EuiText>
            </EuiAccordion>
            <EuiHorizontalRule margin="xs" />
            <EuiSpacer size="s" />
          </>
        )}
        <WorkspaceCollaboratorsPanel
          collaborators={collaborators}
          onChange={setCollaborators}
          label={inputLabel}
          description={inputDescription}
          collaboratorIdInputPlaceholder={inputPlaceholder}
          addAnotherButtonLabel={addAnotherButtonLabel}
          errors={errors}
        />
      </EuiModalBody>

      <EuiModalFooter>
        <EuiSmallButtonEmpty iconType="cross" onClick={onClose}>
          {i18n.translate('workspace.addCollaboratorsModal.cancelButton', {
            defaultMessage: 'Cancel',
          })}
        </EuiSmallButtonEmpty>
        <EuiSmallButton
          disabled={validInnerCollaborators.length === 0}
          type="submit"
          onClick={handleAddCollaborators}
          fill
        >
          {i18n.translate('workspace.addCollaboratorsModal.addCollaboratorsButton', {
            defaultMessage: 'Add collaborators',
          })}
        </EuiSmallButton>
      </EuiModalFooter>
    </EuiModal>
  );
};

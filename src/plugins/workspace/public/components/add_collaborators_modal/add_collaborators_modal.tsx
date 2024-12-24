/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiAccordion,
  EuiHorizontalRule,
  EuiLink,
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

const DUPLICATE_COLLABORATOR_WITH_LIST_ERROR_MESSAGE = i18n.translate(
  'workspace.addCollaboratorsModal.errors.duplicateCollaboratorWithList',
  {
    defaultMessage: 'This ID is already added to the list.',
  }
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
    detail: React.ReactNode;
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
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCollaborators = async () => {
    const singleStarIds = validInnerCollaborators.flatMap(({ id, collaboratorId }) =>
      collaboratorId.trim() === '*' ? id : []
    );
    if (singleStarIds.length > 0) {
      setErrors(
        singleStarIds.reduce(
          (previousErrors, id) => ({
            ...previousErrors,
            [id]: i18n.translate('workspace.addCollaboratorsModal.errors.invalidUserFormat', {
              defaultMessage: 'Invalid {inputLabel} format',
              values: {
                inputLabel,
              },
            }),
          }),
          {}
        )
      );
      return;
    }
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
    setErrors({});
    setIsAdding(true);
    try {
      await onAddCollaborators(
        validInnerCollaborators.map(({ id, ...collaborator }) => ({
          ...collaborator,
          permissionType,
        }))
      );
    } catch (error) {
      if (error instanceof DuplicateCollaboratorError) {
        const newErrors: { [key: number]: string } = {};
        error.details.pendingAdded.forEach((collaboratorId) => {
          collaboratorId2IdsMap[collaboratorId].slice(1).forEach((id) => {
            newErrors[id] = DUPLICATE_COLLABORATOR_ERROR_MESSAGE;
          });
        });
        error.details.existing.forEach((collaboratorId) => {
          collaboratorId2IdsMap[collaboratorId].forEach((id) => {
            newErrors[id] = DUPLICATE_COLLABORATOR_WITH_LIST_ERROR_MESSAGE;
          });
        });
        setErrors(newErrors);
        return;
      }
    } finally {
      setIsAdding(false);
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
              {instruction.link && (
                <>
                  <EuiSpacer size="xs" />
                  <EuiLink href={instruction.link} target="_blank" external>
                    {i18n.translate(
                      'workspace.addCollaboratorsModal.instruction.learnMoreLinkText',
                      {
                        defaultMessage: 'Learn more in Documentation',
                      }
                    )}
                  </EuiLink>
                </>
              )}
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
          isDisabled={isAdding}
          isLoading={isAdding}
        >
          {i18n.translate('workspace.addCollaboratorsModal.addCollaboratorsButton', {
            defaultMessage: 'Add collaborators',
          })}
        </EuiSmallButton>
      </EuiModalFooter>
    </EuiModal>
  );
};

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
  const validCollaborators = collaborators.flatMap(({ collaboratorId, accessLevel }) => {
    if (!collaboratorId) {
      return [];
    }
    return { collaboratorId, accessLevel, permissionType };
  });

  const handleAddCollaborators = () => {
    onAddCollaborators(validCollaborators);
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
        />
      </EuiModalBody>

      <EuiModalFooter>
        <EuiSmallButtonEmpty iconType="cross" onClick={onClose}>
          {i18n.translate('workspace.addCollaboratorsModal.cancelButton', {
            defaultMessage: 'Cancel',
          })}
        </EuiSmallButtonEmpty>
        <EuiSmallButton
          disabled={validCollaborators.length === 0}
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

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  EuiCheckableCard,
  EuiCheckbox,
  EuiCompressedFormRow,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  privacyTypeEditDescription,
  privacyTypeEditTitle,
  privacyTypePrivateDescription,
  privacyTypePrivateTitle,
  privacyTypeViewDescription,
  privacyTypeViewTitle,
  WorkspacePrivacyItemType,
} from './constants';
import './workspace_privacy_setting.scss';

export interface WorkspacePrivacySettingProps {
  privacyType: WorkspacePrivacyItemType;
  onPrivacyTypeChange: (newPrivacyType: WorkspacePrivacyItemType) => void;
  goToCollaborators: boolean;
  onGoToCollaboratorsChange: (value: boolean) => void;
}

export const WorkspacePrivacySettingPanel = ({
  privacyType,
  onPrivacyTypeChange,
  goToCollaborators,
  onGoToCollaboratorsChange,
}: WorkspacePrivacySettingProps) => {
  const options = [
    {
      id: WorkspacePrivacyItemType.PrivateToCollaborators,
      label: privacyTypePrivateTitle,
      description: privacyTypePrivateDescription,
    },
    {
      id: WorkspacePrivacyItemType.AnyoneCanView,
      label: privacyTypeViewTitle,
      description: privacyTypeViewDescription,
    },
    {
      id: WorkspacePrivacyItemType.AnyoneCanEdit,
      label: privacyTypeEditTitle,
      description: privacyTypeEditDescription,
    },
  ];

  return (
    <EuiPanel>
      <EuiText size="s">
        <h2>
          {i18n.translate('workspace.form.panels.privacy.title', {
            defaultMessage: 'Set up privacy',
          })}
        </h2>
      </EuiText>
      <EuiText size="xs">
        {i18n.translate('workspace.form.panels.privacy.description', {
          defaultMessage: 'Who has access to the workspace',
        })}
      </EuiText>
      <EuiSpacer size="m" />
      <EuiCompressedFormRow
        label={i18n.translate('workspace.form.privacy.name.label', {
          defaultMessage: 'Workspace privacy',
        })}
        // isInvalid={!!formErrors.features}
        // error={formErrors.features?.message}
        fullWidth
      >
        <EuiFlexGroup gutterSize="s">
          {options.map(({ id, label, description }) => (
            <EuiFlexItem key={id}>
              <EuiCheckableCard
                className="workspace-privacy-setting-item"
                id={id}
                label={
                  <EuiText size="s">
                    <h4>{label}</h4>
                  </EuiText>
                }
                onChange={() => onPrivacyTypeChange(id)}
                checked={privacyType === id}
              >
                <EuiText size="xs">{description}</EuiText>
              </EuiCheckableCard>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      </EuiCompressedFormRow>
      <EuiSpacer size="m" />
      <EuiText size="s">
        {i18n.translate('workspace.form.panels.privacy.jumpToCollaborators.description', {
          defaultMessage: 'You can assign workspace administrators once the workspace is created.',
        })}
      </EuiText>
      <EuiSpacer size="m" />
      <EuiCheckbox
        id="jump_to_collaborators_checkbox"
        checked={goToCollaborators}
        onChange={(event) => onGoToCollaboratorsChange(event.target.checked)}
        label={i18n.translate('workspace.form.panels.privacy.jumpToCollaborators.label', {
          defaultMessage: 'Go to configure the collaborators right after creating the workspace.',
        })}
      />
    </EuiPanel>
  );
};

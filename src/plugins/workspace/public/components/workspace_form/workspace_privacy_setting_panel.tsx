/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiCheckableCard,
  EuiCheckbox,
  EuiCompressedFormRow,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
  htmlIdGenerator,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { privacyType2CopyMap, WorkspacePrivacyItemType, workspacePrivacyTitle } from './constants';
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
    WorkspacePrivacyItemType.PrivateToCollaborators,
    WorkspacePrivacyItemType.AnyoneCanView,
    WorkspacePrivacyItemType.AnyoneCanEdit,
  ].map((value) => ({
    id: value,
    label: privacyType2CopyMap[value].title,
    description: privacyType2CopyMap[value].description,
  }));

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
      <EuiCompressedFormRow label={workspacePrivacyTitle} fullWidth>
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
        id={htmlIdGenerator()()}
        checked={goToCollaborators}
        onChange={(event) => onGoToCollaboratorsChange(event.target.checked)}
        label={i18n.translate('workspace.form.panels.privacy.jumpToCollaborators.label', {
          defaultMessage: 'Go to configure the collaborators right after creating the workspace.',
        })}
        data-test-subj="jumpToCollaboratorsCheckbox"
      />
    </EuiPanel>
  );
};

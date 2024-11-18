/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiCheckableCard,
  EuiCompressedFormRow,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspacePrivacyItemType } from './constants';

export interface WorkspacePrivacySettingProps {
  onPrivacyTypeChange: (newValue: WorkspacePrivacyItemType) => void;
  currentPrivacyType: string;
}

export const WorkspacePrivacySettingPanel = ({
  onPrivacyTypeChange,
  currentPrivacyType,
}: WorkspacePrivacySettingProps) => {
  const options = [
    {
      id: WorkspacePrivacyItemType.PrivateToCollaborators,
      label: i18n.translate('workspace.privacy.privateToCollaborators.title', {
        defaultMessage: 'Private to collaborators',
      }),
    },
    {
      id: WorkspacePrivacyItemType.AnyoneCanView,
      label: i18n.translate('workspace.privacy.anyoneCanView.title', {
        defaultMessage: 'Anyone can view',
      }),
    },
    {
      id: WorkspacePrivacyItemType.AnyoneCanEdit,
      label: i18n.translate('workspace.privacy.anyoneCanEdit.title', {
        defaultMessage: 'Anyone can edit',
      }),
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
        label={i18n.translate('workspace.form.workspaceUseCase.name.label', {
          defaultMessage: 'Select use case',
        })}
        // isInvalid={!!formErrors.features}
        // error={formErrors.features?.message}
        fullWidth
      >
        <EuiFlexGroup gutterSize="s">
          {options.map(({ id, label }) => (
            <EuiFlexItem key={id}>
              <EuiCheckableCard
                id={id}
                label={
                  <EuiText size="s">
                    <h4>{label}</h4>
                  </EuiText>
                }
                onChange={() => onPrivacyTypeChange(id)}
                checked={currentPrivacyType === id}
              />
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      </EuiCompressedFormRow>
    </EuiPanel>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiSpacer, EuiSuperSelect, EuiText } from '@elastic/eui';
import { privacyType2CopyMap, WorkspacePrivacyItemType } from './constants';

export interface WorkspacePrivacySettingSelectProps {
  selectedPrivacyType: WorkspacePrivacyItemType;
  onSelectedPrivacyTypeChange: (newType: WorkspacePrivacyItemType) => void;
}

export const WorkspacePrivacySettingSelect = ({
  selectedPrivacyType,
  onSelectedPrivacyTypeChange,
}: WorkspacePrivacySettingSelectProps) => {
  const options = [
    WorkspacePrivacyItemType.PrivateToCollaborators,
    WorkspacePrivacyItemType.AnyoneCanView,
    WorkspacePrivacyItemType.AnyoneCanEdit,
  ].map((value) => ({
    value,
    inputDisplay: privacyType2CopyMap[value].title,
    dropdownDisplay: (
      <>
        <EuiText>{privacyType2CopyMap[value].title}</EuiText>
        <EuiSpacer size="xs" />
        <EuiText size="xs" color="subdued">
          {privacyType2CopyMap[value].description}
        </EuiText>
      </>
    ),
  }));
  return (
    <>
      <EuiFormRow
        label={i18n.translate('workspace.form.collaborators.panels.privacy.modal.label', {
          defaultMessage: 'Workspace Privacy',
        })}
      >
        <EuiSuperSelect
          compressed
          hasDividers
          options={options}
          valueOfSelected={selectedPrivacyType}
          onChange={(value) => onSelectedPrivacyTypeChange(value)}
        />
      </EuiFormRow>
      <EuiText size="xs" color="subdued" style={{ paddingLeft: '2px' }}>
        {privacyType2CopyMap[selectedPrivacyType].description}
      </EuiText>
    </>
  );
};

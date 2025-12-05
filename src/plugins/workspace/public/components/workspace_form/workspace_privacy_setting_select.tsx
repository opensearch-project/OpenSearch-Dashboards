/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCompressedSuperSelect, EuiFormRow, EuiSpacer, EuiText } from '@elastic/eui';
import { privacyType2TextMap, WorkspacePrivacyItemType, workspacePrivacyTitle } from './constants';

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
    inputDisplay: privacyType2TextMap[value].title,
    dropdownDisplay: (
      <>
        <EuiText>{privacyType2TextMap[value].title}</EuiText>
        <EuiSpacer size="xs" />
        <EuiText size="xs" color="subdued">
          {privacyType2TextMap[value].description}
        </EuiText>
      </>
    ),
  }));
  return (
    <>
      <EuiFormRow label={workspacePrivacyTitle}>
        <EuiCompressedSuperSelect
          compressed
          hasDividers
          options={options}
          valueOfSelected={selectedPrivacyType}
          onChange={(value) => onSelectedPrivacyTypeChange(value)}
          data-test-subj="workspacePrivacySettingSelector"
        />
      </EuiFormRow>
      <EuiText size="xs" color="subdued">
        {privacyType2TextMap[selectedPrivacyType].description}
      </EuiText>
    </>
  );
};

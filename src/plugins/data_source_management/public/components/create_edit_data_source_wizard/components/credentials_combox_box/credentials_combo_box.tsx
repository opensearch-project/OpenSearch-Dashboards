/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { EuiComboBox, EuiComboBoxOptionOption } from '@elastic/eui';
import { CredentialsComboBoxItem } from '../../../../types';

interface CredentialsComboBoxProps {
  isInvalid: boolean;
  selectedCredentials: CredentialsComboBoxItem[];
  availableCredentials: CredentialsComboBoxItem[];
  setSelectedCredentials: (selectedOptions: CredentialsComboBoxItem[]) => void;
}

export const CredentialsComboBox: React.FunctionComponent<CredentialsComboBoxProps> = ({
  isInvalid,
  availableCredentials,
  selectedCredentials,
  setSelectedCredentials,
}: CredentialsComboBoxProps) => {
  const onOptionsChanged = (options: EuiComboBoxOptionOption[]) => {
    const opts = new Set();
    const selectedCredentialsOptions: CredentialsComboBoxItem[] = [];
    if (options?.length) {
      options.forEach((rec) => {
        opts.add(rec.id);
      });

      availableCredentials.forEach((cred: CredentialsComboBoxItem) => {
        if (opts.has(cred.id)) {
          selectedCredentialsOptions.push(cred);
        }
      });
    }
    setSelectedCredentials(selectedCredentialsOptions);
  };

  return (
    <EuiComboBox
      aria-label="Search for Stored Credential"
      placeholder="Search for Stored Credential"
      key="id"
      options={availableCredentials}
      singleSelection={true}
      selectedOptions={selectedCredentials}
      onChange={(options: EuiComboBoxOptionOption[]) => onOptionsChanged(options)}
      isClearable={true}
      isInvalid={isInvalid}
    />
  );
};

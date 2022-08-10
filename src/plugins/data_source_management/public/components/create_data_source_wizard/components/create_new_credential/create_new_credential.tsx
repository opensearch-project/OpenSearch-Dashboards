/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiDescribedFormGroup,
  EuiFieldPassword,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiSelect,
} from '@elastic/eui';

import './create_new_credential.scss';

export const CreateNewCredential = () => {
  const [credentialName, setCredentialName] = useState('');
  const [credentialType, setCredentialType] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [dual, setDual] = useState(true); // gives user an option to make password visible

  const options = [
    { value: 'username_password_credential', text: 'Username and Password Credential' },
    { value: 'no_auth', text: 'No Auth' },
  ];

  return (
    <EuiForm component="form">
      <EuiDescribedFormGroup
        className="datasource-create-new-credential-row-reverse"
        title={<> </>}
      >
        <EuiFormRow helpText="Name of the credential as displayed in Stack Management">
          <EuiFieldText
            placeholder="Name"
            value={credentialName || ''}
            onChange={(e) => setCredentialName(e.target.value)}
          />
        </EuiFormRow>
      </EuiDescribedFormGroup>
      <EuiDescribedFormGroup
        className="datasource-create-new-credential-row-reverse"
        title={<> </>}
        description={
          <div>
            <ul>
              <li>
                For <b>username_password_credential</b> type: this type can be used for credentials
                in format of username, password. Ex: OpenSearch basic auth
              </li>
            </ul>
            <ul>
              <li>
                For <b>aws_iam_credential</b> type: this type can only be used for aws iam
                credential, with aws_access_key_id, aws_secret_access_key, and region (optional)
              </li>
            </ul>
          </div>
        }
      >
        <EuiFormRow>
          <EuiSelect onChange={(e) => setCredentialType(e.target.value)} options={options} />
        </EuiFormRow>
        <EuiFormRow>
          <EuiFieldText
            placeholder="User Name"
            value={userName || ''}
            onChange={(e) => setUserName(e.target.value)}
          />
        </EuiFormRow>
        <EuiFormRow>
          <EuiFieldPassword
            placeholder="Password"
            value={password || ''}
            type={dual ? 'dual' : undefined}
            onChange={(e) => setPassword(e.target.value)}
          />
        </EuiFormRow>
      </EuiDescribedFormGroup>
    </EuiForm>
  );
};

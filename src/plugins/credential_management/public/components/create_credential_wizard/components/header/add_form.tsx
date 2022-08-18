/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { FormattedMessage } from '@osd/i18n/react';

import {
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiSelect,
  EuiLink,
  EuiButton,
  EuiFieldPassword,
  EuiText,
} from '@elastic/eui';
import { Credential } from '../../../../../../data_source/public';
export class AddForm extends Component<any, any> {
  state: any = {
    showErrors: false,
    nameShowErrors: false,
    errors: [],
    toasts: [],
    credentialName: '',
    description: '',
    credentialMaterialsType: Credential.CredentialMaterialsType.UsernamePasswordType,
    userName: '',
    password: '',
    dual: true,
  };

  createCredential = async () => {
    const { allList }: any = this.props;

    const { credentialName, description, credentialMaterialsType, userName, password } = this.state;

    const validationByField: any = [];
    if (!credentialName) {
      validationByField.push('Title should not be empty');
    }
    if (allList.find((item: any) => item.title === credentialName)) {
      validationByField.push('This title is already in use');
    }
    if (!description) {
      validationByField.push('Description should not be empty');
    }

    if (
      !userName &&
      credentialMaterialsType === Credential.CredentialMaterialsType.UsernamePasswordType
    ) {
      validationByField.push('User name field should not be empty');
      this.setState({ nameShowErrors: true });
    }
    if (
      !password &&
      credentialMaterialsType === Credential.CredentialMaterialsType.UsernamePasswordType
    ) {
      validationByField.push('Password field should not be empty');
      this.setState({ nameShowErrors: true });
    }

    if (credentialMaterialsType === 'no_auth') {
      this.setState({ nameShowErrors: false });
    }

    if (validationByField.length) {
      this.setState({ showErrors: true, errors: validationByField });
      return;
    }

    this.setState({ showErrors: false, errors: [] });
    this.props.onLoading();
    const { savedObjects }: any = this.props;

    try {
      await savedObjects.client.create('credential', {
        title: this.state.credentialName,
        description: this.state.description,
        credentialMaterials: {
          credentialMaterialsType: this.state.credentialMaterialsType,
          credentialMaterialsContent: {
            username: this.state.userName,
            password: this.state.password,
          },
        },
      });
      this.props.onHispush();
    } catch (e) {
      const createCredentialFailMsg = (
        <FormattedMessage
          id="credentialManagement.createCredential.loadCreateCredentialFailMsg"
          defaultMessage="The credential saved object creation failed with some errors. Please configure data_source.enabled and try it again."
        />
      );
      this.setState((prevState: any) => ({
        toasts: prevState.toasts.concat([
          {
            title: createCredentialFailMsg,
            id: createCredentialFailMsg.props.id,
            color: 'warning',
            iconType: 'alert',
          },
        ]),
      }));
    }
    this.props.onCancelLoading();
  };

  render() {
    const { showErrors, errors, nameShowErrors } = this.state;

    const options = [
      {
        value: Credential.CredentialMaterialsType.UsernamePasswordType,
        text: 'Username and Password Credential',
      },
      {
        value: Credential.CredentialMaterialsType.NoAuth,
        text: 'No Auth',
      },
    ];

    return (
      <EuiForm component="form" error={errors} isInvalid={showErrors}>
        <EuiFormRow label="Credential Title" isInvalid={showErrors}>
          <EuiFieldText
            placeholder="Your Credential Title"
            value={this.state.credentialName || ''}
            onChange={(e) => this.setState({ credentialName: e.target.value })}
            isInvalid={showErrors}
          />
        </EuiFormRow>

        <EuiFormRow label="Credential Description" isInvalid={showErrors}>
          <EuiFieldText
            placeholder="Your Credential Description"
            value={this.state.description || ''}
            onChange={(e) => this.setState({ description: e.target.value })}
            isInvalid={showErrors}
          />
        </EuiFormRow>

        <EuiFormRow
          label="Authentication Method"
          labelAppend={
            <EuiText size="xs">
              <EuiLink>Supported Authentication Methods</EuiLink>
            </EuiText>
          }
          isInvalid={showErrors}
        >
          <EuiSelect
            onChange={(e) => this.setState({ credentialMaterialsType: e.target.value })}
            options={options}
            isInvalid={showErrors}
          />
        </EuiFormRow>

        <EuiFormRow label="Username" isInvalid={nameShowErrors}>
          <EuiFieldText
            placeholder="Your User Name"
            value={this.state.userName || ''}
            onChange={(e) => this.setState({ userName: e.target.value })}
            isInvalid={nameShowErrors}
          />
        </EuiFormRow>

        <EuiFormRow label="Password" isInvalid={nameShowErrors}>
          <EuiFieldPassword
            placeholder="Your Password"
            type={this.state.dual ? 'dual' : undefined}
            value={this.state.password || ''}
            onChange={(e) => this.setState({ password: e.target.value })}
            isInvalid={nameShowErrors}
          />
        </EuiFormRow>

        <EuiButton fill onClick={this.createCredential}>
          Create stored credential
        </EuiButton>
      </EuiForm>
    );
  }
}

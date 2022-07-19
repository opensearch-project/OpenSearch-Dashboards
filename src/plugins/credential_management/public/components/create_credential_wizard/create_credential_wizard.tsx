/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import {
  EuiHorizontalRule,
  EuiGlobalToastList,
  EuiGlobalToastListToast,
  EuiForm,
  EuiDescribedFormGroup,
  EuiFormRow,
  EuiFieldText,
  EuiSelect,
  EuiLink,
  // EuiFilePicker,
  EuiButton,
  EuiPageContent,
  EuiFieldPassword,
} from '@elastic/eui';
import { DocLinksStart } from 'src/core/public';
import { getCreateBreadcrumbs } from '../breadcrumbs';
import { CredentialManagmentContextValue } from '../../types';
import { Header } from './components/header';
import { context as contextType } from '../../../../opensearch_dashboards_react/public';
import { Credential } from '../../../common';

interface CreateCredentialWizardState {
  credentialName: string;
  credentialType: string;
  userName: string;
  password: string;
  dual: boolean;
  toasts: EuiGlobalToastListToast[];
  docLinks: DocLinksStart;
}

const USERNAME_PASSWORD_TYPE: Credential.USERNAME_PASSWORD_TYPE = 'username_password_credential';

export class CreateCredentialWizard extends React.Component<
  RouteComponentProps,
  CreateCredentialWizardState
> {
  static contextType = contextType;
  public readonly context!: CredentialManagmentContextValue;
  constructor(props: RouteComponentProps, context: CredentialManagmentContextValue) {
    super(props, context);

    context.services.setBreadcrumbs(getCreateBreadcrumbs());

    this.state = {
      credentialName: '',
      credentialType: USERNAME_PASSWORD_TYPE,
      userName: '',
      password: '',
      dual: true,
      toasts: [],
      docLinks: context.services.docLinks,
    };
  }

  // TODO: Fix header component error
  renderHeader() {
    const { docLinks } = this.state;

    return (
      <Header
        docLinks={docLinks}
      />
    );
  }

  // TODO: Add conditional rendering to select credential types
  renderContent() {
    const header = this.renderHeader();

    return (
      <EuiPageContent>
        {header}
        <EuiHorizontalRule />
        <EuiForm component="form">
          <EuiDescribedFormGroup
            title={<h3>Credential Name</h3>}
            description={
              <p>The name of credential that you want to create</p>
            }
          >
            <EuiFormRow label="Credential Name">
              <EuiFieldText
                placeholder="Your Credential Name"
                value={this.state.credentialName || ''}
                onChange={(e) => this.setState({ credentialName: e.target.value })}
              />
            </EuiFormRow>
          </EuiDescribedFormGroup>
          <EuiDescribedFormGroup
            title={<h3>Credential Type</h3>}
            description={
              <div>
                <p>
                  The type of credential that you want to create{' '}
                  <EuiLink href="#/display/text">
                    <strong>Credential Types Supported</strong>
                  </EuiLink>
                </p>
                <ul>
                  <li>
                    For <b>username_password_credential</b> type: this type can be used for{' '}
                    credentials in format of username, password.{' '}
                  </li>
                  <li> Ex: Opensearch basic auth </li>
                </ul>
                <ul>
                  <li>
                    For <b>aws_iam_credential</b> type: this type can only be used for{' '}
                    aws iam credential, with aws_access_key_id,{' '}
                    aws_secret_access_key, and region (optional) 
                  </li>
                </ul>
              </div>
            }
          >
            <EuiFormRow label="Credential Type">
              <EuiSelect
                onChange={(e) => this.setState({ credentialType: e.target.value })}
                options={[
                  { value: USERNAME_PASSWORD_TYPE, text: 'Username and Password Credential' },
                  { value: 'aws_iam_credential', text: 'AWS IAM Credential' },
                ]}
              />
            </EuiFormRow>
            <EuiFormRow label="User Name">
              <EuiFieldText
                placeholder="Your User Name"
                value={this.state.userName || ''}
                onChange={(e) => this.setState({ userName: e.target.value })}
              />
            </EuiFormRow>
            <EuiFormRow label="Password">
              <EuiFieldPassword
                placeholder="Your Password"
                type={this.state.dual ? 'dual' : undefined}
                value={this.state.password || ''}
                onChange={(e) => this.setState({ password: e.target.value })}
              />
            </EuiFormRow>
            {/* <EuiFormRow label="Upload Credential File">
              <EuiFilePicker />
            </EuiFormRow> */}
          </EuiDescribedFormGroup>
          <EuiButton fill onClick={this.createCredential}>
            Save
          </EuiButton>
        </EuiForm>
      </EuiPageContent>
    );
  }

  removeToast = (id: string) => {
    this.setState((prevState) => ({
      toasts: prevState.toasts.filter((toast) => toast.id !== id),
    }));
  };

  render() {
    const content = this.renderContent();

    return (
      <>
        {content}
        <EuiGlobalToastList
          toasts={this.state.toasts}
          dismissToast={({ id }) => {
            this.removeToast(id);
          }}
          toastLifeTimeMs={6000}
        />
      </>
    );
  }

  createCredential = async () => {
    const { http } = this.context.services;
    try {
      // TODO: Refactor it by registering client wrapper factory
      // TODO: Add rendering spanner
      await http.post('/api/credential_management/create', {
        body: JSON.stringify({
          credential_name: this.state.credentialName,
          credential_type: this.state.credentialType,
          username_password_credential_materials: {
            user_name: this.state.userName,
            password: this.state.password,
          },
        }),
      });
      this.props.history.push('');
    } catch (e) {
      // TODO: Add Toast
      console.log(e);
    }
  };
}

// TODO: Add router
export const CreateCredentialWizardWithRouter = withRouter(CreateCredentialWizard);

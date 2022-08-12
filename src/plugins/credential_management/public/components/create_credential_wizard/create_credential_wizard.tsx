/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
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
  EuiButton,
  EuiPageContent,
  EuiFieldPassword,
} from '@elastic/eui';
import { DocLinksStart } from 'src/core/public';
import { Credential } from '../../../../data_source/common';

import { getCreateBreadcrumbs } from '../breadcrumbs';
import { CredentialManagmentContextValue } from '../../types';
import { Header } from './components/header';
import { context as contextType } from '../../../../opensearch_dashboards_react/public';

interface CreateCredentialWizardState {
  credentialName?: string;
  credentialMaterialsType?: string;
  username?: string;
  password?: string;
  dual: boolean;
  toasts: EuiGlobalToastListToast[];
  docLinks: DocLinksStart;
}

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
      credentialName: undefined,
      credentialMaterialsType: undefined,
      username: undefined,
      password: undefined,
      dual: true,
      toasts: [],
      docLinks: context.services.docLinks,
    };
  }

  // TODO: Fix header component error https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2048
  renderHeader() {
    const { docLinks } = this.state;

    return <Header docLinks={docLinks} />;
  }

  renderContent() {
    const header = this.renderHeader();

    const options = [
      { value: undefined, text: 'Select Credential Materials Type' },
      {
        value: Credential.CredentialMaterialsType.UsernamePasswordType,
        text: 'Username and Password Credential',
      },
    ];

    return (
      <EuiPageContent>
        {header}
        <EuiHorizontalRule />
        <EuiForm component="form">
          <EuiDescribedFormGroup
            title={<h3>Credential Name</h3>}
            description={<p>The name of credential that you want to create</p>}
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
                  <li> Ex: OpenSearch basic auth </li>
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
            <EuiFormRow label="Credential Type">
              <EuiSelect
                onChange={(e) => this.setState({ credentialMaterialsType: e.target.value })}
                options={options}
              />
            </EuiFormRow>
            <EuiFormRow label="User Name">
              <EuiFieldText
                placeholder="Your User Name"
                value={this.state.username || undefined}
                onChange={(e) => this.setState({ username: e.target.value })}
              />
            </EuiFormRow>
            <EuiFormRow label="Password">
              <EuiFieldPassword
                placeholder="Your Password"
                type={this.state.dual ? 'dual' : undefined}
                value={this.state.password || undefined}
                onChange={(e) => this.setState({ password: e.target.value })}
              />
            </EuiFormRow>
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
    const { savedObjects } = this.context.services;
    try {
      // TODO: Add rendering spanner https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2050
      await savedObjects.client.create('credential', {
        title: this.state.credentialName,
        credentialMaterials: {
          credentialMaterialsType: this.state.credentialMaterialsType,
          credentialMaterialsContent: {
            username: this.state.username,
            password: this.state.password,
          },
        },
      });
      this.props.history.push('');
    } catch (e) {
      const createCredentialFailMsg = (
        <FormattedMessage
          id="credentialManagement.createCredential.loadCreateCredentialFailMsg"
          defaultMessage="The credential saved object creation failed with some errors. Please configure data_source.enabled and try it again."
        />
      );
      this.setState((prevState) => ({
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
  };
}

export const CreateCredentialWizardWithRouter = withRouter(CreateCredentialWizard);

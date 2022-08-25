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
  EuiFlexItem,
  EuiToolTip,
  EuiButtonIcon,
  EuiConfirmModal,
  EuiLoadingSpinner,
  EuiOverlayMask,
} from '@elastic/eui';
import { DocLinksStart } from 'src/core/public';
import {
  CredentialMaterialsType,
  CREDENTIAL_SAVED_OBJECT_TYPE,
} from '../../../../../data_source/public';

import { getCreateBreadcrumbs } from '../../breadcrumbs';
import { CredentialManagmentContextValue } from '../../../types';
// TODO: Add Header https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2051
import { context as contextType } from '../../../../../opensearch_dashboards_react/public';
import { EditCredentialItem } from '../../types';
import { LocalizedContent } from '../../common/text_content';

interface EditCredentialState {
  credentialName: string;
  credentialMaterialsType: string;
  username?: string;
  password?: string;
  dual: boolean;
  toasts: EuiGlobalToastListToast[];
  docLinks: DocLinksStart;
  isVisible: boolean;
  isLoading: boolean;
}

export interface EditCredentialProps extends RouteComponentProps {
  credential: EditCredentialItem;
}

export class EditCredentialComponent extends React.Component<
  EditCredentialProps,
  EditCredentialState
> {
  static contextType = contextType;
  public readonly context!: CredentialManagmentContextValue;
  constructor(props: EditCredentialProps, context: CredentialManagmentContextValue) {
    super(props, context);

    context.services.setBreadcrumbs(getCreateBreadcrumbs());

    this.state = {
      credentialName: props.credential.title,
      credentialMaterialsType: CredentialMaterialsType.UsernamePasswordType,
      username: undefined,
      password: undefined,
      dual: true,
      toasts: [],
      docLinks: context.services.docLinks,
      isVisible: false,
      isLoading: false,
    };
  }

  confirmDelete = async () => {
    const { savedObjects } = this.context.services;
    this.setState({ isLoading: true });
    try {
      await savedObjects.client.delete(CREDENTIAL_SAVED_OBJECT_TYPE, this.props.credential.id);
      this.props.history.push('');
    } catch (e) {
      const deleteCredentialFailMsg = (
        <FormattedMessage
          id="credentialManagement.editCredential.deleteCredentialFailMsg"
          defaultMessage="The credential delete failed with some errors. Please try it again.'"
        />
      );
      this.setState((prevState) => ({
        toasts: prevState.toasts.concat([
          {
            title: deleteCredentialFailMsg,
            id: deleteCredentialFailMsg.props.id,
            color: 'warning',
            iconType: 'alert',
          },
        ]),
      }));
    }
    this.setState({ isLoading: false });
  };

  delelteButtonRender() {
    return (
      <>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'end',
          }}
        >
          <EuiFlexItem>
            <EuiToolTip content={LocalizedContent.deleteCredentialButtonDescription}>
              <EuiButtonIcon
                color="danger"
                onClick={this.removeCredential}
                iconType="trash"
                aria-label={LocalizedContent.deleteCredentialButtonDescription}
              />
            </EuiToolTip>
          </EuiFlexItem>
        </div>

        {this.state.isVisible ? (
          <EuiConfirmModal
            title={LocalizedContent.deleteButtonOnConfirmText}
            onCancel={() => {
              this.setState({ isVisible: false });
            }}
            onConfirm={this.confirmDelete}
            cancelButtonText={LocalizedContent.cancelButtonOnDeleteCancelText}
            confirmButtonText={LocalizedContent.confirmButtonOnDeleteComfirmText}
            defaultFocusedButton="confirm"
          >
            <p>{LocalizedContent.deleteCredentialDescribeMsg}</p>
            <p>{LocalizedContent.deleteCredentialConfirmMsg}</p>
            <p>{LocalizedContent.deleteCredentialWarnMsg}</p>
          </EuiConfirmModal>
        ) : null}
      </>
    );
  }

  renderContent() {
    const options = [
      {
        value: CredentialMaterialsType.UsernamePasswordType,
        text: 'Username and Password Credential',
      },
    ];

    return (
      <EuiPageContent>
        {this.delelteButtonRender()}
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
          <EuiButton fill onClick={this.updateCredential}>
            Update
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
    const { isLoading } = this.state;
    return isLoading ? (
      <EuiOverlayMask>
        <EuiLoadingSpinner size="xl" />
      </EuiOverlayMask>
    ) : (
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

  removeCredential = async () => {
    this.setState({ isVisible: true });
  };

  updateCredential = async () => {
    const { savedObjects } = this.context.services;
    this.setState({ isLoading: true });
    try {
      await savedObjects.client.update('credential', this.props.credential.id, {
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
      const editCredentialFailMsg = (
        <FormattedMessage
          id="credentialManagement.editCredential.loadEditCredentialFailMsg"
          defaultMessage="The credential saved object edit failed with some errors. Please configure data_source.enabled and try it again."
        />
      );
      this.setState((prevState) => ({
        toasts: prevState.toasts.concat([
          {
            title: editCredentialFailMsg,
            id: editCredentialFailMsg.props.id,
            color: 'warning',
            iconType: 'alert',
          },
        ]),
      }));
    }
    this.setState({ isLoading: false });
  };
}

export const EditCredential = withRouter(EditCredentialComponent);

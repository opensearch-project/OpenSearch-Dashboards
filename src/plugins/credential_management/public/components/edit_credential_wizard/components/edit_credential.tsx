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
  EuiButton,
  EuiPageContent,
  EuiFieldPassword,
  EuiFlexItem,
  EuiToolTip,
  EuiButtonIcon,
  EuiConfirmModal,
  EuiLoadingSpinner,
  EuiOverlayMask,
  EuiFlexGroup,
  EuiText,
  EuiSpacer,
  EuiBottomBar,
  EuiButtonEmpty,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
} from '@elastic/eui';
import { DocLinksStart } from 'src/core/public';
import {
  CredentialMaterialsType,
  CREDENTIAL_SAVED_OBJECT_TYPE,
} from '../../../../../data_source/public';

import { getCreateBreadcrumbs } from '../../breadcrumbs';
import { CredentialManagmentContextValue } from '../../../types';
import { context as contextType } from '../../../../../opensearch_dashboards_react/public';
import { EditCredentialItem } from '../../types';
import { LocalizedContent } from '../../common/text_content';
import { Header } from '../../common/components/header';

interface EditCredentialState {
  credentialName: string;
  credentialMaterialsType: string;
  credentialDescription: string;
  username?: string;
  password?: string;
  dual: boolean;
  toasts: EuiGlobalToastListToast[];
  docLinks: DocLinksStart;
  isDeleteModalVisible: boolean;
  isUpdateModalVisible: boolean;
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
      credentialDescription: props.credential.description || '',
      username: props.credential.username || '',
      password: undefined,
      dual: true,
      toasts: [],
      docLinks: context.services.docLinks,
      isDeleteModalVisible: false,
      isUpdateModalVisible: false,
      isLoading: false,
    };
  }
  /* Render methods */
  renderDelelteButton() {
    return (
      <>
        <EuiFlexItem grow={false}>
          <EuiToolTip content={LocalizedContent.deleteCredentialButtonDescription}>
            <EuiButtonIcon
              color="danger"
              onClick={this.removeCredential}
              iconType="trash"
              aria-label={LocalizedContent.deleteCredentialButtonDescription}
            />
          </EuiToolTip>
        </EuiFlexItem>

        {this.state.isDeleteModalVisible ? (
          <EuiConfirmModal
            title={LocalizedContent.deleteButtonOnConfirmText}
            onCancel={() => {
              this.setState({ isDeleteModalVisible: false });
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
  renderHeader() {
    return <Header headerTitle={this.state.credentialName} isCreateCredential={false} />;
  }

  renderUpdatePasswordModal() {
    const closeModal = () => this.setState({ isUpdateModalVisible: false });
    return (
      <>
        <EuiButton onClick={this.updateCredentialPassword}>Update Password</EuiButton>

        {this.state.isUpdateModalVisible ? (
          <EuiModal onClose={closeModal}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>
                <h1>Update password</h1>
              </EuiModalHeaderTitle>
            </EuiModalHeader>

            <EuiModalBody>
              <EuiFieldPassword
                placeholder="Passord field(focus)"
                type={this.state.dual ? 'dual' : undefined}
                value={this.state.password || ''}
                onChange={(e) => this.setState({ password: e.target.value })}
              />
            </EuiModalBody>

            <EuiModalFooter>
              <EuiButtonEmpty onClick={closeModal}>Cancel</EuiButtonEmpty>
              <EuiButton
                type="submit"
                form="modalFormId"
                onClick={this.updateCredentialPasswordField}
                fill
              >
                Update
              </EuiButton>
            </EuiModalFooter>
          </EuiModal>
        ) : null}
      </>
    );
  }

  renderContent = () => {
    const header = this.renderHeader();
    const deleteButton = this.renderDelelteButton();

    return (
      <EuiForm component="form">
        <EuiSpacer size="l" />
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>{header}</EuiFlexItem>
          <EuiFlexItem grow={false}>{deleteButton}</EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="s" />
        <EuiPageContent>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiText>
                <h3>{LocalizedContent.credentialEditPageInfoTitle}</h3>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiHorizontalRule />

          <EuiDescribedFormGroup
            title={<h4>Credential Details</h4>}
            description={
              <p>
                The credential information is used for reference in tables and when adding to a data
                source connection
              </p>
            }
          >
            <EuiFormRow label="Credential Title">
              <EuiFieldText
                placeholder="Your credential title"
                value={this.state.credentialName || ''}
                onChange={(e) => this.setState({ credentialName: e.target.value })}
              />
            </EuiFormRow>
            <EuiFormRow label="Credential Description">
              <EuiFieldText
                placeholder="Your credential description"
                value={this.state.credentialDescription || ''}
                onChange={(e) => this.setState({ credentialDescription: e.target.value })}
              />
            </EuiFormRow>
          </EuiDescribedFormGroup>
        </EuiPageContent>
        <br />
        <EuiPageContent>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiText>
                <h3>{LocalizedContent.credentialEditPageAuthTitle}</h3>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiHorizontalRule />

          <EuiDescribedFormGroup
            title={<h4>Authentication Details</h4>}
            description={
              <p>Modify these to update the authentication type and associated details</p>
            }
          >
            <EuiFormRow label="Authentication Method">
              <EuiText size="s">{LocalizedContent.credentialEditPageAuthType}</EuiText>
            </EuiFormRow>

            <EuiSpacer />
            <EuiFormRow label="Username">
              <EuiFieldText
                placeholder="Your username"
                value={this.state.username || ''}
                onChange={(e) => this.setState({ username: e.target.value })}
              />
            </EuiFormRow>
            <EuiFormRow label="Password">
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiText size="s">*************</EuiText>
                </EuiFlexItem>
                <EuiFlexItem>{this.renderUpdatePasswordModal()}</EuiFlexItem>
              </EuiFlexGroup>
            </EuiFormRow>
          </EuiDescribedFormGroup>

          <EuiBottomBar>
            <EuiFlexGroup justifyContent="flexEnd">
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty color="ghost" size="s">
                  Cancel changes
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton color="success" fill size="s" onClick={this.updateCredentialInformation}>
                  Save changes
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiBottomBar>
        </EuiPageContent>
      </EuiForm>
    );
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
  /* Events */
  removeToast = (id: string) => {
    this.setState((prevState) => ({
      toasts: prevState.toasts.filter((toast) => toast.id !== id),
    }));
  };

  removeCredential = async () => {
    this.setState({ isDeleteModalVisible: true });
  };

  updateCredentialPassword = async () => {
    this.setState({ isUpdateModalVisible: true });
  };

  updateCredentialInformation = async () => {
    const { savedObjects } = this.context.services;
    this.setState({ isLoading: true });

    try {
      const credentialAttributes = {
        title: this.state.credentialName,
        description: this.state.credentialDescription,
        credentialMaterials: {
          credentialMaterialsType: this.state.credentialMaterialsType,
          credentialMaterialsContent: {
            username: this.state.username,
          },
        },
      };
      await savedObjects.client.update(
        CREDENTIAL_SAVED_OBJECT_TYPE,
        this.props.credential.id,
        credentialAttributes
      );
      this.props.history.push('');
    } catch (e) {
      const editCredentialFailMsg = (
        <FormattedMessage
          id="credentialManagement.editCredential.loadEditCredentialFailMsg"
          defaultMessage="Credential information update failed"
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

  updateCredentialPasswordField = async () => {
    const { savedObjects } = this.context.services;
    this.setState({ isLoading: true, isUpdateModalVisible: false });
    try {
      const credentialAttributes = {
        credentialMaterials: {
          credentialMaterialsContent: {
            password: this.state.password,
          },
        },
      };
      await savedObjects.client.update(
        CREDENTIAL_SAVED_OBJECT_TYPE,
        this.props.credential.id,
        credentialAttributes
      );
      this.props.history.push('');
    } catch (e) {
      const editCredentialFailMsg = (
        <FormattedMessage
          id="credentialManagement.editCredential.loadEditCredentialFailMsg"
          defaultMessage="Change password failed"
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
}

export const EditCredential = withRouter(EditCredentialComponent);

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiBottomBar,
  EuiButton,
  EuiButtonEmpty,
  EuiCard,
  EuiDescribedFormGroup,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiHorizontalRule,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  CreateNewCredentialType,
  CredentialsComboBoxItem,
  CredentialSourceType,
  DataSourceManagementContextValue,
  EditDataSourceFormType,
  ToastMessageItem,
} from '../../../../types';
import { Header } from '../header';
import { createNewCredential, getExistingCredentials } from '../../../utils';
import { context as contextType } from '../../../../../../opensearch_dashboards_react/public';
import {
  CreateEditDataSourceValidation,
  defaultValidation,
  performDataSourceFormValidation,
} from '../../../validation/datasource_form_validation';
import { CredentialsComboBox } from '../credentials_combox_box/credentials_combo_box';
import {
  CredentialForm,
  CreateCredentialItem,
} from '../../../../../../credential_management/public';

export interface EditDataSourceProps {
  existingDataSource: EditDataSourceFormType;
  handleSubmit: (formValues: EditDataSourceFormType) => void;
  displayToastMessage: (msg: ToastMessageItem) => void;
  displayLoadingMask: (show: boolean) => void;
  onDeleteDataSource?: () => void;
}
export interface EditDataSourceState {
  formErrors: string[];
  formErrorsByField: CreateEditDataSourceValidation;
  dataSourceTitle: string;
  dataSourceDescription: string;
  endpoint: string;
  selectedCredentialSourceType: string;
  selectedCredentials: CredentialsComboBoxItem[];
  availableCredentials: CredentialsComboBoxItem[];
  showCreateCredentialModal: boolean;
  showUpdateOptions: boolean;
  onClickNewCredential: boolean;
}

const noAuthOption: CredentialsComboBoxItem = {
  title: 'No Authentication',
  description: 'No Authentication',
  checked: null,
  id: CredentialSourceType.NoAuth,
  credentialtype: CredentialSourceType.NoAuth,
  label: 'No Authentication',
};

export class EditDataSourceForm extends React.Component<EditDataSourceProps, EditDataSourceState> {
  static contextType = contextType;
  public readonly context!: DataSourceManagementContextValue;

  constructor(props: EditDataSourceProps, context: DataSourceManagementContextValue) {
    super(props, context);

    this.state = {
      formErrors: [],
      formErrorsByField: { ...defaultValidation },
      dataSourceTitle: '',
      dataSourceDescription: '',
      endpoint: '',
      selectedCredentialSourceType: CredentialSourceType.NoAuth,
      selectedCredentials: [],
      availableCredentials: [],
      showCreateCredentialModal: false,
      showUpdateOptions: false,
      onClickNewCredential: false,
    };
  }

  componentDidMount() {
    this.setFormValuesForEditMode();
    this.fetchAvailableCredentials(this.props.existingDataSource.credentialId);
  }

  fetchAvailableCredentials(selectedCredentialId: string) {
    const { savedObjects } = this.context.services;
    this.props.displayLoadingMask(true);
    getExistingCredentials(savedObjects.client)
      .then((fetchedCredentials: CredentialsComboBoxItem[]) => {
        if (fetchedCredentials?.length) {
          this.setState({ availableCredentials: [{ ...noAuthOption }, ...fetchedCredentials] });
          this.setSelectedCredential(fetchedCredentials, selectedCredentialId);
        }
      })
      .catch(() => {
        this.props.displayToastMessage({
          id: 'dataSourcesManagement.createEditDataSource.fetchExistingCredentialsFailMsg',
          defaultMessage: 'Error while finding existing credentials.',
          color: 'warning',
          iconType: 'alert',
        });
      })
      .finally(() => {
        this.props.displayLoadingMask(false);
      });
  }

  findCredentialById(id: string, credentials: CredentialsComboBoxItem[]) {
    return credentials?.find((rec) => rec.id === id);
  }

  resetFormValues = () => {
    this.setFormValuesForEditMode();
    if (this.state.availableCredentials.length) {
      this.setSelectedCredential(
        this.state.availableCredentials,
        this.props.existingDataSource.credentialId
      );
    }
    this.setState({ showUpdateOptions: false });
  };

  setFormValuesForEditMode() {
    if (this.props.existingDataSource) {
      const { title, description, endpoint } = this.props.existingDataSource;
      this.setState({
        dataSourceTitle: title,
        dataSourceDescription: description,
        endpoint,
      });
    }
  }

  setSelectedCredential = (fetchedCredentials: CredentialsComboBoxItem[], selectedId: string) => {
    if (selectedId !== CredentialSourceType.NoAuth) {
      const foundCredential = this.findCredentialById(selectedId, fetchedCredentials);
      this.setState({
        selectedCredentials: foundCredential && foundCredential.id ? [foundCredential] : [],
        selectedCredentialSourceType:
          foundCredential && foundCredential.id ? CredentialSourceType.ExistingCredential : '',
      });
    } else {
      this.setState({
        selectedCredentials: [{ ...this.state.availableCredentials[0] }],
        selectedCredentialSourceType: CredentialSourceType.NoAuth,
      });
    }
    this.onChangeFormValues();
  };

  /* Validations */

  isFormValid = () => {
    const { formErrors, formErrorsByField } = performDataSourceFormValidation(this.state);

    this.setState({
      formErrors,
      formErrorsByField,
    });

    return formErrors.length === 0;
  };

  /* Events */

  onChangeTitle = (e: { target: { value: any } }) => {
    this.setState({ dataSourceTitle: e.target.value }, () => {
      if (this.state.formErrorsByField.title.length) {
        this.isFormValid();
      }
    });
  };

  onChangeDescription = (e: { target: { value: any } }) => {
    this.setState({ dataSourceDescription: e.target.value }, () => {
      if (this.state.formErrorsByField.description.length) {
        this.isFormValid();
      }
    });
  };

  onChangeEndpoint = (e: { target: { value: any } }) => {
    this.setState({ endpoint: e.target.value }, () => {
      if (this.state.formErrorsByField.endpoint.length) {
        this.isFormValid();
      }
    });
  };

  onClickUpdateDataSource = () => {
    if (this.isFormValid()) {
      const formValues: EditDataSourceFormType = {
        id: this.props.existingDataSource.id,
        title: this.state.dataSourceTitle,
        description: this.state.dataSourceDescription,
        endpoint: this.state.endpoint,
        credentialType: this.state.selectedCredentialSourceType,
        credentialId: this.state.selectedCredentials?.length
          ? this.state.selectedCredentials[0].id
          : '',
      };

      this.props.handleSubmit(formValues);
    }
  };

  onSelectExistingCredentials = (options: CredentialsComboBoxItem[]) => {
    this.setState(
      {
        selectedCredentials: options,
        selectedCredentialSourceType: options?.length ? options[0].credentialtype : '',
      },
      () => {
        this.onChangeFormValues();
        if (this.state.formErrorsByField.credential.length) {
          this.isFormValid();
        }
      }
    );
  };

  onClickDeleteDataSource = () => {
    if (this.props.onDeleteDataSource) {
      this.props.onDeleteDataSource();
    }
  };

  onChangeFormValues = () => {
    setTimeout(() => {
      this.didFormValuesChange();
    }, 0);
  };

  /* Create new credentials*/
  onClickCreateNewCredential = () => {
    this.setState({ showCreateCredentialModal: true });
  };

  handleCreateNewCredential = ({
    title,
    description,
    username,
    password,
  }: CreateCredentialItem) => {
    const { savedObjects } = this.context.services;
    this.setState({ showCreateCredentialModal: false });
    const attributes: CreateNewCredentialType = {
      title,
      description: description || '',
      credentialMaterials: {
        credentialMaterialsType: 'username_password',
        credentialMaterialsContent: {
          username,
          password,
        },
      },
    };
    createNewCredential(savedObjects.client, attributes)
      .then((response) => {
        this.fetchAvailableCredentials(response);
      })
      .catch(() => {
        this.props.displayToastMessage({
          id: 'dataSourcesManagement.editDataSource.createCredentialsFailMsg',
          defaultMessage: 'Error while creating new credential.',
          color: 'warning',
          iconType: 'alert',
        });
      });
  };

  /* Create new credentials*/
  onCreateNewCredential = () => {
    const value = !this.state.onClickNewCredential;
    this.setState({ onClickNewCredential: value });
  };

  /* Render methods */

  /* Render Modal for new credential */
  closeModal = () => {
    this.setState({ showCreateCredentialModal: false });
  };
  renderCreateStoredCredentialModal() {
    let modal;
    const { docLinks } = this.context.services;

    if (this.state.showCreateCredentialModal) {
      modal = (
        <EuiModal onClose={this.closeModal}>
          <EuiModalHeader />

          <EuiModalBody>
            <CredentialForm
              docLinks={docLinks}
              handleSubmit={this.handleCreateNewCredential}
              hideSubmit={true}
              callSubmit={this.state.onClickNewCredential}
            />
          </EuiModalBody>

          <EuiModalFooter>
            <EuiButtonEmpty onClick={this.closeModal}>Cancel</EuiButtonEmpty>

            <EuiButton onClick={this.onCreateNewCredential} fill>
              Create & Add
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      );
    }
    return <div>{modal}</div>;
  }
  /* Render header*/
  renderHeader = () => {
    return (
      <Header
        showDeleteIcon={true}
        onClickDeleteIcon={this.onClickDeleteDataSource}
        dataSourceName={this.props.existingDataSource.title}
      />
    );
  };

  /* Render Connection Details Panel */
  renderConnectionDetailsSection = () => {
    return (
      <EuiPanel paddingSize="m">
        <EuiText size="m"> Connection Details </EuiText>

        <EuiHorizontalRule margin="m" />

        <EuiDescribedFormGroup
          title={<h4>Object Details</h4>}
          description={
            <p>
              This connection information is used for reference in tables and when adding to a data
              source connection
            </p>
          }
        >
          {/* Title */}
          <EuiFormRow
            label="Title"
            isInvalid={!!this.state.formErrorsByField.title.length}
            error={this.state.formErrorsByField.title}
          >
            <EuiFieldText
              name="dataSourceTitle"
              value={this.state.dataSourceTitle || ''}
              placeholder="Title"
              isInvalid={!!this.state.formErrorsByField.title.length}
              onChange={this.onChangeTitle}
            />
          </EuiFormRow>
          {/* Description */}
          <EuiFormRow
            label="Description"
            isInvalid={!!this.state.formErrorsByField.description.length}
            error={this.state.formErrorsByField.description}
          >
            <EuiFieldText
              name="dataSourceDescription"
              value={this.state.dataSourceDescription || ''}
              placeholder="Description of the data source"
              isInvalid={!!this.state.formErrorsByField.description.length}
              onChange={this.onChangeDescription}
            />
          </EuiFormRow>
        </EuiDescribedFormGroup>
      </EuiPanel>
    );
  };

  /* Render Connection Details Panel */
  renderEndpointSection = () => {
    return (
      <EuiPanel paddingSize="m">
        <EuiText size="m"> Endpoint </EuiText>

        <EuiHorizontalRule margin="m" />

        <EuiDescribedFormGroup
          title={<h4>Endpoint URL</h4>}
          description={
            <p>
              This connection information is used for reference in tables and when adding to a data
              source connection
            </p>
          }
        >
          {/* Endpoint */}
          <EuiFormRow
            label="Endpoint URL"
            isInvalid={!!this.state.formErrorsByField.endpoint.length}
            error={this.state.formErrorsByField.endpoint}
          >
            <EuiFieldText
              name="endpoint"
              value={this.state.endpoint || ''}
              placeholder="The connection URL"
              isInvalid={!!this.state.formErrorsByField.endpoint.length}
              onChange={this.onChangeEndpoint}
            />
          </EuiFormRow>
        </EuiDescribedFormGroup>
      </EuiPanel>
    );
  };

  /* Render Connection Details Panel */
  renderAuthenticationSection = () => {
    return (
      <EuiPanel paddingSize="m">
        <EuiText size="m"> Authentication </EuiText>

        <EuiHorizontalRule margin="m" />

        <EuiDescribedFormGroup
          title={<h4>Associated Credential</h4>}
          description={
            <p>
              Remove or replace the associated credential. To edit an existing credential, visit
            </p>
          }
        >
          {/* Existing Credential*/}
          {this.renderCredentialsSection()}

          <EuiSpacer size="m" />

          {/* Credential Card */}
          {this.renderCredentialCard()}
        </EuiDescribedFormGroup>
      </EuiPanel>
    );
  };

  /* Render Credentials Existing & new */
  renderCredentialsSection = () => {
    return (
      <>
        <EuiFlexGroup style={{ maxWidth: 600 }}>
          <EuiFlexItem>
            <EuiFormRow
              hasEmptyLabelSpace
              isInvalid={!!this.state.formErrorsByField.credential.length}
              error={this.state.formErrorsByField.credential}
            >
              <CredentialsComboBox
                isInvalid={!!this.state.formErrorsByField.credential.length}
                availableCredentials={this.state.availableCredentials}
                selectedCredentials={this.state.selectedCredentials}
                setSelectedCredentials={this.onSelectExistingCredentials}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFormRow hasEmptyLabelSpace>
              <EuiButton onClick={this.onClickCreateNewCredential} fill>
                Create
              </EuiButton>
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
        {this.renderCreateStoredCredentialModal()}
      </>
    );
  };

  /* Render Credential Card */

  renderCredentialCardTitle = () => {
    return !this.state.selectedCredentials?.length
      ? 'No Credential Associated'
      : this.state.selectedCredentials[0].title;
  };

  renderCredentialCardDescriptionByType = () => {
    if (!this.state.selectedCredentials?.length) {
      return <p>A credential has not been associated or the credential object has been removed</p>;
    } else {
      const { title } = this.state.selectedCredentials[0];
      if (title === 'No Authentication') {
        return <p>No authentication is required</p>;
      } else {
        return (
          <div>
            <EuiText grow={false} autoCapitalize="false">
              <h6>Credential Description</h6>
              <p>{this.state.selectedCredentials[0].description}</p>
              <h6>Authentication Method</h6>
              <p>
                {this.state.selectedCredentials[0].credentialtype.includes('username_password')
                  ? 'Username & Password'
                  : 'Other'}
              </p>
              <h6>Credential Source</h6>
              <p>Stored Credentials</p>
            </EuiText>
          </div>
        );
      }
    }
  };

  renderCredentialCard = () => {
    return (
      <EuiCard textAlign="left" title={this.renderCredentialCardTitle()}>
        {this.renderCredentialCardDescriptionByType()}
      </EuiCard>
    );
  };

  didFormValuesChange = () => {
    const formValues: EditDataSourceFormType = {
      id: this.props.existingDataSource.id,
      title: this.state.dataSourceTitle,
      description: this.state.dataSourceDescription,
      endpoint: this.state.endpoint,
      credentialType: this.state.selectedCredentialSourceType,
      credentialId: this.state.selectedCredentials?.length
        ? this.state.selectedCredentials[0].id
        : '',
    };

    const {
      title,
      description,
      endpoint,
      credentialType,
      credentialId,
    } = this.props.existingDataSource;

    if (
      formValues.title !== title ||
      formValues.description !== description ||
      formValues.endpoint !== endpoint ||
      formValues.credentialId !== credentialId ||
      formValues.credentialType !== credentialType
    ) {
      this.setState({ showUpdateOptions: true });
    } else {
      this.setState({ showUpdateOptions: false });
    }
  };

  renderBottomBar = () => {
    let bottomBar = null;

    if (this.state.showUpdateOptions) {
      bottomBar = (
        <EuiBottomBar data-test-subj="advancedSetting-bottomBar">
          <EuiFlexGroup
            justifyContent="spaceBetween"
            alignItems="center"
            responsive={false}
            gutterSize="s"
          >
            <EuiFlexItem />
            <EuiFlexItem />
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                color="ghost"
                size="s"
                iconType="cross"
                onClick={() => this.resetFormValues()}
                aria-describedby="aria-describedby.countOfUnsavedSettings"
                data-test-subj="advancedSetting-cancelButton"
              >
                {i18n.translate('advancedSettings.form.cancelButtonLabel', {
                  defaultMessage: 'Cancel changes',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip
                content={
                  this.state.formErrors?.length &&
                  i18n.translate('advancedSettings.form.saveButtonTooltipWithInvalidChanges', {
                    defaultMessage: 'Fix invalid settings before saving.',
                  })
                }
              >
                <EuiButton
                  className="mgtAdvancedSettingsForm__button"
                  disabled={!!this.state.formErrors?.length}
                  color="secondary"
                  fill
                  size="s"
                  iconType="check"
                  onClick={this.onClickUpdateDataSource}
                  aria-describedby="aria-describedby.countOfUnsavedSettings"
                  /* isLoading={this.state.loading}*/
                  data-test-subj="advancedSetting-saveButton"
                >
                  {i18n.translate('advancedSettings.form.saveButtonLabel', {
                    defaultMessage: 'Save changes',
                  })}
                </EuiButton>
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiBottomBar>
      );
    }
    return bottomBar;
  };

  renderContent = () => {
    return (
      <>
        {this.renderHeader()}
        <EuiForm
          onChange={() => this.onChangeFormValues()}
          data-test-subj="data-source-creation"
          isInvalid={!!this.state.formErrors.length}
          error={this.state.formErrors}
        >
          {this.renderConnectionDetailsSection()}

          <EuiSpacer size="m" />

          {this.renderEndpointSection()}

          <EuiSpacer size="m" />

          {this.renderAuthenticationSection()}
        </EuiForm>

        {this.renderBottomBar()}

        <EuiSpacer size="xl" />
        <EuiSpacer size="xl" />
      </>
    );
  };

  render() {
    return <>{this.renderContent()}</>;
  }
}

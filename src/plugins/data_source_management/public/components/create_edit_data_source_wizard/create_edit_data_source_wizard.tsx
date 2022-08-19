/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCheckbox,
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
  EuiModalHeaderTitle,
  EuiPageContent,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { CredentialsComboBox } from './components/credentials_combox_box';
import {
  CredentialsComboBoxItem,
  DataSourceEditPageItem,
  DataSourceManagementContextValue,
  ToastMessageItem,
} from '../../types';
import { Header } from './components/header';
import { getExistingCredentials, isValidUrl } from '../utils';
import { MODE_CREATE, MODE_EDIT } from '../../../common';
import { context as contextType } from '../../../../opensearch_dashboards_react/public';

export interface CreateEditDataSourceProps {
  wizardMode: string;
  existingDataSource?: DataSourceEditPageItem;
  handleSubmit: (formValues: DataSourceEditPageItem) => void;
  displayToastMessage: (msg: ToastMessageItem) => void;
  onDeleteDataSource?: () => void;
}
export interface CreateEditDataSourceState {
  formErrors: string[];
  formErrorsByField: CreateEditDataSourceValidation;
  dataSourceTitle: string;
  dataSourceDescription: string;
  endpoint: string;
  showCreateCredentialModal: boolean;
  noAuthentication: boolean;
  selectedCredentials: CredentialsComboBoxItem[];
  availableCredentials: CredentialsComboBoxItem[];
}

interface CreateEditDataSourceValidation {
  title: string[];
  description: string[];
  endpoint: string[];
  credential: string[];
}

const defaultValidation: CreateEditDataSourceValidation = {
  title: [],
  description: [],
  endpoint: [],
  credential: [],
};

export class CreateEditDataSourceWizard extends React.Component<
  CreateEditDataSourceProps,
  CreateEditDataSourceState
> {
  static contextType = contextType;
  public readonly context!: DataSourceManagementContextValue;

  constructor(props: CreateEditDataSourceProps, context: DataSourceManagementContextValue) {
    super(props, context);

    this.state = {
      formErrors: [],
      formErrorsByField: { ...defaultValidation },
      dataSourceTitle: '',
      dataSourceDescription: '',
      endpoint: '',
      showCreateCredentialModal: false,
      noAuthentication: false,
      selectedCredentials: [],
      availableCredentials: [],
    };
  }

  componentDidMount() {
    this.setFormValuesForEditMode();
    this.fetchAvailableCredentials();
  }

  async fetchAvailableCredentials() {
    try {
      const { savedObjects } = this.context.services;
      const fetchedCredentials: CredentialsComboBoxItem[] = await getExistingCredentials(
        savedObjects.client
      );
      if (fetchedCredentials?.length) {
        this.setState({ availableCredentials: fetchedCredentials });

        if (this.props.wizardMode === MODE_EDIT && this.props.existingDataSource?.credentialId) {
          const foundCredential = this.findCredentialById(
            this.props.existingDataSource.credentialId,
            fetchedCredentials
          );
          this.setState({
            selectedCredentials: foundCredential && foundCredential.id ? [foundCredential] : [],
          });
        }
      }
    } catch (e) {
      this.props.displayToastMessage({
        id: 'dataSourcesManagement.createEditDataSource.fetchExistingCredentialsFailMsg',
        defaultMessage: 'Error while finding existing credentials.',
        color: 'warning',
        iconType: 'alert',
      });
    }
  }

  findCredentialById(id: string, credentials: CredentialsComboBoxItem[]) {
    return credentials?.find((rec) => rec.id === id);
  }

  setFormValuesForEditMode() {
    if (this.props.wizardMode === MODE_EDIT && this.props.existingDataSource) {
      const { title, description, endpoint, noAuthentication } = this.props.existingDataSource;
      this.setState({
        dataSourceTitle: title,
        dataSourceDescription: description,
        endpoint,
        noAuthentication,
      });
    }
  }

  /* Validations */

  isFormValid = () => {
    const validationByField: CreateEditDataSourceValidation = {
      title: [],
      description: [],
      endpoint: [],
      credential: [],
    };
    const formErrorMessages: string[] = [];
    /* Title validation */
    if (!this.state.dataSourceTitle) {
      validationByField.title.push('Title should not be empty');
      formErrorMessages.push('Title should not be empty');
    }
    /* Description Validation */
    if (!this.state.dataSourceDescription) {
      validationByField.description.push('Description should not be empty');
      formErrorMessages.push('Description should not be empty');
    }
    /* Endpoint Validation */
    if (!isValidUrl(this.state.endpoint)) {
      validationByField.endpoint.push('Endpoint is not valid');
      formErrorMessages.push('Endpoint is not valid');
    }
    /* Credential Validation */
    if (!this.state.noAuthentication && !this.state.selectedCredentials?.length) {
      validationByField.credential.push('Please associate a credential');
      formErrorMessages.push('Please associate a credential');
    }

    this.setState({
      formErrors: formErrorMessages,
      formErrorsByField: { ...validationByField },
    });
    return formErrorMessages.length === 0;
  };

  /* Events */

  /* Create new credentials*/
  onClickCreateNewCredential = () => {
    this.setState({ showCreateCredentialModal: true });
  };

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

  onChangeNoAuth = () => {
    this.setState(
      {
        noAuthentication: !this.state.noAuthentication,
      },
      () => {
        /* When credential is already selected and user checks the noAuth checkbox, reset previously selected credential*/
        if (this.state.noAuthentication && this.state.selectedCredentials.length) {
          this.setState({ selectedCredentials: [] });
        }
      }
    );
  };

  onClickCreateNewDataSource = () => {
    if (this.isFormValid()) {
      const formValues: DataSourceEditPageItem = {
        id: this.props.existingDataSource?.id || '',
        title: this.state.dataSourceTitle,
        description: this.state.dataSourceDescription,
        endpoint: this.state.endpoint,
        noAuthentication: this.state.noAuthentication,
        credentialId: '',
      };
      if (this.state.selectedCredentials?.length) {
        formValues.credentialId = this.state.selectedCredentials[0].id;
      }

      this.props.handleSubmit(formValues);
    }
  };

  onSelectExistingCredentials = (options: CredentialsComboBoxItem[]) => {
    this.setState({ selectedCredentials: options }, () => {
      /* When noAuth checkbox is checked and user selects credentials, un-check the noAuth checkbox*/
      if (options.length && this.state.noAuthentication) {
        this.onChangeNoAuth();
      }
      if (this.state.formErrorsByField.credential.length) {
        this.isFormValid();
      }
    });
  };

  onCreateStoredCredential = () => {
    /* TODO */
  };

  onClickDeleteDataSource = () => {
    if (this.props.onDeleteDataSource) {
      this.props.onDeleteDataSource();
    }
  };

  /* Render methods */
  /* Render header*/
  renderHeader = () => {
    const { docLinks } = this.context.services;
    return (
      <Header
        docLinks={docLinks}
        showDeleteIcon={this.props.wizardMode === MODE_EDIT}
        onClickDeleteIcon={this.onClickDeleteDataSource}
        dataSourceName={
          this.props.wizardMode === MODE_EDIT
            ? this.state.dataSourceTitle
            : 'Create a data source connection'
        }
      />
    );
  };

  /* Render Section header*/
  renderAuthenticationSectionHeader = () => {
    return (
      <>
        <EuiSpacer size="xl" />
        <EuiText grow={false}>
          <h5>
            <FormattedMessage
              id="dataSourceManagement.connectToDataSource.authenticationHeader"
              defaultMessage="Authentication"
            />
          </h5>
          <EuiText size="xs">
            <p>
              <FormattedMessage
                id="dataSourceManagement.connectToDataSource.authenticationDescription"
                defaultMessage="Choose from existing stored credentials or create new stored credentials. Many stored credentials may be associated with a data source."
              />
            </p>
          </EuiText>
        </EuiText>
      </>
    );
  };

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
              <EuiButton onClick={this.onClickCreateNewCredential}>
                Create New Stored Credential
              </EuiButton>
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
        {this.renderCreateStoredCredentialModal()}
      </>
    );
  };

  /* Show Create Stored Credential modal */

  closeModal = () => {
    this.setState({ showCreateCredentialModal: false });
  };

  renderCreateStoredCredentialModal() {
    let modal;

    if (this.state.showCreateCredentialModal) {
      modal = (
        <EuiModal onClose={this.closeModal}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <h1>
                <FormattedMessage
                  id="dataSourcesManagement.createStoredCredential.title"
                  defaultMessage="Create New Stored Credential"
                />
              </h1>
            </EuiModalHeaderTitle>
          </EuiModalHeader>

          <EuiModalBody>
            <h4>
              <FormattedMessage
                id="dataSourcesManagement.createStoredCredential.title"
                defaultMessage="Create New Stored Credential wizard will appear here ..."
              />
            </h4>
          </EuiModalBody>

          <EuiModalFooter>
            <EuiButtonEmpty onClick={this.closeModal}>Cancel</EuiButtonEmpty>

            <EuiButton onClick={this.closeModal} fill>
              Create & Add
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      );
    }
    return <div>{modal}</div>;
  }

  renderContent = () => {
    return (
      <EuiPageContent>
        {this.renderHeader()}
        <EuiHorizontalRule />
        <EuiForm
          data-test-subj="data-source-creation"
          isInvalid={!!this.state.formErrors.length}
          error={this.state.formErrors}
        >
          {/* Endpoint section */}

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

          {/* Endpoint URL */}
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

          {/* Authentication Section: */}

          {this.renderAuthenticationSectionHeader()}

          {this.renderCredentialsSection()}

          <EuiSpacer size="m" />

          <EuiCheckbox
            id="noAuthentication"
            label="Continue without authentication"
            checked={this.state.noAuthentication}
            onChange={this.onChangeNoAuth}
            compressed
          />

          <EuiSpacer size="xl" />
          {/* Create Data Source button*/}
          <EuiButton type="submit" fill onClick={this.onClickCreateNewDataSource}>
            {this.props.wizardMode === MODE_CREATE ? 'Create a data source connection' : 'Update'}
          </EuiButton>
        </EuiForm>
      </EuiPageContent>
    );
  };

  render() {
    return <>{this.renderContent()}</>;
  }
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import {
  EuiButton,
  EuiFieldPassword,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiHorizontalRule,
  EuiPageContent,
  EuiSelectable,
  EuiSpacer,
  EuiSuperSelect,
  EuiText,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import {
  CreateDataSourceFormType,
  CreateNewCredentialType,
  CredentialsComboBoxItem,
  CredentialSourceType,
  DataSourceManagementContextValue,
  ToastMessageItem,
} from '../../../../types';
import { Header } from '../header';
import { getExistingCredentials } from '../../../utils';
import { context as contextType } from '../../../../../../opensearch_dashboards_react/public';
import {
  CreateEditDataSourceValidation,
  defaultValidation,
  performDataSourceFormValidation,
} from '../../../validation/datasource_form_validation';

export interface CreateDataSourceProps {
  handleSubmit: (formValues: CreateDataSourceFormType) => void;
  displayToastMessage: (msg: ToastMessageItem) => void;
  displayLoadingMask: (show: boolean) => void;
}
export interface CreateDataSourceState {
  formErrors: string[];
  formErrorsByField: CreateEditDataSourceValidation;
  dataSourceTitle: string;
  dataSourceDescription: string;
  endpoint: string;
  showCreateCredentialModal: boolean;
  selectedCredentialSourceType: string;
  selectedCredentials: CredentialsComboBoxItem[];
  availableCredentials: CredentialsComboBoxItem[];
  createCredential: CreateNewCredentialType;
}

const defaultCreateCredentialsForm: CreateNewCredentialType = {
  title: '',
  description: '',
  credentialMaterials: {
    credentialMaterialsType: 'username_password',
    credentialMaterialsContent: {
      username: '',
      password: '',
    },
  },
};

const credentialSourceOptions = [
  { value: CredentialSourceType.CreateCredential, inputDisplay: 'Create credential' },
  { value: CredentialSourceType.ExistingCredential, inputDisplay: 'Use stored credential' },
  { value: CredentialSourceType.NoAuth, inputDisplay: 'No authentication' },
];

export class CreateDataSourceForm extends React.Component<
  CreateDataSourceProps,
  CreateDataSourceState
> {
  static contextType = contextType;
  public readonly context!: DataSourceManagementContextValue;

  constructor(props: CreateDataSourceProps, context: DataSourceManagementContextValue) {
    super(props, context);

    this.state = {
      formErrors: [],
      formErrorsByField: { ...defaultValidation },
      dataSourceTitle: '',
      dataSourceDescription: '',
      endpoint: '',
      showCreateCredentialModal: false,
      selectedCredentialSourceType: credentialSourceOptions[1].value,
      selectedCredentials: [],
      availableCredentials: [],
      createCredential: defaultCreateCredentialsForm,
    };
  }

  componentDidMount() {
    this.fetchAvailableCredentials();
  }

  fetchAvailableCredentials() {
    const { savedObjects } = this.context.services;
    this.props.displayLoadingMask(true);
    getExistingCredentials(savedObjects.client)
      .then((fetchedCredentials: CredentialsComboBoxItem[]) => {
        if (fetchedCredentials?.length) {
          this.setState({ availableCredentials: fetchedCredentials });
        }
      })
      .catch(() => {
        this.props.displayToastMessage({
          id: 'dataSourcesManagement.createDataSource.fetchExistingCredentialsFailMsg',
          defaultMessage: 'Error while finding existing credentials.',
          color: 'warning',
          iconType: 'alert',
        });
      })
      .finally(() => {
        this.props.displayLoadingMask(false);
      });
  }

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

  onChangeCredentialSourceType = (value: string) => {
    /* reset already selected existing credential */
    if (
      this.state.selectedCredentials.length &&
      value !== CredentialSourceType.ExistingCredential
    ) {
      this.resetExistingCredentialSelection();
    }

    this.setState({ selectedCredentialSourceType: value }, () => {
      if (this.state.formErrors.length) {
        this.isFormValid();
      }
    });
  };

  resetExistingCredentialSelection = () => {
    this.setState({
      selectedCredentials: [],
      availableCredentials: this.state.availableCredentials?.map((rec) => {
        rec.checked = false;
        return rec;
      }),
    });
  };

  onClickCreateNewDataSource = () => {
    if (this.isFormValid()) {
      const formValues: CreateDataSourceFormType = {
        title: this.state.dataSourceTitle,
        description: this.state.dataSourceDescription,
        endpoint: this.state.endpoint,
        credentialType: this.state.selectedCredentialSourceType,
        credentialId: '',
        newCredential:
          this.state.selectedCredentialSourceType === CredentialSourceType.CreateCredential
            ? this.state.createCredential
            : undefined,
      };
      if (this.state.selectedCredentials?.length) {
        formValues.credentialId = this.state.selectedCredentials[0].id;
      }

      this.props.handleSubmit(formValues);
    }
  };

  onSelectExistingCredentials = (options: CredentialsComboBoxItem[]) => {
    const selectedCredentials: CredentialsComboBoxItem[] = [];
    options.forEach((rec) => {
      if (rec.checked === 'on') {
        selectedCredentials.push(rec);
      }
    });
    this.setState({ availableCredentials: options, selectedCredentials }, () => {
      if (this.state.formErrorsByField.credential.length) {
        this.isFormValid();
      }
    });
  };

  /* Render methods */
  /* Render header*/
  renderHeader = () => {
    const { docLinks } = this.context.services;
    return <Header docLinks={docLinks} />;
  };

  /* Render Section header*/
  renderSectionHeader = (i18nId: string, defaultMessage: string) => {
    return (
      <>
        <EuiText grow={false}>
          <h5>
            <FormattedMessage
              id="dataSourceManagement.connectToDataSource.authenticationHeader"
              defaultMessage={defaultMessage}
            />
          </h5>
        </EuiText>
      </>
    );
  };

  /* Render create new credentials*/

  onChangeCreateCredentialFormField = (
    e: { target: { value: string } },
    field: 'title' | 'description' | 'username' | 'password'
  ) => {
    const {
      title,
      description,
      credentialMaterials,
    }: CreateNewCredentialType = this.state.createCredential;
    this.setState(
      {
        createCredential: {
          title: field === 'title' ? e.target.value : title,
          description: field === 'description' ? e.target.value : description,
          credentialMaterials: {
            credentialMaterialsType: credentialMaterials.credentialMaterialsType,
            credentialMaterialsContent: {
              username:
                field === 'username'
                  ? e.target.value
                  : credentialMaterials.credentialMaterialsContent.username,
              password:
                field === 'password'
                  ? e.target.value
                  : credentialMaterials.credentialMaterialsContent.password,
            },
          },
        },
      },
      () => {
        if (this.state.formErrorsByField.createCredential[field].length) {
          this.isFormValid();
        }
      }
    );
  };

  renderCreateNewCredentialsForm = () => {
    return (
      <>
        <EuiFormRow
          label="Credential Title"
          isInvalid={!!this.state.formErrorsByField.createCredential.title.length}
          error={this.state.formErrorsByField.createCredential.title}
        >
          <EuiFieldText
            isInvalid={!!this.state.formErrorsByField.createCredential.title.length}
            placeholder="Your Credential Name"
            value={this.state.createCredential.title || ''}
            onChange={(e) => this.onChangeCreateCredentialFormField(e, 'title')}
          />
        </EuiFormRow>
        <EuiFormRow
          label="Credential Description"
          isInvalid={!!this.state.formErrorsByField.createCredential.description.length}
          error={this.state.formErrorsByField.createCredential.description}
        >
          <EuiFieldText
            isInvalid={!!this.state.formErrorsByField.createCredential.description.length}
            placeholder="Your Credential Description"
            value={this.state.createCredential.description || ''}
            onChange={(e) => this.onChangeCreateCredentialFormField(e, 'description')}
          />
        </EuiFormRow>
        <EuiFormRow
          label="Username"
          isInvalid={!!this.state.formErrorsByField.createCredential.username.length}
          error={this.state.formErrorsByField.createCredential.username}
        >
          <EuiFieldText
            placeholder="Your Username"
            isInvalid={!!this.state.formErrorsByField.createCredential.username.length}
            value={
              this.state.createCredential.credentialMaterials.credentialMaterialsContent.username ||
              ''
            }
            onChange={(e) => this.onChangeCreateCredentialFormField(e, 'username')}
          />
        </EuiFormRow>
        <EuiFormRow
          label="Password"
          isInvalid={!!this.state.formErrorsByField.createCredential.password.length}
          error={this.state.formErrorsByField.createCredential.password}
        >
          <EuiFieldPassword
            isInvalid={!!this.state.formErrorsByField.createCredential.password.length}
            placeholder="Your Password"
            type={'dual'}
            value={
              this.state.createCredential.credentialMaterials.credentialMaterialsContent.password ||
              ''
            }
            onChange={(e) => this.onChangeCreateCredentialFormField(e, 'password')}
          />
        </EuiFormRow>
      </>
    );
  };

  renderExistingCredentialsSection = () => {
    return (
      <>
        <EuiFlexGroup style={{ maxWidth: 600 }}>
          <EuiFlexItem>
            <EuiFormRow
              hasEmptyLabelSpace
              isInvalid={!!this.state.formErrorsByField.credential.length}
              error={this.state.formErrorsByField.credential}
            >
              <EuiSelectable
                aria-label="Search stored credentials"
                searchable
                searchProps={{
                  'data-test-subj': 'selectExistingCredential',
                  placeholder: 'Search stored credentials',
                  isInvalid: !!this.state.formErrorsByField.credential.length,
                }}
                singleSelection={'always'}
                options={this.state.availableCredentials}
                onChange={(newOptions) => this.onSelectExistingCredentials(newOptions)}
              >
                {(list, search) => (
                  <Fragment>
                    {search}
                    <EuiSpacer size="s" />
                    {list}
                  </Fragment>
                )}
              </EuiSelectable>
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      </>
    );
  };

  /* Show Create Stored Credential modal */

  closeModal = () => {
    this.setState({ showCreateCredentialModal: false });
  };

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
          {this.renderSectionHeader(
            'dataSourceManagement.connectToDataSource.connectionDetails',
            'Connection Details'
          )}
          <EuiSpacer size="s" />

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

          <EuiSpacer size="xl" />

          {this.renderSectionHeader(
            'dataSourceManagement.connectToDataSource.authenticationHeader',
            'Authentication'
          )}

          {/* Credential source */}
          <EuiSpacer size="s" />
          <EuiFormRow label="Credential Source">
            <EuiSuperSelect
              options={credentialSourceOptions}
              valueOfSelected={this.state.selectedCredentialSourceType}
              onChange={(value) => this.onChangeCredentialSourceType(value)}
            />
          </EuiFormRow>

          {/* Create New credentials */}
          {this.state.selectedCredentialSourceType === CredentialSourceType.CreateCredential
            ? this.renderCreateNewCredentialsForm()
            : null}

          {/* Existing credentials */}
          {this.state.selectedCredentialSourceType === CredentialSourceType.ExistingCredential
            ? this.renderExistingCredentialsSection()
            : null}

          <EuiSpacer size="xl" />
          {/* Create Data Source button*/}
          <EuiButton type="submit" fill onClick={this.onClickCreateNewDataSource}>
            Create a data source connection
          </EuiButton>
        </EuiForm>
      </EuiPageContent>
    );
  };

  render() {
    return <>{this.renderContent()}</>;
  }
}

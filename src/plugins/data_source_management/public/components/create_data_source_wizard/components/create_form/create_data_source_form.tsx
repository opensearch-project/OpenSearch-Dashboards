/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiButton,
  EuiFieldPassword,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiPageContent,
  EuiRadioGroup,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  AuthType,
  credentialSourceOptions,
  DataSourceAttributes,
  DataSourceManagementContextValue,
  UsernamePasswordTypedContent,
} from '../../../../types';
import { Header } from '../header';
import { context as contextType } from '../../../../../../opensearch_dashboards_react/public';
import {
  CreateEditDataSourceValidation,
  defaultValidation,
  isTitleValid,
  performDataSourceFormValidation,
} from '../../../validation';
import { isValidUrl } from '../../../utils';

export interface CreateDataSourceProps {
  existingDatasourceNamesList: string[];
  handleSubmit: (formValues: DataSourceAttributes) => void;
}
export interface CreateDataSourceState {
  /* Validation */
  formErrorsByField: CreateEditDataSourceValidation;
  /* Inputs */
  title: string;
  description: string;
  endpoint: string;
  auth: {
    type: AuthType;
    credentials: UsernamePasswordTypedContent;
  };
}

export class CreateDataSourceForm extends React.Component<
  CreateDataSourceProps,
  CreateDataSourceState
> {
  static contextType = contextType;
  public readonly context!: DataSourceManagementContextValue;

  constructor(props: CreateDataSourceProps, context: DataSourceManagementContextValue) {
    super(props, context);

    this.state = {
      formErrorsByField: { ...defaultValidation },
      title: '',
      description: '',
      endpoint: '',
      auth: {
        type: AuthType.UsernamePasswordType,
        credentials: {
          username: '',
          password: '',
        },
      },
    };
  }

  /* Validations */

  isFormValid = () => {
    return performDataSourceFormValidation(this.state, this.props.existingDatasourceNamesList, '');
  };

  /* Events */

  onChangeTitle = (e: { target: { value: any } }) => {
    this.setState({ title: e.target.value });
  };

  validateTitle = () => {
    const isValid = isTitleValid(this.state.title, this.props.existingDatasourceNamesList, '');
    this.setState({
      formErrorsByField: {
        ...this.state.formErrorsByField,
        title: isValid.valid ? [] : [isValid.error],
      },
    });
  };

  onChangeDescription = (e: { target: { value: any } }) => {
    this.setState({ description: e.target.value });
  };

  onChangeEndpoint = (e: { target: { value: any } }) => {
    this.setState({ endpoint: e.target.value });
  };

  validateEndpoint = () => {
    const isValid = isValidUrl(this.state.endpoint);
    this.setState({
      formErrorsByField: {
        ...this.state.formErrorsByField,
        endpoint: isValid ? [] : [''],
      },
    });
  };

  onChangeAuthType = (value: string) => {
    const valueToSave =
      value === AuthType.UsernamePasswordType ? AuthType.UsernamePasswordType : AuthType.NoAuth;

    const formErrorsByField = {
      ...this.state.formErrorsByField,
      createCredential: { ...this.state.formErrorsByField.createCredential },
    };
    if (valueToSave === AuthType.NoAuth) {
      formErrorsByField.createCredential = {
        username: [],
        password: [],
      };
    }
    this.setState({ auth: { ...this.state.auth, type: valueToSave }, formErrorsByField });
  };

  onChangeUsername = (e: { target: { value: any } }) => {
    this.setState({
      auth: {
        ...this.state.auth,
        credentials: { ...this.state.auth.credentials, username: e.target.value },
      },
    });
  };

  validateUsername = () => {
    const isValid = !!this.state.auth.credentials.username?.trim().length;
    this.setState({
      formErrorsByField: {
        ...this.state.formErrorsByField,
        createCredential: {
          ...this.state.formErrorsByField.createCredential,
          username: isValid ? [] : [''],
        },
      },
    });
  };

  onChangePassword = (e: { target: { value: any } }) => {
    this.setState({
      auth: {
        ...this.state.auth,
        credentials: { ...this.state.auth.credentials, password: e.target.value },
      },
    });
  };

  validatePassword = () => {
    const isValid = !!this.state.auth.credentials.password;
    this.setState({
      formErrorsByField: {
        ...this.state.formErrorsByField,
        createCredential: {
          ...this.state.formErrorsByField.createCredential,
          password: isValid ? [] : [''],
        },
      },
    });
  };

  onClickCreateNewDataSource = () => {
    if (this.isFormValid()) {
      const formValues: DataSourceAttributes = {
        title: this.state.title,
        description: this.state.description,
        endpoint: this.state.endpoint,
        auth: { ...this.state.auth },
      };

      /* Remove credentials object for NoAuth */
      if (this.state.auth.type === AuthType.NoAuth) {
        delete formValues.auth.credentials;
      }
      /* Submit */
      this.props.handleSubmit(formValues);
    }
  };

  /* Render methods */

  /* Render header*/
  renderHeader = () => {
    return <Header />;
  };

  /* Render Section header*/
  renderSectionHeader = (i18nId: string, defaultMessage: string) => {
    return (
      <>
        <EuiText grow={false}>
          <h4>
            <FormattedMessage id={i18nId} defaultMessage={defaultMessage} />
          </h4>
        </EuiText>
      </>
    );
  };
  /* Render field label with Optional text*/
  renderFieldLabelAsOptional = (i18nId: string, defaultMessage: string) => {
    return (
      <>
        {<FormattedMessage id={i18nId} defaultMessage={defaultMessage} />}{' '}
        <i style={{ fontWeight: 'normal' }}>
          -{' '}
          {
            <FormattedMessage
              id="dataSourcesManagement.createDataSource.optionalText"
              defaultMessage="optional"
            />
          }
        </i>
      </>
    );
  };

  /* Render create new credentials*/
  renderCreateNewCredentialsForm = () => {
    return (
      <>
        <EuiFormRow
          label={i18n.translate('dataSourcesManagement.createDataSource.username', {
            defaultMessage: 'Username',
          })}
          isInvalid={!!this.state.formErrorsByField.createCredential.username.length}
          error={this.state.formErrorsByField.createCredential.username}
        >
          <EuiFieldText
            placeholder={i18n.translate(
              'dataSourcesManagement.createDataSource.usernamePlaceholder',
              {
                defaultMessage: 'Username to connect to data source',
              }
            )}
            isInvalid={!!this.state.formErrorsByField.createCredential.username.length}
            value={this.state.auth.credentials.username || ''}
            onChange={this.onChangeUsername}
            onBlur={this.validateUsername}
            data-test-subj="createDataSourceFormUsernameField"
          />
        </EuiFormRow>
        <EuiFormRow
          label={i18n.translate('dataSourcesManagement.createDataSource.password', {
            defaultMessage: 'Password',
          })}
          isInvalid={!!this.state.formErrorsByField.createCredential.password.length}
          error={this.state.formErrorsByField.createCredential.password}
        >
          <EuiFieldPassword
            isInvalid={!!this.state.formErrorsByField.createCredential.password.length}
            placeholder={i18n.translate(
              'dataSourcesManagement.createDataSource.passwordPlaceholder',
              {
                defaultMessage: 'Password to connect to data source',
              }
            )}
            type={'dual'}
            value={this.state.auth.credentials.password || ''}
            onChange={this.onChangePassword}
            onBlur={this.validatePassword}
            data-test-subj="createDataSourceFormPasswordField"
          />
        </EuiFormRow>
      </>
    );
  };

  renderContent = () => {
    return (
      <EuiPageContent>
        {this.renderHeader()}
        <EuiSpacer size="m" />
        <EuiForm data-test-subj="data-source-creation">
          {/* Endpoint section */}
          {this.renderSectionHeader(
            'dataSourceManagement.connectToDataSource.connectionDetails',
            'Connection Details'
          )}
          <EuiSpacer size="s" />

          {/* Title */}
          <EuiFormRow
            label={i18n.translate('dataSourcesManagement.createDataSource.title', {
              defaultMessage: 'Title',
            })}
            isInvalid={!!this.state.formErrorsByField.title.length}
            error={this.state.formErrorsByField.title}
          >
            <EuiFieldText
              name="dataSourceTitle"
              value={this.state.title || ''}
              placeholder={i18n.translate(
                'dataSourcesManagement.createDataSource.titlePlaceHolder',
                {
                  defaultMessage: 'Title',
                }
              )}
              isInvalid={!!this.state.formErrorsByField.title.length}
              onChange={this.onChangeTitle}
              onBlur={this.validateTitle}
              data-test-subj="createDataSourceFormTitleField"
            />
          </EuiFormRow>

          {/* Description */}
          <EuiFormRow
            label={this.renderFieldLabelAsOptional(
              'dataSourceManagement.createDataSource.description',
              'Description'
            )}
          >
            <EuiFieldText
              name="dataSourceDescription"
              value={this.state.description || ''}
              placeholder={i18n.translate(
                'dataSourcesManagement.createDataSource.descriptionPlaceholder',
                {
                  defaultMessage: 'Description of the data source',
                }
              )}
              onChange={this.onChangeDescription}
              data-test-subj="createDataSourceFormDescriptionField"
            />
          </EuiFormRow>

          {/* Endpoint URL */}
          <EuiFormRow
            label={i18n.translate('dataSourcesManagement.createDataSource.endpointURL', {
              defaultMessage: 'Endpoint URL',
            })}
            isInvalid={!!this.state.formErrorsByField.endpoint.length}
            error={this.state.formErrorsByField.endpoint}
          >
            <EuiFieldText
              name="endpoint"
              value={this.state.endpoint || ''}
              placeholder={i18n.translate(
                'dataSourcesManagement.createDataSource.endpointPlaceholder',
                {
                  defaultMessage: 'https://connectionurl.com',
                }
              )}
              isInvalid={!!this.state.formErrorsByField.endpoint.length}
              onChange={this.onChangeEndpoint}
              onBlur={this.validateEndpoint}
              data-test-subj="createDataSourceFormEndpointField"
            />
          </EuiFormRow>

          {/* Authentication Section: */}

          <EuiSpacer size="xl" />

          {this.renderSectionHeader(
            'dataSourceManagement.connectToDataSource.authenticationHeader',
            'Authentication Method'
          )}
          <EuiSpacer size="m" />

          <EuiFormRow>
            <EuiText>
              <FormattedMessage
                id="dataSourcesManagement.createDataSource.authenticationMethodDescription"
                defaultMessage="Provide authentication details require to gain access to the endpoint. If no authentication is required, choose "
              />
              <b>
                <FormattedMessage
                  id="dataSourcesManagement.createDataSource.noAuthentication"
                  defaultMessage="No authentication"
                />
              </b>
            </EuiText>
          </EuiFormRow>

          {/* Credential source */}
          <EuiSpacer size="l" />
          <EuiFormRow>
            <EuiRadioGroup
              options={credentialSourceOptions}
              idSelected={this.state.auth.type}
              onChange={(id) => this.onChangeAuthType(id)}
              name="Credential"
              data-test-subj="createDataSourceFormAuthTypeSelect"
            />
          </EuiFormRow>

          {/* Create New credentials */}
          {this.state.auth.type === AuthType.UsernamePasswordType
            ? this.renderCreateNewCredentialsForm()
            : null}

          <EuiSpacer size="xl" />
          {/* Create Data Source button*/}
          <EuiButton
            type="submit"
            fill={this.isFormValid()}
            disabled={!this.isFormValid()}
            onClick={this.onClickCreateNewDataSource}
            data-test-subj="createDataSourceButton"
          >
            <FormattedMessage
              id="dataSourcesManagement.createDataSource.createButton"
              defaultMessage="Create data source connection"
            />
          </EuiButton>
        </EuiForm>
      </EuiPageContent>
    );
  };

  render() {
    return <>{this.renderContent()}</>;
  }
}

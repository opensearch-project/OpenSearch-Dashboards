/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiBottomBar,
  EuiButton,
  EuiButtonEmpty,
  EuiFieldPassword,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiPageContent,
  EuiSelect,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { SigV4Content, SigV4ServiceName } from '../../../../../../data_source/common/data_sources';
import {
  AuthType,
  credentialSourceOptions,
  DataSourceAttributes,
  DataSourceManagementContextValue,
  UsernamePasswordTypedContent,
  sigV4ServiceOptions,
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
  handleTestConnection: (formValues: DataSourceAttributes) => void;
  handleCancel: () => void;
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
    credentials: UsernamePasswordTypedContent | SigV4Content;
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

  onChangeAuthType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const authType = e.target.value as AuthType;
    this.setState({
      auth: {
        ...this.state.auth,
        type: authType,
        credentials: {
          ...this.state.auth.credentials,
          service:
            (this.state.auth.credentials.service as SigV4ServiceName) ||
            SigV4ServiceName.OpenSearch,
        },
      },
    });
  };

  onChangeSigV4ServiceName = (e: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({
      auth: {
        ...this.state.auth,
        credentials: {
          ...this.state.auth.credentials,
          service: e.target.value as SigV4ServiceName,
        },
      },
    });
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

  onChangeRegion = (e: { target: { value: any } }) => {
    this.setState({
      auth: {
        ...this.state.auth,
        credentials: { ...this.state.auth.credentials, region: e.target.value },
      },
    });
  };

  validateRegion = () => {
    const isValid = !!this.state.auth.credentials.region?.trim().length;
    this.setState({
      formErrorsByField: {
        ...this.state.formErrorsByField,
        awsCredential: {
          ...this.state.formErrorsByField.awsCredential,
          region: isValid ? [] : [''],
        },
      },
    });
  };

  onChangeAccessKey = (e: { target: { value: any } }) => {
    this.setState({
      auth: {
        ...this.state.auth,
        credentials: { ...this.state.auth.credentials, accessKey: e.target.value },
      },
    });
  };

  validateAccessKey = () => {
    const isValid = !!this.state.auth.credentials.accessKey;
    this.setState({
      formErrorsByField: {
        ...this.state.formErrorsByField,
        awsCredential: {
          ...this.state.formErrorsByField.awsCredential,
          accessKey: isValid ? [] : [''],
        },
      },
    });
  };

  onChangeSecretKey = (e: { target: { value: any } }) => {
    this.setState({
      auth: {
        ...this.state.auth,
        credentials: { ...this.state.auth.credentials, secretKey: e.target.value },
      },
    });
  };

  validateSecretKey = () => {
    const isValid = !!this.state.auth.credentials.secretKey;
    this.setState({
      formErrorsByField: {
        ...this.state.formErrorsByField,
        awsCredential: {
          ...this.state.formErrorsByField.awsCredential,
          secretKey: isValid ? [] : [''],
        },
      },
    });
  };

  onClickCreateNewDataSource = () => {
    if (this.isFormValid()) {
      const formValues: DataSourceAttributes = this.getFormValues();

      /* Remove credentials object for NoAuth */
      if (this.state.auth.type === AuthType.NoAuth) {
        delete formValues.auth.credentials;
      }
      /* Submit */
      this.props.handleSubmit(formValues);
    }
  };

  onClickTestConnection = () => {
    if (this.isFormValid()) {
      /* Submit */
      this.props.handleTestConnection(this.getFormValues());
    }
  };

  getFormValues = (): DataSourceAttributes => {
    let credentials = this.state.auth.credentials;
    if (this.state.auth.type === AuthType.UsernamePasswordType) {
      credentials = {
        username: this.state.auth.credentials.username,
        password: this.state.auth.credentials.password,
      } as UsernamePasswordTypedContent;
    }
    if (this.state.auth.type === AuthType.SigV4) {
      credentials = {
        region: this.state.auth.credentials.region,
        accessKey: this.state.auth.credentials.accessKey,
        secretKey: this.state.auth.credentials.secretKey,
        service: this.state.auth.credentials.service || SigV4ServiceName.OpenSearch,
      } as SigV4Content;
    }

    return {
      title: this.state.title,
      description: this.state.description,
      endpoint: this.state.endpoint,
      auth: { ...this.state.auth, credentials },
    };
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
  renderCreateNewCredentialsForm = (type: AuthType) => {
    switch (type) {
      case AuthType.UsernamePasswordType:
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
                spellCheck={false}
                data-test-subj="createDataSourceFormPasswordField"
              />
            </EuiFormRow>
          </>
        );
      case AuthType.SigV4:
        return (
          <>
            <EuiFormRow
              label={i18n.translate('dataSourcesManagement.createDataSource.region', {
                defaultMessage: 'Region',
              })}
              isInvalid={!!this.state.formErrorsByField.awsCredential.region.length}
              error={this.state.formErrorsByField.awsCredential.region}
            >
              <EuiFieldText
                placeholder={i18n.translate(
                  'dataSourcesManagement.createDataSource.regionPlaceholder',
                  {
                    defaultMessage: 'AWS Region, e.g. us-west-2',
                  }
                )}
                isInvalid={!!this.state.formErrorsByField.awsCredential.region.length}
                value={this.state.auth.credentials.region || ''}
                onChange={this.onChangeRegion}
                onBlur={this.validateRegion}
                data-test-subj="createDataSourceFormRegionField"
              />
            </EuiFormRow>
            <EuiFormRow
              label={i18n.translate('dataSourcesManagement.createDataSource.serviceName', {
                defaultMessage: 'Service Name',
              })}
            >
              <EuiSelect
                options={sigV4ServiceOptions}
                value={this.state.auth.credentials.service}
                onChange={(e) => this.onChangeSigV4ServiceName(e)}
                name="ServiceName"
                data-test-subj="createDataSourceFormSigV4ServiceTypeSelect"
              />
            </EuiFormRow>
            <EuiFormRow
              label={i18n.translate('dataSourcesManagement.createDataSource.accessKey', {
                defaultMessage: 'Access Key',
              })}
              isInvalid={!!this.state.formErrorsByField.awsCredential.accessKey.length}
              error={this.state.formErrorsByField.awsCredential.accessKey}
            >
              <EuiFieldPassword
                isInvalid={!!this.state.formErrorsByField.awsCredential.accessKey.length}
                placeholder={i18n.translate(
                  'dataSourcesManagement.createDataSource.accessKeyPlaceholder',
                  {
                    defaultMessage: 'AWS access key',
                  }
                )}
                type={'dual'}
                value={this.state.auth.credentials.accessKey || ''}
                onChange={this.onChangeAccessKey}
                onBlur={this.validateAccessKey}
                spellCheck={false}
                data-test-subj="createDataSourceFormAccessKeyField"
              />
            </EuiFormRow>
            <EuiFormRow
              label={i18n.translate('dataSourcesManagement.createDataSource.secretKey', {
                defaultMessage: 'Secret Key',
              })}
              isInvalid={!!this.state.formErrorsByField.awsCredential.secretKey.length}
              error={this.state.formErrorsByField.awsCredential.secretKey}
            >
              <EuiFieldPassword
                isInvalid={!!this.state.formErrorsByField.awsCredential.secretKey.length}
                placeholder={i18n.translate(
                  'dataSourcesManagement.createDataSource.secretKeyPlaceholder',
                  {
                    defaultMessage: 'AWS secret key',
                  }
                )}
                type={'dual'}
                value={this.state.auth.credentials.secretKey || ''}
                onChange={this.onChangeSecretKey}
                onBlur={this.validateSecretKey}
                spellCheck={false}
                data-test-subj="createDataSourceFormSecretKeyField"
              />
            </EuiFormRow>
          </>
        );

      default:
        break;
    }
  };

  renderContent = () => {
    return (
      <>
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
                  defaultMessage="Enter the authentication details to access the endpoint. If no authentication is required, select "
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
              <EuiSelect
                options={credentialSourceOptions}
                value={this.state.auth.type}
                onChange={(e) => this.onChangeAuthType(e)}
                name="Credential"
                data-test-subj="createDataSourceFormAuthTypeSelect"
              />
            </EuiFormRow>

            {/* Create New credentials */}
            {this.state.auth.type === AuthType.UsernamePasswordType
              ? this.renderCreateNewCredentialsForm(this.state.auth.type)
              : null}

            {this.state.auth.type === AuthType.SigV4
              ? this.renderCreateNewCredentialsForm(this.state.auth.type)
              : null}

            <EuiSpacer size="xl" />
            <EuiFormRow>
              <EuiFlexGroup>
                <EuiFlexItem grow={false}>
                  {/* Test Connection button*/}
                  <EuiButton
                    type="submit"
                    fill={false}
                    disabled={!this.isFormValid()}
                    onClick={this.onClickTestConnection}
                    data-test-subj="createDataSourceTestConnectionButton"
                  >
                    <FormattedMessage
                      id="dataSourcesManagement.createDataSource.testConnectionButton"
                      defaultMessage="Test connection"
                    />
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFormRow>
          </EuiForm>
        </EuiPageContent>
        <EuiSpacer size="xxl" />
        <EuiSpacer size="xl" />
        {this.renderBottomBar()}
      </>
    );
  };

  renderBottomBar = () => {
    return (
      <EuiBottomBar data-test-subj="datasource-create-bottomBar" affordForDisplacement={true}>
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
              onClick={this.props.handleCancel}
              aria-describedby="aria-describedby.countOfUnsavedSettings"
              data-test-subj="cancelCreateDataSourceButton"
            >
              <FormattedMessage
                id="dataSourcesManagement.createDataSource.cancelButtonLabel"
                defaultMessage="Cancel"
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              className="mgtAdvancedSettingsForm__button"
              disabled={!this.isFormValid()}
              color="secondary"
              fill={this.isFormValid()}
              size="s"
              iconType="check"
              onClick={this.onClickCreateNewDataSource}
              data-test-subj="createDataSourceButton"
            >
              <FormattedMessage
                id="dataSourcesManagement.createDataSource.createButtonLabel"
                defaultMessage="Create data source"
              />
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiBottomBar>
    );
  };

  render() {
    return <>{this.renderContent()}</>;
  }
}

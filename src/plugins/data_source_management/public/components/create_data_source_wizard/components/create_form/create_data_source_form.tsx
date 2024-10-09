/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiBottomBar,
  EuiSmallButton,
  EuiButton,
  EuiButtonEmpty,
  EuiCompressedFieldPassword,
  EuiCompressedFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiCompressedFormRow,
  EuiPageContent,
  EuiCompressedSuperSelect,
  EuiSpacer,
  EuiText,
  EuiSuperSelectOption,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { NavigationPublicPluginStart } from 'src/plugins/navigation/public';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { AuthenticationMethodRegistry } from '../../../../auth_registry';
import { SigV4Content, SigV4ServiceName } from '../../../../../../data_source/common/data_sources';
import {
  AuthType,
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
import {
  extractRegisteredAuthTypeCredentials,
  getDefaultAuthMethod,
  isValidUrl,
} from '../../../utils';
import { DataSourceOptionalLabelSuffix } from '../../../data_source_optional_label_suffix';

export interface CreateDataSourceProps {
  useNewUX: boolean;
  navigation: NavigationPublicPluginStart;
  application: ApplicationStart;
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
    type: AuthType | string;
    credentials:
      | UsernamePasswordTypedContent
      | SigV4Content
      | { [key: string]: string }
      | undefined;
  };
}

export class CreateDataSourceForm extends React.Component<
  CreateDataSourceProps,
  CreateDataSourceState
> {
  static contextType = contextType;
  public readonly context!: DataSourceManagementContextValue;

  authOptions: Array<EuiSuperSelectOption<string>> = [];
  isNoAuthOptionEnabled: boolean;
  authenticationMethodRegistry: AuthenticationMethodRegistry;

  constructor(props: CreateDataSourceProps, context: DataSourceManagementContextValue) {
    super(props, context);

    this.authenticationMethodRegistry = context.services.authenticationMethodRegistry;
    const registeredAuthMethods = this.authenticationMethodRegistry.getAllAuthenticationMethods();
    const initialSelectedAuthMethod = getDefaultAuthMethod(this.authenticationMethodRegistry);

    this.isNoAuthOptionEnabled =
      this.authenticationMethodRegistry.getAuthenticationMethod(AuthType.NoAuth) !== undefined;

    this.authOptions = registeredAuthMethods.map((authMethod) => {
      return authMethod.credentialSourceOption;
    });

    this.state = {
      formErrorsByField: { ...defaultValidation },
      title: '',
      description: '',
      endpoint: '',
      auth: {
        type: initialSelectedAuthMethod?.name,
        credentials: {
          ...initialSelectedAuthMethod?.credentialFormField,
        },
      },
    };
  }

  /* Validations */

  isFormValid = () => {
    return performDataSourceFormValidation(
      this.state,
      this.props.existingDatasourceNamesList,
      '',
      this.authenticationMethodRegistry
    );
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

  onChangeAuthType = (authType: AuthType) => {
    const credentials = this.state.auth.credentials;

    const registeredAuthCredentials = extractRegisteredAuthTypeCredentials(
      (credentials ?? {}) as { [key: string]: string },
      authType,
      this.authenticationMethodRegistry
    );

    this.setState({
      auth: {
        ...this.state.auth,
        type: authType,
        credentials: {
          ...registeredAuthCredentials,
        },
      },
    });
  };

  onChangeSigV4ServiceName = (service: SigV4ServiceName) => {
    this.setState({
      auth: {
        ...this.state.auth,
        credentials: {
          ...this.state.auth.credentials,
          service,
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
    const authType = this.state.auth.type;

    if (authType === AuthType.NoAuth) {
      credentials = {};
    } else if (authType === AuthType.UsernamePasswordType) {
      credentials = {
        username: this.state.auth.credentials.username,
        password: this.state.auth.credentials.password,
      } as UsernamePasswordTypedContent;
    } else if (authType === AuthType.SigV4) {
      credentials = {
        region: this.state.auth.credentials.region,
        accessKey: this.state.auth.credentials.accessKey,
        secretKey: this.state.auth.credentials.secretKey,
        service: this.state.auth.credentials.service || SigV4ServiceName.OpenSearch,
      } as SigV4Content;
    } else {
      const currentCredentials = (credentials ?? {}) as { [key: string]: string };
      credentials = extractRegisteredAuthTypeCredentials(
        currentCredentials,
        authType,
        this.authenticationMethodRegistry
      );
    }

    return {
      title: this.state.title,
      description: this.state.description,
      endpoint: this.state.endpoint,
      auth: { ...this.state.auth, credentials },
    };
  };

  handleStateChange = (state: any) => {
    this.setState(state);
  };

  getCredentialFormFromRegistry = (authType: string) => {
    const registeredAuthMethod = this.authenticationMethodRegistry.getAuthenticationMethod(
      authType
    );
    const authCredentialForm = registeredAuthMethod?.credentialForm;

    if (authCredentialForm !== undefined) {
      return authCredentialForm(this.state, this.handleStateChange);
    }

    return null;
  };

  description = [
    {
      renderComponent: (
        <EuiText size="s" color="subdued">
          <FormattedMessage
            id="dataSourcesManagement.createDataSource.description"
            defaultMessage="Create a new data source connection to help you retrieve data from an external OpenSearch compatible source."
          />
        </EuiText>
      ),
    },
  ];

  /* Render methods */

  /* Render header*/
  renderHeader = () => {
    return this.props.useNewUX ? (
      <this.props.navigation.ui.HeaderControl
        setMountPoint={this.props.application.setAppDescriptionControls}
        controls={this.description}
      />
    ) : (
      <Header />
    );
  };

  /* Render create new credentials*/
  renderCreateNewCredentialsForm = (type: AuthType) => {
    switch (type) {
      case AuthType.NoAuth:
        return null;
      case AuthType.UsernamePasswordType:
        return (
          <>
            <EuiCompressedFormRow
              label={i18n.translate('dataSourcesManagement.createDataSource.username', {
                defaultMessage: 'Username',
              })}
              isInvalid={!!this.state.formErrorsByField.createCredential.username.length}
              error={this.state.formErrorsByField.createCredential.username}
            >
              <EuiCompressedFieldText
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
            </EuiCompressedFormRow>
            <EuiCompressedFormRow
              label={i18n.translate('dataSourcesManagement.createDataSource.password', {
                defaultMessage: 'Password',
              })}
              isInvalid={!!this.state.formErrorsByField.createCredential.password.length}
              error={this.state.formErrorsByField.createCredential.password}
            >
              <EuiCompressedFieldPassword
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
            </EuiCompressedFormRow>
          </>
        );
      case AuthType.SigV4:
        return (
          <>
            <EuiCompressedFormRow
              label={i18n.translate('dataSourcesManagement.createDataSource.region', {
                defaultMessage: 'Region',
              })}
              isInvalid={!!this.state.formErrorsByField.awsCredential.region.length}
              error={this.state.formErrorsByField.awsCredential.region}
            >
              <EuiCompressedFieldText
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
            </EuiCompressedFormRow>
            <EuiCompressedFormRow
              label={i18n.translate('dataSourcesManagement.createDataSource.serviceName', {
                defaultMessage: 'Service Name',
              })}
            >
              <EuiCompressedSuperSelect
                options={sigV4ServiceOptions}
                valueOfSelected={this.state.auth.credentials.service}
                onChange={(value) => this.onChangeSigV4ServiceName(value)}
                name="ServiceName"
                data-test-subj="createDataSourceFormSigV4ServiceTypeSelect"
              />
            </EuiCompressedFormRow>
            <EuiCompressedFormRow
              label={i18n.translate('dataSourcesManagement.createDataSource.accessKey', {
                defaultMessage: 'Access Key',
              })}
              isInvalid={!!this.state.formErrorsByField.awsCredential.accessKey.length}
              error={this.state.formErrorsByField.awsCredential.accessKey}
            >
              <EuiCompressedFieldPassword
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
            </EuiCompressedFormRow>
            <EuiCompressedFormRow
              label={i18n.translate('dataSourcesManagement.createDataSource.secretKey', {
                defaultMessage: 'Secret Key',
              })}
              isInvalid={!!this.state.formErrorsByField.awsCredential.secretKey.length}
              error={this.state.formErrorsByField.awsCredential.secretKey}
            >
              <EuiCompressedFieldPassword
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
            </EuiCompressedFormRow>
          </>
        );

      default:
        return this.getCredentialFormFromRegistry(type);
    }
  };

  renderContent = () => {
    return (
      <>
        <EuiPageContent>
          {this.renderHeader()}
          <EuiForm data-test-subj="data-source-creation">
            {/* Endpoint section */}
            <EuiText grow={false} size="s">
              <h2>
                <FormattedMessage
                  id="dataSourcesManagement.connectToDataSource.connectionDetails"
                  defaultMessage="Connection Details"
                />
              </h2>
            </EuiText>
            <EuiSpacer size="s" />

            {/* Title */}
            <EuiCompressedFormRow
              label={i18n.translate('dataSourcesManagement.createDataSource.title', {
                defaultMessage: 'Title',
              })}
              isInvalid={!!this.state.formErrorsByField.title.length}
              error={this.state.formErrorsByField.title}
            >
              <EuiCompressedFieldText
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
            </EuiCompressedFormRow>

            {/* Description */}
            <EuiCompressedFormRow
              label={
                <FormattedMessage
                  id="dataSourcesManagement.createDataSource.descriptionOptional"
                  defaultMessage="Description {optionalLabel}"
                  values={{ optionalLabel: <DataSourceOptionalLabelSuffix /> }}
                />
              }
            >
              <EuiCompressedFieldText
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
            </EuiCompressedFormRow>

            {/* Endpoint URL */}
            <EuiCompressedFormRow
              label={i18n.translate('dataSourcesManagement.createDataSource.endpointURL', {
                defaultMessage: 'Endpoint URL',
              })}
              isInvalid={!!this.state.formErrorsByField.endpoint.length}
              error={this.state.formErrorsByField.endpoint}
            >
              <EuiCompressedFieldText
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
            </EuiCompressedFormRow>

            {/* Authentication Section: */}

            <EuiSpacer size="xl" />

            <EuiText grow={false} size="s">
              <h2>
                <FormattedMessage
                  id="dataSourcesManagement.connectToDataSource.authenticationHeader"
                  defaultMessage="Authentication Method"
                />
              </h2>
            </EuiText>

            <EuiSpacer size="m" />

            <EuiCompressedFormRow>
              <EuiText size="s">
                {this.isNoAuthOptionEnabled ? (
                  <FormattedMessage
                    id="dataSourcesManagement.createDataSource.authenticationMethodDescriptionWithNoAuth"
                    defaultMessage="Enter the authentication details to access the endpoint. If no authentication is required, select {buttonLabel}."
                    values={{ buttonLabel: <b>No authentication</b> }}
                  />
                ) : (
                  <FormattedMessage
                    id="dataSourcesManagement.createDataSource.authenticationMethodDescription"
                    defaultMessage="Enter the authentication details to access the endpoint."
                  />
                )}
              </EuiText>
            </EuiCompressedFormRow>

            {/* Credential source */}
            <EuiSpacer size="l" />
            <EuiCompressedFormRow>
              <EuiCompressedSuperSelect
                options={this.authOptions}
                valueOfSelected={this.state.auth.type}
                onChange={(value) => this.onChangeAuthType(value)}
                disabled={this.authOptions.length <= 1}
                name="Credential"
                data-test-subj="createDataSourceFormAuthTypeSelect"
              />
            </EuiCompressedFormRow>

            {/* Create New credentials */}
            {this.renderCreateNewCredentialsForm(this.state.auth.type)}

            <EuiSpacer size="xl" />
            <EuiCompressedFormRow>
              <EuiFlexGroup>
                <EuiFlexItem grow={false}>
                  {/* Test Connection button*/}
                  <EuiSmallButton
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
                  </EuiSmallButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiCompressedFormRow>
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
                defaultMessage="Connect to OpenSearch Cluster"
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

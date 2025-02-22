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
  EuiDescribedFormGroup,
  EuiCompressedFieldPassword,
  EuiCompressedFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiCompressedFormRow,
  EuiHorizontalRule,
  EuiPanel,
  EuiCompressedSuperSelect,
  EuiSpacer,
  EuiText,
  EuiSuperSelectOption,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import deepEqual from 'fast-deep-equal';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { NavigationPublicPluginStart } from 'src/plugins/navigation/public';
import { AuthenticationMethodRegistry } from '../../../../auth_registry';
import { SigV4Content, SigV4ServiceName } from '../../../../../../data_source/common/data_sources';
import { Header } from '../header';
import {
  AuthType,
  DataSourceAttributes,
  DataSourceManagementContextValue,
  DataSourceManagementToastMessageItem,
  sigV4ServiceOptions,
  UsernamePasswordTypedContent,
} from '../../../../types';
import { context as contextType } from '../../../../../../opensearch_dashboards_react/public';
import {
  CreateEditDataSourceValidation,
  defaultValidation,
  isTitleValid,
  performDataSourceFormValidation,
} from '../../../validation';
import { UpdatePasswordModal } from '../update_password_modal';
import { UpdateAwsCredentialModal } from '../update_aws_credential_modal';
import { extractRegisteredAuthTypeCredentials, getDefaultAuthMethod } from '../../../utils';
import { DataSourceOptionalLabelSuffix } from '../../../data_source_optional_label_suffix';

export interface EditDataSourceProps {
  navigation: NavigationPublicPluginStart;
  application: ApplicationStart;
  useNewUX: boolean;
  existingDataSource: DataSourceAttributes;
  existingDatasourceNamesList: string[];
  isDefault: boolean;
  handleSubmit: (formValues: DataSourceAttributes) => Promise<void>;
  handleTestConnection: (formValues: DataSourceAttributes) => Promise<void>;
  onDeleteDataSource?: () => Promise<void>;
  onSetDefaultDataSource: () => Promise<boolean>;
  displayToastMessage: (info: DataSourceManagementToastMessageItem) => void;
  canManageDataSource: boolean;
}
export interface EditDataSourceState {
  formErrorsByField: CreateEditDataSourceValidation;
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
  showUpdatePasswordModal: boolean;
  showUpdateAwsCredentialModal: boolean;
  showUpdateOptions: boolean;
  isLoading: boolean;
}

export class EditDataSourceForm extends React.Component<EditDataSourceProps, EditDataSourceState> {
  static contextType = contextType;
  public readonly context!: DataSourceManagementContextValue;
  maskedPassword: string = '********';
  authOptions: Array<EuiSuperSelectOption<string>> = [];
  authenticationMethodRegistry: AuthenticationMethodRegistry;

  constructor(props: EditDataSourceProps, context: DataSourceManagementContextValue) {
    super(props, context);

    this.authenticationMethodRegistry = context.services.authenticationMethodRegistry;
    this.authOptions = this.authenticationMethodRegistry
      .getAllAuthenticationMethods()
      .map((authMethod) => {
        return authMethod.credentialSourceOption;
      });

    const initialSelectedAuthMethod = getDefaultAuthMethod(this.authenticationMethodRegistry);

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
      showUpdatePasswordModal: false,
      showUpdateAwsCredentialModal: false,
      showUpdateOptions: false,
      isLoading: false,
    };
  }

  componentDidMount() {
    this.setFormValuesForEditMode();
  }

  resetFormValues = () => {
    this.setFormValuesForEditMode();
    this.setState({ showUpdateOptions: false });
  };

  setFormValuesForEditMode() {
    if (this.props.existingDataSource) {
      const { title, description, endpoint, auth } = this.props.existingDataSource;

      const registeredAuthCredentials = extractRegisteredAuthTypeCredentials(
        (auth.credentials ?? {}) as { [key: string]: string },
        auth.type,
        this.authenticationMethodRegistry
      );

      this.setState({
        title,
        description: description || '',
        endpoint,
        auth: {
          type: auth.type,
          credentials: {
            ...registeredAuthCredentials,
          },
        },
      });
    }
  }

  /* Validations */

  isFormValid = () => {
    return performDataSourceFormValidation(
      this.state,
      this.props.existingDatasourceNamesList,
      this.props.existingDataSource.title,
      this.authenticationMethodRegistry
    );
  };

  /* Events */

  onChangeTitle = (e: { target: { value: any } }) => {
    this.setState({ title: e.target.value });
  };

  validateTitle = () => {
    const isValid = isTitleValid(
      this.state.title,
      this.props.existingDatasourceNamesList,
      this.props.existingDataSource.title
    );
    this.setState({
      formErrorsByField: {
        ...this.state.formErrorsByField,
        title: isValid.valid ? [] : [isValid.error],
      },
    });
  };

  onChangeAuthType = (authType: AuthType) => {
    /* If the selected authentication type matches, utilize the existing data source's credentials directly.*/
    const credentials =
      this.props.existingDataSource && authType === this.props.existingDataSource.auth.type
        ? this.props.existingDataSource.auth.credentials
        : this.state.auth.credentials;
    const registeredAuthCredentials = extractRegisteredAuthTypeCredentials(
      (credentials ?? {}) as { [key: string]: string },
      authType,
      this.authenticationMethodRegistry
    );

    this.setState(
      {
        auth: {
          ...this.state.auth,
          type: authType,
          credentials: {
            ...registeredAuthCredentials,
          },
        },
      },
      () => {
        this.onChangeFormValues();
      }
    );
  };

  onChangeDescription = (e: { target: { value: any } }) => {
    this.setState({ description: e.target.value });
  };

  onChangeUsername = (e: { target: { value: any } }) => {
    this.setState({
      auth: {
        ...this.state.auth,
        credentials: {
          ...this.state.auth.credentials,
          username: e.target.value,
        } as UsernamePasswordTypedContent,
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

  onChangePassword = (e: { target: { value: any } }) => {
    this.setState({
      auth: {
        ...this.state.auth,
        credentials: {
          ...this.state.auth.credentials,
          password: e.target.value,
        } as UsernamePasswordTypedContent,
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
        } as SigV4Content,
      },
    });
  };

  onChangeRegion = (e: { target: { value: any } }) => {
    this.setState({
      auth: {
        ...this.state.auth,
        credentials: { ...this.state.auth.credentials, region: e.target.value } as SigV4Content,
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
        credentials: { ...this.state.auth.credentials, accessKey: e.target.value } as SigV4Content,
      },
    });
  };

  validateAccessKey = () => {
    const isValid = !!this.state.auth.credentials?.accessKey;
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
        credentials: { ...this.state.auth.credentials, secretKey: e.target.value } as SigV4Content,
      },
    });
  };

  validateSecretKey = () => {
    const isValid = !!this.state.auth.credentials?.secretKey;
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

  onClickUpdateDataSource = async () => {
    if (this.isFormValid()) {
      // update data source endpoint is currently not supported/allowed
      const formValues: DataSourceAttributes = {
        title: this.state.title,
        description: this.state.description,
        auth: this.state.auth,
      };

      switch (this.state.auth.type) {
        case AuthType.NoAuth:
          delete formValues.auth.credentials;
          break;
        case AuthType.SigV4:
          delete formValues.auth.credentials?.username;
          delete formValues.auth.credentials?.password;
          /* Remove access key and secret key if previously & currently SigV4 auth method is selected*/
          if (this.props.existingDataSource.auth.type === this.state.auth.type) {
            delete formValues.auth.credentials?.accessKey;
            delete formValues.auth.credentials?.secretKey;
          }
          break;
        case AuthType.UsernamePasswordType:
          delete formValues.auth.credentials?.accessKey;
          delete formValues.auth.credentials?.secretKey;
          delete formValues.auth.credentials?.region;
          /* Remove password if previously & currently username & password auth method is selected*/
          if (this.props.existingDataSource.auth.type === this.state.auth.type)
            delete formValues.auth.credentials?.password;
          break;
        default:
          const currentCredentials = (this.state.auth.credentials ?? {}) as {
            [key: string]: string;
          };
          formValues.auth.credentials = extractRegisteredAuthTypeCredentials(
            currentCredentials,
            this.state.auth.type,
            this.authenticationMethodRegistry
          );
          break;
      }

      /* Submit */
      this.setState({ isLoading: true });
      try {
        await this.props.handleSubmit(formValues);
        this.setState({ showUpdateOptions: false });
        this.setFormValuesForEditMode();
      } catch (e) {
        this.props.displayToastMessage({
          message: i18n.translate('dataSourcesManagement.editDataSource.editDataSourceFailMsg', {
            defaultMessage: 'Updating the Data Source failed with some errors.',
          }),
        });
      } finally {
        this.setState({ isLoading: false });
      }
    }
  };

  onClickDeleteDataSource = async () => {
    if (this.props.onDeleteDataSource) {
      await this.props.onDeleteDataSource();
    }
  };

  setDefaultDataSource = async () => {
    return await this.props.onSetDefaultDataSource();
  };

  onClickTestConnection = async () => {
    this.setState({ isLoading: true });
    const isNewCredential = !!(this.state.auth.type !== this.props.existingDataSource.auth.type);

    let credentials = this.state.auth.credentials;

    switch (this.state.auth.type) {
      case AuthType.UsernamePasswordType:
        credentials = {
          username: this.state.auth.credentials?.username,
          password: isNewCredential ? this.state.auth.credentials?.password : '',
        } as UsernamePasswordTypedContent;
        break;
      case AuthType.SigV4:
        credentials = {
          service: this.state.auth.credentials?.service,
          region: this.state.auth.credentials?.region,
          accessKey: isNewCredential ? this.state.auth.credentials?.accessKey : '',
          secretKey: isNewCredential ? this.state.auth.credentials?.secretKey : '',
        } as SigV4Content;
        break;
      case AuthType.NoAuth:
        credentials = undefined;
        break;

      default:
        const currentCredentials = (this.state.auth.credentials ?? {}) as {
          [key: string]: string;
        };
        credentials = extractRegisteredAuthTypeCredentials(
          currentCredentials,
          this.state.auth.type,
          this.authenticationMethodRegistry
        );
        break;
    }

    const formValues: DataSourceAttributes = {
      title: this.state.title,
      description: this.state.description,
      endpoint: this.state.endpoint,
      auth: { ...this.state.auth, credentials },
    };

    try {
      await this.props.handleTestConnection(formValues);

      this.props.displayToastMessage({
        message: i18n.translate('dataSourcesManagement.editDataSource.testConnectionSuccessMsg', {
          defaultMessage:
            'Connecting to the endpoint using the provided authentication method was successful.',
        }),
        success: true,
      });
    } catch (e) {
      this.props.displayToastMessage({
        message: i18n.translate('dataSourcesManagement.editDataSource.testConnectionFailMsg', {
          defaultMessage:
            'Failed Connecting to the endpoint using the provided authentication method.',
        }),
      });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  onChangeFormValues = () => {
    setTimeout(() => {
      this.didFormValuesChange();
    }, 0);
  };

  /* Create new credentials*/
  onClickUpdatePassword = () => {
    this.setState({ showUpdatePasswordModal: true });
  };

  onClickUpdateAwsCredential = () => {
    this.setState({ showUpdateAwsCredentialModal: true });
  };

  /* Update password */
  updatePassword = async (password: string) => {
    const { title, description, auth } = this.props.existingDataSource;
    const updateAttributes: DataSourceAttributes = {
      title,
      description,
      endpoint: undefined,
      auth: {
        type: auth.type,
        credentials: {
          username: auth.credentials ? auth.credentials.username : '',
          password,
        } as UsernamePasswordTypedContent,
      },
    };
    this.closePasswordModal();

    try {
      await this.props.handleSubmit(updateAttributes);
      this.props.displayToastMessage({
        message: i18n.translate('dataSourcesManagement.editDataSource.updatePasswordSuccessMsg', {
          defaultMessage: 'Password updated successfully.',
        }),
        success: true,
      });
    } catch (e) {
      this.props.displayToastMessage({
        message: i18n.translate('dataSourcesManagement.editDataSource.updatePasswordFailMsg', {
          defaultMessage: 'Updating the stored password failed with some errors.',
        }),
      });
    }
  };

  /* Update aws credential */
  updateAwsCredential = async (accessKey: string, secretKey: string) => {
    const { title, description, auth } = this.props.existingDataSource;
    const updateAttributes: DataSourceAttributes = {
      title,
      description,
      endpoint: undefined,
      auth: {
        type: auth.type,
        credentials: {
          region: auth.credentials ? auth.credentials.region : '',
          accessKey,
          secretKey,
        } as SigV4Content,
      },
    };
    this.closeAwsCredentialModal();

    try {
      await this.props.handleSubmit(updateAttributes);
      this.props.displayToastMessage({
        message: i18n.translate('dataSourcesManagement.editDataSource.updatePasswordSuccessMsg', {
          defaultMessage: 'Password updated successfully.',
        }),
        success: true,
      });
    } catch (e) {
      this.props.displayToastMessage({
        message: i18n.translate('dataSourcesManagement.editDataSource.updatePasswordFailMsg', {
          defaultMessage: 'Updating the stored password failed with some errors.',
        }),
      });
    }
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

  /* Render methods */

  /* Render modal for new credential */
  closePasswordModal = () => {
    this.setState({ showUpdatePasswordModal: false });
  };

  closeAwsCredentialModal = () => {
    this.setState({ showUpdateAwsCredentialModal: false });
  };

  renderUpdatePasswordModal = () => {
    return (
      <>
        <EuiSmallButton
          onClick={this.onClickUpdatePassword}
          disabled={!this.props.canManageDataSource}
          data-test-subj="editDatasourceUpdatePasswordBtn"
        >
          {
            <FormattedMessage
              id="dataSourcesManagement.editDataSource.updateStoredPassword"
              defaultMessage="Update stored password"
            />
          }
        </EuiSmallButton>

        {this.state.showUpdatePasswordModal ? (
          <UpdatePasswordModal
            username={this.state.auth?.credentials?.username || ''}
            handleUpdatePassword={this.updatePassword}
            closeUpdatePasswordModal={this.closePasswordModal}
            canManageDataSource={this.props.canManageDataSource}
          />
        ) : null}
      </>
    );
  };

  renderUpdateAwsCredentialModal = () => {
    return (
      <>
        <EuiSmallButton
          onClick={this.onClickUpdateAwsCredential}
          data-test-subj="editDatasourceUpdateAwsCredentialBtn"
          disabled={!this.props.canManageDataSource}
        >
          {
            <FormattedMessage
              id="dataSourcesManagement.editDataSource.updateStoredAwsCredential"
              defaultMessage="Update stored AWS credential"
            />
          }
        </EuiSmallButton>

        {this.state.showUpdateAwsCredentialModal ? (
          <UpdateAwsCredentialModal
            region={this.state.auth.credentials!.region}
            service={this.state.auth.credentials!.service}
            handleUpdateAwsCredential={this.updateAwsCredential}
            closeUpdateAwsCredentialModal={this.closeAwsCredentialModal}
            canManageDataSource={this.props.canManageDataSource}
          />
        ) : null}
      </>
    );
  };

  /* Render header*/
  renderHeader = () => {
    return (
      <Header
        navigation={this.props.navigation}
        application={this.props.application}
        useNewUX={this.props.useNewUX}
        showDeleteIcon={true}
        isFormValid={this.isFormValid()}
        onClickDeleteIcon={this.onClickDeleteDataSource}
        dataSourceName={this.props.existingDataSource.title}
        onClickTestConnection={this.onClickTestConnection}
        onClickSetDefault={this.setDefaultDataSource}
        isDefault={this.props.isDefault}
        canManageDataSource={this.props.canManageDataSource}
      />
    );
  };

  /* Render Connection Details Panel */
  renderConnectionDetailsSection = () => {
    return (
      <EuiPanel paddingSize="m">
        <EuiText size="s">
          <h2>
            {
              <FormattedMessage
                id="dataSourcesManagement.editDataSource.connectionDetailsText"
                defaultMessage="Connection Details"
              />
            }
          </h2>
        </EuiText>

        <EuiHorizontalRule margin="m" />

        <EuiDescribedFormGroup
          title={
            <EuiText size="s">
              <h3>
                {
                  <FormattedMessage
                    id="dataSourcesManagement.editDataSource.objectDetailsText"
                    defaultMessage="Object Details"
                  />
                }
              </h3>
            </EuiText>
          }
          description={
            <p>
              {
                <FormattedMessage
                  id="dataSourcesManagement.editDataSource.objectDetailsDescription"
                  defaultMessage="This connection information is used for reference in tables and when adding to a data source connection"
                />
              }
            </p>
          }
        >
          {/* Title */}
          <EuiCompressedFormRow
            label={i18n.translate('dataSourcesManagement.editDataSource.title', {
              defaultMessage: 'Title',
            })}
            isInvalid={!!this.state.formErrorsByField.title.length}
            error={this.state.formErrorsByField.title}
            data-test-subj="editDataSourceTitleFormRow"
          >
            <EuiCompressedFieldText
              name="dataSourceTitle"
              value={this.state.title || ''}
              placeholder={i18n.translate('dataSourcesManagement.editDataSource.titlePlaceHolder', {
                defaultMessage: 'Title',
              })}
              isInvalid={!!this.state.formErrorsByField.title.length}
              onChange={this.onChangeTitle}
              onBlur={this.validateTitle}
              disabled={!this.props.canManageDataSource}
            />
          </EuiCompressedFormRow>
          {/* Description */}
          <EuiCompressedFormRow
            label={
              <FormattedMessage
                id="dataSourcesManagement.editDataSource.descriptionOptional"
                defaultMessage="Description {optionalLabel}"
                values={{ optionalLabel: <DataSourceOptionalLabelSuffix /> }}
              />
            }
            data-test-subj="editDataSourceDescriptionFormRow"
          >
            <EuiCompressedFieldText
              name="dataSourceDescription"
              value={this.state.description || ''}
              placeholder={i18n.translate(
                'dataSourcesManagement.editDataSource.descriptionPlaceholder',
                {
                  defaultMessage: 'Description of the data source',
                }
              )}
              onChange={this.onChangeDescription}
              disabled={!this.props.canManageDataSource}
            />
          </EuiCompressedFormRow>
        </EuiDescribedFormGroup>
      </EuiPanel>
    );
  };

  /* Render Connection Details Panel */
  renderEndpointSection = () => {
    return (
      <EuiPanel paddingSize="m">
        <EuiText size="s">
          <h2>
            {
              <FormattedMessage
                id="dataSourcesManagement.editDataSource.endpointTitle"
                defaultMessage="Endpoint"
              />
            }
          </h2>
        </EuiText>

        <EuiHorizontalRule margin="m" />
        {/* Endpoint */}
        <EuiCompressedFormRow
          fullWidth={true}
          label={i18n.translate('dataSourcesManagement.editDataSource.endpointURL', {
            defaultMessage: 'Endpoint URL',
          })}
        >
          <EuiCompressedFieldText
            name="endpoint"
            value={this.props.existingDataSource.endpoint}
            disabled={true}
            fullWidth={true}
            aria-disabled={true}
            data-test-subj="editDatasourceEndpointField"
          />
        </EuiCompressedFormRow>
      </EuiPanel>
    );
  };

  /* Render Connection Details Panel */
  renderAuthenticationSection = () => {
    return (
      <EuiPanel paddingSize="m">
        <EuiText size="s">
          <h2>
            {
              <FormattedMessage
                id="dataSourcesManagement.editDataSource.authenticationTitle"
                defaultMessage="Authentication"
              />
            }
          </h2>
        </EuiText>

        <EuiHorizontalRule margin="m" />

        <EuiDescribedFormGroup
          title={
            <EuiText size="s">
              <h3>
                {
                  <FormattedMessage
                    id="dataSourcesManagement.editDataSource.authenticationMethod"
                    defaultMessage="Authentication Method"
                  />
                }
              </h3>
            </EuiText>
          }
        >
          {this.renderCredentialsSection()}
        </EuiDescribedFormGroup>
      </EuiPanel>
    );
  };

  /* Render Credentials Existing & new */
  renderCredentialsSection = () => {
    return (
      <>
        {/* Auth type select */}
        <EuiCompressedFormRow
          label={i18n.translate('dataSourcesManagement.editDataSource.credential', {
            defaultMessage: 'Credential',
          })}
        >
          <EuiCompressedSuperSelect
            options={this.authOptions}
            valueOfSelected={this.state.auth.type}
            onChange={(value) => this.onChangeAuthType(value)}
            disabled={this.authOptions.length <= 1 || !this.props.canManageDataSource}
            name="Credential"
            data-test-subj="editDataSourceSelectAuthType"
          />
        </EuiCompressedFormRow>

        <EuiSpacer />
        {this.renderSelectedAuthType(this.state.auth.type)}
      </>
    );
  };

  renderSelectedAuthType = (type: AuthType) => {
    switch (type) {
      case AuthType.NoAuth:
        return null;
      case AuthType.UsernamePasswordType:
        return this.renderUsernamePasswordFields();
      case AuthType.SigV4:
        return this.renderSigV4ContentFields();
      default:
        return this.getCredentialFormFromRegistry(type);
    }
  };

  renderSigV4ContentFields = () => {
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
            value={this.state.auth.credentials?.region || ''}
            onChange={this.onChangeRegion}
            onBlur={this.validateRegion}
            disabled={!this.props.canManageDataSource}
            data-test-subj="editDataSourceFormRegionField"
            name="dataSourceRegion"
          />
        </EuiCompressedFormRow>
        <EuiCompressedFormRow
          label={i18n.translate('dataSourcesManagement.createDataSource.serviceName', {
            defaultMessage: 'Service Name',
          })}
        >
          <EuiCompressedSuperSelect
            options={sigV4ServiceOptions}
            valueOfSelected={this.state.auth.credentials?.service}
            disabled={!this.props.canManageDataSource}
            onChange={(value) => this.onChangeSigV4ServiceName(value)}
            name="ServiceName"
            data-test-subj="editDataSourceFormSigV4ServiceTypeSelect"
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
            value={
              this.props.existingDataSource.auth.type === AuthType.SigV4
                ? this.maskedPassword
                : this.state.auth.credentials?.accessKey
            }
            onChange={this.onChangeAccessKey}
            onBlur={this.validateAccessKey}
            spellCheck={false}
            disabled={this.props.existingDataSource.auth.type === AuthType.SigV4}
            data-test-subj="editDataSourceFormAccessKeyField"
            name="dataSourceAccessKey"
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
            value={
              this.props.existingDataSource.auth.type === AuthType.SigV4
                ? this.maskedPassword
                : this.state.auth.credentials?.secretKey
            }
            onChange={this.onChangeSecretKey}
            onBlur={this.validateSecretKey}
            spellCheck={false}
            disabled={this.props.existingDataSource.auth.type === AuthType.SigV4}
            data-test-subj="editDataSourceFormSecretKeyField"
            name="dataSourceSecretKey"
          />
        </EuiCompressedFormRow>
        <EuiSpacer />
        {this.props.existingDataSource.auth.type === AuthType.SigV4
          ? this.renderUpdateAwsCredentialModal()
          : null}
      </>
    );
  };

  renderUsernamePasswordFields = () => {
    return (
      <>
        {/* Username */}
        <EuiCompressedFormRow
          label={i18n.translate('dataSourcesManagement.editDataSource.username', {
            defaultMessage: 'Username',
          })}
          isInvalid={!!this.state.formErrorsByField.createCredential?.username?.length}
          data-test-subj="editDatasourceUsernameFormRow"
        >
          <EuiCompressedFieldText
            name="datasourceUsername"
            placeholder={i18n.translate(
              'dataSourcesManagement.editDataSource.usernamePlaceholder',
              {
                defaultMessage: 'Username to connect to data source',
              }
            )}
            value={this.state.auth.credentials?.username || ''}
            isInvalid={!!this.state.formErrorsByField.createCredential?.username?.length}
            onChange={this.onChangeUsername}
            onBlur={this.validateUsername}
            disabled={!this.props.canManageDataSource}
          />
        </EuiCompressedFormRow>

        {/* Password */}
        <EuiCompressedFormRow
          label={i18n.translate('dataSourcesManagement.editDataSource.password', {
            defaultMessage: 'Password',
          })}
          isInvalid={!!this.state.formErrorsByField.createCredential?.password?.length}
        >
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiCompressedFieldPassword
                placeholder={i18n.translate(
                  'dataSourcesManagement.editDataSource.passwordPlaceholder',
                  {
                    defaultMessage: 'Password to connect to data source',
                  }
                )}
                type={'dual'}
                value={
                  this.props.existingDataSource.auth.type === AuthType.UsernamePasswordType
                    ? this.maskedPassword
                    : this.state.auth.credentials?.password
                }
                isInvalid={!!this.state.formErrorsByField.createCredential?.password?.length}
                spellCheck={false}
                onChange={this.onChangePassword}
                onBlur={this.validatePassword}
                disabled={
                  this.props.existingDataSource.auth.type === AuthType.UsernamePasswordType ||
                  !this.props.canManageDataSource
                }
                data-test-subj="updateDataSourceFormPasswordField"
              />
            </EuiFlexItem>
            {this.props.existingDataSource.auth.type === AuthType.UsernamePasswordType ? (
              <EuiFlexItem>{this.renderUpdatePasswordModal()}</EuiFlexItem>
            ) : null}
          </EuiFlexGroup>
        </EuiCompressedFormRow>
      </>
    );
  };

  didFormValuesChange = () => {
    const formValues: DataSourceAttributes = {
      title: this.state.title,
      description: this.state.description,
      endpoint: this.props.existingDataSource.endpoint,
      auth: this.state.auth,
    };

    const { title, description, auth } = this.props.existingDataSource;
    const isUsernameChanged: boolean =
      auth.type === formValues.auth.type &&
      auth.type === AuthType.UsernamePasswordType &&
      formValues.auth.credentials?.username !== auth.credentials?.username;
    const isAuthTypeSigV4Unchanged =
      auth.type === formValues.auth.type && auth.type === AuthType.SigV4;
    const isRegionChanged =
      isAuthTypeSigV4Unchanged && formValues.auth.credentials?.region !== auth.credentials?.region;
    const isServiceNameChanged =
      isAuthTypeSigV4Unchanged &&
      formValues.auth.credentials?.service !== auth.credentials?.service;
    const isRegisteredAuthCredentialChanged = this.isRegisteredAuthCredentialUpdated();

    if (
      formValues.title !== title ||
      formValues.description !== description ||
      formValues.auth.type !== auth.type ||
      isUsernameChanged ||
      isRegionChanged ||
      isServiceNameChanged ||
      isRegisteredAuthCredentialChanged
    ) {
      this.setState({ showUpdateOptions: true });
    } else {
      this.setState({ showUpdateOptions: false });
    }
  };

  isRegisteredAuthCredentialUpdated = () => {
    const { auth } = this.props.existingDataSource;
    const currentAuth = this.state.auth;

    if (
      currentAuth.type === AuthType.NoAuth ||
      currentAuth.type === AuthType.UsernamePasswordType ||
      currentAuth.type === AuthType.SigV4
    ) {
      return false;
    }

    const existingAuthCredentials = extractRegisteredAuthTypeCredentials(
      (auth?.credentials ?? {}) as { [key: string]: string },
      currentAuth.type,
      this.authenticationMethodRegistry
    );

    const registeredAuthCredentials = extractRegisteredAuthTypeCredentials(
      (currentAuth?.credentials ?? {}) as { [key: string]: string },
      currentAuth.type,
      this.authenticationMethodRegistry
    );

    return !deepEqual(existingAuthCredentials, registeredAuthCredentials);
  };

  renderBottomBar = () => {
    return (
      <EuiBottomBar data-test-subj="datasource-edit-bottomBar" affordForDisplacement={true}>
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
              data-test-subj="datasource-edit-cancelButton"
            >
              <FormattedMessage
                id="dataSourcesManagement.editDataSource.cancelButtonLabel"
                defaultMessage="Cancel changes"
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
          {this.props.canManageDataSource ? (
            <EuiFlexItem grow={false}>
              <EuiButton
                className="mgtAdvancedSettingsForm__button"
                disabled={!this.isFormValid()}
                color="secondary"
                fill
                size="s"
                iconType="check"
                isLoading={this.state.isLoading}
                onClick={this.onClickUpdateDataSource}
                data-test-subj="datasource-edit-saveButton"
              >
                <FormattedMessage
                  id="dataSourcesManagement.editDataSource.saveButtonLabel"
                  defaultMessage="Save changes"
                />
              </EuiButton>
            </EuiFlexItem>
          ) : null}
        </EuiFlexGroup>
      </EuiBottomBar>
    );
  };

  renderContent = () => {
    return (
      <>
        {this.renderHeader()}
        <EuiForm onChange={() => this.onChangeFormValues()} data-test-subj="data-source-edit">
          {this.renderConnectionDetailsSection()}

          <EuiSpacer size="m" />

          {this.renderEndpointSection()}

          <EuiSpacer size="m" />

          {this.renderAuthenticationSection()}
        </EuiForm>

        {this.state.showUpdateOptions ? this.renderBottomBar() : null}

        <EuiSpacer size="xl" />
        <EuiSpacer size="xl" />
      </>
    );
  };

  render() {
    return <>{this.renderContent()}</>;
  }
}

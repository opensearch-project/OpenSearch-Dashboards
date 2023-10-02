/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiBottomBar,
  EuiButton,
  EuiButtonEmpty,
  EuiDescribedFormGroup,
  EuiFieldPassword,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiHorizontalRule,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { SigV4Content, SigV4ServiceName } from '../../../../../../data_source/common/data_sources';
import { Header } from '../header';
import {
  AuthType,
  credentialSourceOptions,
  DataSourceAttributes,
  DataSourceManagementContextValue,
  sigV4ServiceOptions,
  ToastMessageItem,
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

export interface EditDataSourceProps {
  existingDataSource: DataSourceAttributes;
  existingDatasourceNamesList: string[];
  handleSubmit: (formValues: DataSourceAttributes) => Promise<void>;
  handleTestConnection: (formValues: DataSourceAttributes) => Promise<void>;
  onDeleteDataSource?: () => Promise<void>;
  displayToastMessage: (info: ToastMessageItem) => void;
}
export interface EditDataSourceState {
  formErrorsByField: CreateEditDataSourceValidation;
  title: string;
  description: string;
  endpoint: string;
  auth: {
    type: AuthType;
    credentials: UsernamePasswordTypedContent | SigV4Content;
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

  constructor(props: EditDataSourceProps, context: DataSourceManagementContextValue) {
    super(props, context);

    this.state = {
      formErrorsByField: { ...defaultValidation },
      title: '',
      description: '',
      endpoint: '',
      auth: {
        type: AuthType.NoAuth,
        credentials: {
          username: '',
          password: '',
          region: '',
          accessKey: '',
          secretKey: '',
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

      const authTypeCheckResults = {
        isUserNamePassword: auth.type === AuthType.UsernamePasswordType,
        isSigV4: auth.type === AuthType.SigV4,
      };

      this.setState({
        title,
        description: description || '',
        endpoint,
        auth: {
          type: auth.type,
          credentials: {
            username: authTypeCheckResults.isUserNamePassword ? auth.credentials?.username : '',
            password: authTypeCheckResults.isUserNamePassword ? this.maskedPassword : '',
            service: authTypeCheckResults.isSigV4
              ? auth.credentials?.service || SigV4ServiceName.OpenSearch
              : '',
            region: authTypeCheckResults.isSigV4 ? auth.credentials!.region : '',
            accessKey: authTypeCheckResults.isSigV4 ? this.maskedPassword : '',
            secretKey: authTypeCheckResults.isSigV4 ? this.maskedPassword : '',
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
      this.props.existingDataSource.title
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

  onChangeAuthType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const authType = e.target.value as AuthType;
    this.setState(
      {
        auth: {
          ...this.state.auth,
          type: authType,
          credentials: {
            ...this.state.auth.credentials,
            service:
              (this.state.auth.credentials?.service as SigV4ServiceName) ||
              SigV4ServiceName.OpenSearch,
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

  onChangeSigV4ServiceName = (e: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({
      auth: {
        ...this.state.auth,
        credentials: {
          ...this.state.auth.credentials,
          service: e.target.value as SigV4ServiceName,
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
          id: 'dataSourcesManagement.editDataSource.editDataSourceFailMsg',
          defaultMessage: 'Updating the Data Source failed with some errors.',
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
        id: 'dataSourcesManagement.editDataSource.testConnectionSuccessMsg',
        defaultMessage:
          'Connecting to the endpoint using the provided authentication method was successful.',
        success: true,
      });
    } catch (e) {
      this.props.displayToastMessage({
        id: 'dataSourcesManagement.editDataSource.testConnectionFailMsg',
        defaultMessage:
          'Failed Connecting to the endpoint using the provided authentication method.',
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
        id: 'dataSourcesManagement.editDataSource.updatePasswordSuccessMsg',
        defaultMessage: 'Password updated successfully.',
        success: true,
      });
    } catch (e) {
      this.props.displayToastMessage({
        id: 'dataSourcesManagement.editDataSource.updatePasswordFailMsg',
        defaultMessage: 'Updating the stored password failed with some errors.',
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
        id: 'dataSourcesManagement.editDataSource.updatePasswordSuccessMsg',
        defaultMessage: 'Password updated successfully.',
        success: true,
      });
    } catch (e) {
      this.props.displayToastMessage({
        id: 'dataSourcesManagement.editDataSource.updatePasswordFailMsg',
        defaultMessage: 'Updating the stored password failed with some errors.',
      });
    }
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
        <EuiButton
          onClick={this.onClickUpdatePassword}
          data-test-subj="editDatasourceUpdatePasswordBtn"
        >
          {
            <FormattedMessage
              id="dataSourcesManagement.editDataSource.updateStoredPassword"
              defaultMessage="Update stored password"
            />
          }
        </EuiButton>

        {this.state.showUpdatePasswordModal ? (
          <UpdatePasswordModal
            username={this.state.auth?.credentials?.username || ''}
            handleUpdatePassword={this.updatePassword}
            closeUpdatePasswordModal={this.closePasswordModal}
          />
        ) : null}
      </>
    );
  };

  renderUpdateAwsCredentialModal = () => {
    return (
      <>
        <EuiButton
          onClick={this.onClickUpdateAwsCredential}
          data-test-subj="editDatasourceUpdateAwsCredentialBtn"
        >
          {
            <FormattedMessage
              id="dataSourcesManagement.editDataSource.updateStoredAwsCredential"
              defaultMessage="Update stored AWS credential"
            />
          }
        </EuiButton>

        {this.state.showUpdateAwsCredentialModal ? (
          <UpdateAwsCredentialModal
            region={this.state.auth.credentials!.region}
            service={this.state.auth.credentials!.service}
            handleUpdateAwsCredential={this.updateAwsCredential}
            closeUpdateAwsCredentialModal={this.closeAwsCredentialModal}
          />
        ) : null}
      </>
    );
  };

  /* Render header*/
  renderHeader = () => {
    return (
      <Header
        showDeleteIcon={true}
        isFormValid={this.isFormValid()}
        onClickDeleteIcon={this.onClickDeleteDataSource}
        dataSourceName={this.props.existingDataSource.title}
        onClickTestConnection={this.onClickTestConnection}
      />
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
              id="dataSourcesManagement.editDataSource.optionalText"
              defaultMessage="optional"
            />
          }
        </i>
      </>
    );
  };

  /* Render Connection Details Panel */
  renderConnectionDetailsSection = () => {
    return (
      <EuiPanel paddingSize="m">
        <EuiText size="m">
          <h3>
            {
              <FormattedMessage
                id="dataSourcesManagement.editDataSource.connectionDetailsText"
                defaultMessage="Connection Details"
              />
            }
          </h3>
        </EuiText>

        <EuiHorizontalRule margin="m" />

        <EuiDescribedFormGroup
          title={
            <h4>
              {
                <FormattedMessage
                  id="dataSourcesManagement.editDataSource.objectDetailsText"
                  defaultMessage="Object Details"
                />
              }
            </h4>
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
          <EuiFormRow
            label={i18n.translate('dataSourcesManagement.editDataSource.title', {
              defaultMessage: 'Title',
            })}
            isInvalid={!!this.state.formErrorsByField.title.length}
            error={this.state.formErrorsByField.title}
            data-test-subj="editDataSourceTitleFormRow"
          >
            <EuiFieldText
              name="dataSourceTitle"
              value={this.state.title || ''}
              placeholder={i18n.translate('dataSourcesManagement.editDataSource.titlePlaceHolder', {
                defaultMessage: 'Title',
              })}
              isInvalid={!!this.state.formErrorsByField.title.length}
              onChange={this.onChangeTitle}
              onBlur={this.validateTitle}
            />
          </EuiFormRow>
          {/* Description */}
          <EuiFormRow
            label={this.renderFieldLabelAsOptional(
              'dataSourceManagement.editDataSource.description',
              'Description'
            )}
            data-test-subj="editDataSourceDescriptionFormRow"
          >
            <EuiFieldText
              name="dataSourceDescription"
              value={this.state.description || ''}
              placeholder={i18n.translate(
                'dataSourcesManagement.editDataSource.descriptionPlaceholder',
                {
                  defaultMessage: 'Description of the data source',
                }
              )}
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
        <EuiText size="m">
          <h3>
            {
              <FormattedMessage
                id="dataSourcesManagement.editDataSource.endpointTitle"
                defaultMessage="Endpoint"
              />
            }
          </h3>
        </EuiText>

        <EuiHorizontalRule margin="m" />
        {/* Endpoint */}
        <EuiFormRow
          fullWidth={true}
          label={i18n.translate('dataSourcesManagement.editDataSource.endpointURL', {
            defaultMessage: 'Endpoint URL',
          })}
        >
          <EuiFieldText
            name="endpoint"
            value={this.props.existingDataSource.endpoint}
            disabled={true}
            fullWidth={true}
            aria-disabled={true}
            data-test-subj="editDatasourceEndpointField"
          />
        </EuiFormRow>
      </EuiPanel>
    );
  };

  /* Render Connection Details Panel */
  renderAuthenticationSection = () => {
    return (
      <EuiPanel paddingSize="m">
        <EuiText size="m">
          <h3>
            {
              <FormattedMessage
                id="dataSourcesManagement.editDataSource.authenticationTitle"
                defaultMessage="Authentication"
              />
            }
          </h3>
        </EuiText>

        <EuiHorizontalRule margin="m" />

        <EuiDescribedFormGroup
          title={
            <h4>
              {
                <FormattedMessage
                  id="dataSourcesManagement.editDataSource.authenticationMethod"
                  defaultMessage="Authentication Method"
                />
              }
            </h4>
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
        <EuiFormRow
          label={i18n.translate('dataSourcesManagement.editDataSource.credential', {
            defaultMessage: 'Credential',
          })}
        >
          <EuiSelect
            options={credentialSourceOptions}
            value={this.state.auth.type}
            onChange={this.onChangeAuthType}
            name="Credential"
            data-test-subj="editDataSourceSelectAuthType"
          />
        </EuiFormRow>

        <EuiSpacer />
        {this.renderSelectedAuthType(this.state.auth.type)}
      </>
    );
  };

  renderSelectedAuthType = (type: AuthType) => {
    switch (type) {
      case AuthType.UsernamePasswordType:
        return this.renderUsernamePasswordFields();
      case AuthType.SigV4:
        return this.renderSigV4ContentFields();
      default:
        return null;
    }
  };

  renderSigV4ContentFields = () => {
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
            value={this.state.auth.credentials?.region || ''}
            onChange={this.onChangeRegion}
            onBlur={this.validateRegion}
            data-test-subj="editDataSourceFormRegionField"
          />
        </EuiFormRow>
        <EuiFormRow
          label={i18n.translate('dataSourcesManagement.createDataSource.serviceName', {
            defaultMessage: 'Service Name',
          })}
        >
          <EuiSelect
            options={sigV4ServiceOptions}
            value={this.state.auth.credentials?.service}
            onChange={(e) => this.onChangeSigV4ServiceName(e)}
            name="ServiceName"
            data-test-subj="editDataSourceFormSigV4ServiceTypeSelect"
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
          />
        </EuiFormRow>
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
        <EuiFormRow
          label={i18n.translate('dataSourcesManagement.editDataSource.username', {
            defaultMessage: 'Username',
          })}
          isInvalid={!!this.state.formErrorsByField.createCredential?.username?.length}
          data-test-subj="editDatasourceUsernameFormRow"
        >
          <EuiFieldText
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
          />
        </EuiFormRow>

        {/* Password */}
        <EuiFormRow
          label={i18n.translate('dataSourcesManagement.editDataSource.password', {
            defaultMessage: 'Password',
          })}
          isInvalid={!!this.state.formErrorsByField.createCredential?.password?.length}
        >
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFieldPassword
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
                disabled={this.props.existingDataSource.auth.type === AuthType.UsernamePasswordType}
                data-test-subj="updateDataSourceFormPasswordField"
              />
            </EuiFlexItem>
            {this.props.existingDataSource.auth.type === AuthType.UsernamePasswordType ? (
              <EuiFlexItem>{this.renderUpdatePasswordModal()}</EuiFlexItem>
            ) : null}
          </EuiFlexGroup>
        </EuiFormRow>
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

    if (
      formValues.title !== title ||
      formValues.description !== description ||
      formValues.auth.type !== auth.type ||
      isUsernameChanged ||
      isRegionChanged ||
      isServiceNameChanged
    ) {
      this.setState({ showUpdateOptions: true });
    } else {
      this.setState({ showUpdateOptions: false });
    }
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

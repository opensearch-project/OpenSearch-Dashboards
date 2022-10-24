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
  EuiRadioGroup,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { Header } from '../header';
import {
  AuthType,
  credentialSourceOptions,
  DataSourceAttributes,
  DataSourceManagementContextValue,
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

export interface EditDataSourceProps {
  existingDataSource: DataSourceAttributes;
  existingDatasourceNamesList: string[];
  handleSubmit: (formValues: DataSourceAttributes) => void;
  onDeleteDataSource?: () => void;
  displayToastMessage: (info: ToastMessageItem) => void;
}
export interface EditDataSourceState {
  formErrorsByField: CreateEditDataSourceValidation;
  title: string;
  description: string;
  endpoint: string;
  auth: {
    type: AuthType;
    credentials: UsernamePasswordTypedContent;
  };
  showUpdatePasswordModal: boolean;
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
        },
      },
      showUpdatePasswordModal: false,
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

      this.setState({
        title,
        description: description || '',
        endpoint,
        auth: {
          type: auth.type,
          credentials: {
            username: auth.type === AuthType.NoAuth ? '' : auth.credentials?.username || '',
            password: auth.type === AuthType.NoAuth ? '' : this.maskedPassword,
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
    this.setState({ auth: { ...this.state.auth, type: valueToSave }, formErrorsByField }, () => {
      this.onChangeFormValues();
    });
  };

  onChangeDescription = (e: { target: { value: any } }) => {
    this.setState({ description: e.target.value });
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
        credentials: { ...this.state.auth.credentials, password: e.target.value },
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
      /* Remove credentials object for NoAuth */
      if (this.state.auth.type === AuthType.NoAuth) {
        delete formValues.auth.credentials;
      } else if (this.props.existingDataSource.auth.type === AuthType.UsernamePasswordType) {
        /* Remove password if previously & currently username & password method is selected*/
        delete formValues.auth.credentials?.password;
      }

      /* Submit */
      this.setState({ isLoading: true });
      try {
        await this.props.handleSubmit(formValues, false);
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
  onClickUpdatePassword = () => {
    this.setState({ showUpdatePasswordModal: true });
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
        },
      },
    };
    this.closePasswordModal();

    try {
      await this.props.handleSubmit(updateAttributes, true);
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

  /* Render Modal for new credential */
  closePasswordModal = () => {
    this.setState({ showUpdatePasswordModal: false });
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
          <EuiRadioGroup
            options={credentialSourceOptions}
            idSelected={this.state.auth.type}
            onChange={(id) => this.onChangeAuthType(id)}
            name="Credential"
            data-test-subj="editDataSourceSelectAuthType"
          />
        </EuiFormRow>

        <EuiSpacer />

        {this.state.auth.type !== AuthType.NoAuth ? this.renderUsernamePasswordFields() : null}
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
            value={this.state.auth.credentials.username || ''}
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
                  this.props.existingDataSource.auth.type !== AuthType.NoAuth
                    ? '********'
                    : this.state.auth.credentials.password
                }
                isInvalid={!!this.state.formErrorsByField.createCredential?.password?.length}
                onChange={this.onChangePassword}
                onBlur={this.validatePassword}
                disabled={this.props.existingDataSource.auth.type !== AuthType.NoAuth}
                data-test-subj="updateDataSourceFormPasswordField"
              />
            </EuiFlexItem>
            {this.props.existingDataSource.auth.type !== AuthType.NoAuth ? (
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

    if (
      formValues.title !== title ||
      formValues.description !== description ||
      formValues.auth.type !== auth.type ||
      isUsernameChanged
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

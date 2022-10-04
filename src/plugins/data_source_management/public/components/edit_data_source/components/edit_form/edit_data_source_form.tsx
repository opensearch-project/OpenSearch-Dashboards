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
  EuiToolTip,
} from '@elastic/eui';
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
  performDataSourceFormValidation,
} from '../../../validation';
import { UpdatePasswordModal } from '../update_password_modal';
import {
  AUTHENTICATION_METHOD,
  AUTHENTICATION_TITLE,
  CANCEL_CHANGES,
  CONNECTION_DETAILS_TITLE,
  DATA_SOURCE_DESCRIPTION_PLACEHOLDER,
  DATA_SOURCE_PASSWORD_PLACEHOLDER,
  USERNAME_PLACEHOLDER,
  CREDENTIAL,
  DESCRIPTION,
  ENDPOINT_DESCRIPTION,
  ENDPOINT_TITLE,
  ENDPOINT_URL,
  OBJECT_DETAILS_DESCRIPTION,
  OBJECT_DETAILS_TITLE,
  OPTIONAL,
  PASSWORD,
  SAVE_CHANGES,
  TITLE,
  UPDATE_STORED_PASSWORD,
  USERNAME,
  VALIDATION_ERROR_TOOLTIP,
} from '../../../text_content';

export interface EditDataSourceProps {
  existingDataSource: DataSourceAttributes;
  handleSubmit: (formValues: DataSourceAttributes) => void;
  onDeleteDataSource?: () => void;
}
export interface EditDataSourceState {
  formErrors: string[];
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
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export class EditDataSourceForm extends React.Component<EditDataSourceProps, EditDataSourceState> {
  static contextType = contextType;
  public readonly context!: DataSourceManagementContextValue;
  maskedPassword: string = '********';

  constructor(props: EditDataSourceProps, context: DataSourceManagementContextValue) {
    super(props, context);

    this.state = {
      formErrors: [],
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
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    };
  }

  componentDidMount() {
    this.setFormValuesForEditMode();
  }

  resetFormValues = () => {
    this.setFormValuesForEditMode();
    this.setState({ showUpdateOptions: false }, this.checkValidation);
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
    const { formErrors, formErrorsByField } = performDataSourceFormValidation(this.state);

    this.setState({
      formErrors,
      formErrorsByField,
    });

    return formErrors.length === 0;
  };

  /* Events */

  onChangeTitle = (e: { target: { value: any } }) => {
    this.setState({ title: e.target.value }, () => {
      if (this.state.formErrorsByField.title.length) {
        this.isFormValid();
      }
    });
  };

  onChangeAuthType = (value: string) => {
    const valueToSave =
      value === AuthType.UsernamePasswordType ? AuthType.UsernamePasswordType : AuthType.NoAuth;
    this.setState({ auth: { ...this.state.auth, type: valueToSave } }, () => {
      this.onChangeFormValues();
      this.checkValidation();
    });
  };

  onChangeDescription = (e: { target: { value: any } }) => {
    this.setState({ description: e.target.value });
  };

  onChangeUsername = (e: { target: { value: any } }) => {
    this.setState(
      {
        auth: {
          ...this.state.auth,
          credentials: { ...this.state.auth.credentials, username: e.target.value },
        },
      },
      this.checkValidation
    );
  };

  onChangePassword = (e: { target: { value: any } }) => {
    this.setState(
      {
        auth: {
          ...this.state.auth,
          credentials: { ...this.state.auth.credentials, password: e.target.value },
        },
      },
      this.checkValidation
    );
  };

  checkValidation = () => {
    if (this.state.formErrors.length) {
      this.isFormValid();
    }
  };

  onClickUpdateDataSource = () => {
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
      this.props.handleSubmit(formValues);
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

  updatePassword = (password: string) => {
    // TODO: update password when API is ready
    this.closePasswordModal();
  };

  /* Render methods */

  /* Render Modal for new credential */
  closePasswordModal = () => {
    this.setState({ showUpdatePasswordModal: false });
  };

  renderUpdatePasswordModal = () => {
    return (
      <>
        <EuiButton onClick={this.onClickUpdatePassword}>{UPDATE_STORED_PASSWORD}</EuiButton>

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
  renderFieldLabelAsOptional = (label: string) => {
    return (
      <>
        {label} <i style={{ fontWeight: 'normal' }}>- {OPTIONAL}</i>
      </>
    );
  };

  /* Render Connection Details Panel */
  renderConnectionDetailsSection = () => {
    return (
      <EuiPanel paddingSize="m">
        <EuiText size="m">
          <h3> {CONNECTION_DETAILS_TITLE} </h3>
        </EuiText>

        <EuiHorizontalRule margin="m" />

        <EuiDescribedFormGroup
          title={<h4>{OBJECT_DETAILS_TITLE}</h4>}
          description={<p>{OBJECT_DETAILS_DESCRIPTION}</p>}
        >
          {/* Title */}
          <EuiFormRow
            label={TITLE}
            isInvalid={!!this.state.formErrorsByField.title.length}
            error={this.state.formErrorsByField.title}
          >
            <EuiFieldText
              name="dataSourceTitle"
              value={this.state.title || ''}
              placeholder={TITLE}
              isInvalid={!!this.state.formErrorsByField.title.length}
              onChange={this.onChangeTitle}
            />
          </EuiFormRow>
          {/* Description */}
          <EuiFormRow label={this.renderFieldLabelAsOptional(DESCRIPTION)}>
            <EuiFieldText
              name="dataSourceDescription"
              value={this.state.description || ''}
              placeholder={DATA_SOURCE_DESCRIPTION_PLACEHOLDER}
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
          <h3> {ENDPOINT_TITLE} </h3>
        </EuiText>

        <EuiHorizontalRule margin="m" />

        <EuiDescribedFormGroup
          title={<h4>{ENDPOINT_URL}</h4>}
          description={<p>{ENDPOINT_DESCRIPTION}</p>}
        >
          {/* Endpoint */}
          <EuiFormRow label={ENDPOINT_URL}>
            <EuiFieldText
              name="endpoint"
              value={this.props.existingDataSource.endpoint}
              disabled={true}
              aria-disabled={true}
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
        <EuiText size="m">
          <h3> {AUTHENTICATION_TITLE} </h3>
        </EuiText>

        <EuiHorizontalRule margin="m" />

        <EuiDescribedFormGroup title={<h4>{AUTHENTICATION_METHOD}</h4>}>
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
        <EuiFormRow label={CREDENTIAL}>
          <EuiRadioGroup
            options={credentialSourceOptions}
            idSelected={this.state.auth.type}
            onChange={(id) => this.onChangeAuthType(id)}
            name="Credential"
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
        <EuiFormRow label={USERNAME}>
          <EuiFieldText
            placeholder={USERNAME_PLACEHOLDER}
            value={this.state.auth.credentials.username || ''}
            onChange={this.onChangeUsername}
          />
        </EuiFormRow>

        {/* Password */}
        <EuiFormRow label={PASSWORD}>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFieldText
                placeholder={DATA_SOURCE_PASSWORD_PLACEHOLDER}
                value={
                  this.props.existingDataSource.auth.type !== AuthType.NoAuth
                    ? '********'
                    : this.state.auth.credentials.password
                }
                onChange={this.onChangePassword}
                disabled={this.props.existingDataSource.auth.type !== AuthType.NoAuth}
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

    const { title, description, endpoint, auth } = this.props.existingDataSource;
    const isUsernameChanged: boolean =
      auth.type === formValues.auth.type &&
      auth.type === AuthType.UsernamePasswordType &&
      formValues.auth.credentials?.username !== auth.credentials?.username;

    if (
      formValues.title !== title ||
      formValues.description !== description ||
      formValues.endpoint !== endpoint ||
      formValues.auth.type !== auth.type ||
      isUsernameChanged
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
                {CANCEL_CHANGES}
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip content={this.state.formErrors?.length && VALIDATION_ERROR_TOOLTIP}>
                <EuiButton
                  className="mgtAdvancedSettingsForm__button"
                  disabled={!!this.state.formErrors?.length}
                  color="secondary"
                  fill
                  size="s"
                  iconType="check"
                  onClick={this.onClickUpdateDataSource}
                  data-test-subj="datasource-edit-saveButton"
                >
                  {SAVE_CHANGES}
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
          data-test-subj="data-source-edit"
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

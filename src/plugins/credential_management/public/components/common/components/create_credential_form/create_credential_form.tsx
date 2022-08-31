/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import {
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiButton,
  EuiFieldPassword,
  EuiPageContent,
  EuiHorizontalRule,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { DocLinksStart } from 'src/core/public';
import { context as contextType } from '../../../../../../opensearch_dashboards_react/public';

import { CredentialManagmentContextValue } from '../../../../types';
import { CreateCredentialItem } from '../../../types';
import { Header } from '../header';

export interface CredentialFormProps {
  docLinks: DocLinksStart;
  handleSubmit: (formValues: CreateCredentialItem) => void;
}

export interface CredentialFormState {
  formErrors: string[];
  formErrorsByField: CredentialFormValidation;
  title: string;
  description: string;
  username: string;
  password: string;
  dual: boolean;
}

interface CredentialFormValidation {
  title: string[];
  description: string[];
  username: string[];
  password: string[];
}

const defaultValidation: CredentialFormValidation = {
  title: [],
  description: [],
  username: [],
  password: [],
};

export class CredentialForm extends React.Component<CredentialFormProps, CredentialFormState> {
  static contextType = contextType;
  public readonly context!: CredentialManagmentContextValue;

  constructor(props: CredentialFormProps, context: CredentialManagmentContextValue) {
    super(props, context);

    this.state = {
      formErrors: [],
      formErrorsByField: { ...defaultValidation },
      title: '',
      description: '',
      username: '',
      password: '',
      dual: true,
    };
  }

  /* Validations */

  isFormValid = () => {
    const validationByField: CredentialFormValidation = {
      title: [],
      description: [],
      username: [],
      password: [],
    };
    const formErrorMessages: string[] = [];
    /* Title validation */
    if (!this.state.title) {
      validationByField.title.push('Title should not be empty');
      formErrorMessages.push('Title should not be empty');
    }
    /* Username Validation */
    if (!this.state.username) {
      validationByField.username.push('Username should not be empty');
      formErrorMessages.push('Username should not be empty');
    }
    /* Password Validation */
    if (!this.state.password) {
      validationByField.password.push('Password should not be empty');
      formErrorMessages.push('Password should not be empty');
    }

    this.setState({
      formErrors: formErrorMessages,
      formErrorsByField: { ...validationByField },
    });
    return formErrorMessages.length === 0;
  };

  /* Events */

  onChangeTitle = (e: { target: { value: any } }) => {
    this.setState({ title: e.target.value }, () => {
      if (this.state.formErrorsByField.title.length) {
        this.isFormValid();
      }
    });
  };

  onChangeDescription = (e: { target: { value: any } }) => {
    this.setState({ description: e.target.value }, () => {
      if (this.state.formErrorsByField.description.length) {
        this.isFormValid();
      }
    });
  };

  onChangeUsername = (e: { target: { value: any } }) => {
    this.setState({ username: e.target.value }, () => {
      if (this.state.formErrorsByField.username.length) {
        this.isFormValid();
      }
    });
  };

  onChangePassword = (e: { target: { value: any } }) => {
    this.setState({ password: e.target.value }, () => {
      if (this.state.formErrorsByField.password.length) {
        this.isFormValid();
      }
    });
  };

  onClickSubmitForm = () => {
    if (this.isFormValid()) {
      const formValues: CreateCredentialItem = {
        title: this.state.title,
        description: this.state.description,
        username: this.state.username,
        password: this.state.password,
      };
      this.props.handleSubmit(formValues);
    }
  };

  createCredentialHeader = i18n.translate('credentialManagement.createIndexPatternHeader', {
    defaultMessage: 'Create Stored Credential',
  });
  /* Render methods */

  renderHeader() {
    const { docLinks } = this.props;
    return <Header docLinks={docLinks} headerTitle={this.createCredentialHeader} />;
  }

  renderContent = () => {
    const header = this.renderHeader();

    return (
      <EuiPageContent>
        {header}
        <EuiHorizontalRule />
        <EuiForm
          data-test-subj="credential-creation"
          isInvalid={!!this.state.formErrors.length}
          error={this.state.formErrors}
        >
          {/* Title */}
          <EuiFormRow
            label="Title"
            isInvalid={!!this.state.formErrorsByField.title.length}
            error={this.state.formErrorsByField.title}
            helpText="Tip: Title your stored credential with an employee or team name"
          >
            <EuiFieldText
              name="credentialTitle"
              value={this.state.title || ''}
              placeholder="Text field (placeholder)"
              isInvalid={!!this.state.formErrorsByField.title.length}
              onChange={this.onChangeTitle}
            />
          </EuiFormRow>

          {/* Description */}
          <EuiFormRow
            label="Description"
            isInvalid={!!this.state.formErrorsByField.description.length}
            error={this.state.formErrorsByField.description}
            helpText="Describe what this credential is used for"
          >
            <EuiFieldText
              name="description"
              value={this.state.description || ''}
              placeholder="Text field (placeholder)"
              isInvalid={!!this.state.formErrorsByField.description.length}
              onChange={this.onChangeDescription}
            />
          </EuiFormRow>

          {/* Authentication */}
          <EuiSpacer size="xl" />
          <EuiText grow={false}>
            <h4>
              <FormattedMessage
                id="createCredentialForm.authenticationHeader"
                defaultMessage="Authentication"
              />
            </h4>
          </EuiText>
          <EuiSpacer size="s" />

          {/* Username */}
          <EuiFormRow
            label="Username"
            isInvalid={!!this.state.formErrorsByField.username.length}
            error={this.state.formErrorsByField.username}
          >
            <EuiFieldText
              name="username"
              value={this.state.username || ''}
              placeholder="Text field (placeholder)"
              isInvalid={!!this.state.formErrorsByField.username.length}
              onChange={this.onChangeUsername}
            />
          </EuiFormRow>

          {/* Password */}
          <EuiFormRow
            label="Password"
            isInvalid={!!this.state.formErrorsByField.password.length}
            error={this.state.formErrorsByField.password}
          >
            <EuiFieldPassword
              name="password"
              type={this.state.dual ? 'dual' : undefined}
              value={this.state.password || ''}
              placeholder="Password field (placeholder)"
              isInvalid={!!this.state.formErrorsByField.password.length}
              onChange={this.onChangePassword}
            />
          </EuiFormRow>

          <EuiSpacer size="xl" />

          {/* Create Credential button*/}
          <EuiButton type="submit" fill onClick={this.onClickSubmitForm}>
            Create stored credential
          </EuiButton>
        </EuiForm>
      </EuiPageContent>
    );
  };

  render() {
    return <>{this.renderContent()}</>;
  }
}

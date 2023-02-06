/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiText,
  EuiFieldText,
  EuiIcon,
  EuiSpacer,
  EuiButton,
  EuiImage,
  EuiListGroup,
  EuiForm,
  EuiFormRow,
} from '@elastic/eui';
import { AuthType } from 'src/plugins/dashboards_security/common';
import { ESMap } from 'typescript';
import { map } from 'bluebird';
import { CoreStart } from '../../../../../core/public';
import { ClientConfigType } from '../../types';
import defaultBrandImage from '../../assets/opensearch_logo_h.svg';
import { validateCurrentPassword } from '../../utils/auth_utils';

interface LoginButtonConfig {
  buttonname: string;
  showbrandimage: boolean;
  brandimage: string;
  buttonstyle: string;
}

interface LoginPageDeps {
  http: CoreStart['http'];
  config: ClientConfigType;
}

function redirect(serverBasePath: string) {
  // navigate to nextUrl
  const urlParams = new URLSearchParams(window.location.search);
  let nextUrl = urlParams.get('nextUrl');
  if (!nextUrl || nextUrl.toLowerCase().includes('//')) {
    nextUrl = serverBasePath + '/';
  }
  window.location.href = nextUrl + window.location.hash;
}

export function LoginPage(props: LoginPageDeps) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loginFailed, setloginFailed] = useState(false);
  const [loginError, setloginError] = useState('');
  const [usernameValidationFailed, setUsernameValidationFailed] = useState(false);
  const [passwordValidationFailed, setPasswordValidationFailed] = useState(false);

  let errorLabel: any = null;
  if (loginFailed) {
    errorLabel = (
      <EuiText id="error" color="danger" textAlign="center">
        <b>{loginError}</b>
      </EuiText>
    );
  }

  // @ts-ignore : Parameter 'e' implicitly has an 'any' type.
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear errors
    setloginFailed(false);
    setUsernameValidationFailed(false);
    setPasswordValidationFailed(false);

    // Form validation
    if (username === '') {
      setUsernameValidationFailed(true);
      return;
    }

    if (password === '') {
      setPasswordValidationFailed(true);
      return;
    }
    try {
      await validateCurrentPassword(props.http, username, password);
      redirect(props.http.basePath.serverBasePath);
    } catch (error) {
      setloginFailed(true);
      setloginError('Invalid username or password. Please try again.');
      return;
    }
  };

  // TODO: Get brand image from server config
  return (
    <EuiListGroup className="login-wrapper">
      {props.config.ui.basicauth.login.showbrandimage && (
        <EuiImage
          size="fullWidth"
          alt=""
          url={props.config.ui.basicauth.login.brandimage || defaultBrandImage}
        />
      )}
      <EuiSpacer size="s" />
      <EuiText size="m" textAlign="center">
        {props.config.ui.basicauth.login.title || 'Please login to OpenSearch Dashboards'}
      </EuiText>
      <EuiSpacer size="s" />
      <EuiText size="s" textAlign="center">
        {props.config.ui.basicauth.login.subtitle ||
          'If you have forgotten your username or password, please ask your system administrator'}
      </EuiText>
      <EuiSpacer size="s" />
      <EuiForm component="form">
        <EuiFormRow>
          <EuiFieldText
            data-test-subj="user-name"
            placeholder="Username"
            prepend={<EuiIcon type="user" />}
            onChange={(e) => setUsername(e.target.value)}
            value={username}
          />
        </EuiFormRow>
        <EuiFormRow>
          <EuiFieldText
            data-test-subj="password"
            placeholder="Password"
            prepend={<EuiIcon type="lock" />}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />
        </EuiFormRow>
        <EuiFormRow>
          <EuiButton
            data-test-subj="submit"
            fill
            size="s"
            type="submit"
            className={props.config.ui.basicauth.login.buttonstyle || 'btn-login'}
            onClick={handleSubmit}
          >
            Log In
          </EuiButton>
        </EuiFormRow>
      </EuiForm>
      <EuiSpacer size="s" />
      <EuiFormRow>
        <EuiButton
          data-test-subj="submit"
          size="s"
          type="prime"
          className={props.config.ui.openid.login.buttonstyle || 'btn-login'}
          href="/auth/oidc/okta/login"
          iconType={
            props.config.ui.openid.login.showbrandimage
              ? props.config.ui.openid.login.brandimage
              : ''
          }
        >
          Login with OKTA (OIDC)
        </EuiButton>
      </EuiFormRow>
      <EuiSpacer size="s" />
      <EuiFormRow>
        <EuiButton
          data-test-subj="submit"
          size="s"
          type="prime"
          className={props.config.ui.openid.login.buttonstyle || 'btn-login'}
          href="/auth/oidc/google/login"
          iconType={
            props.config.ui.openid.login.showbrandimage
              ? props.config.ui.openid.login.brandimage
              : ''
          }
        >
          Login with Google (OIDC)
        </EuiButton>
      </EuiFormRow>
      {errorLabel}
    </EuiListGroup>
  );
}

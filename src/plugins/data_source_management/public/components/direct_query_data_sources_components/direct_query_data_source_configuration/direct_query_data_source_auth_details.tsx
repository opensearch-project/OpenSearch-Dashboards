/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCompressedFormRow, EuiFieldText, EuiFieldPassword } from '@elastic/eui';
import { useState } from 'react';
import React from 'react';
import { AuthMethod } from '../../constants';

interface AuthDetailProps {
  currentAuthMethod: AuthMethod;
  currentPassword: string;
  currentUsername: string;
  currentAccessKey?: string;
  currentSecretKey?: string;
  currentRegion?: string;
  setRegionForRequest?: React.Dispatch<React.SetStateAction<string>>;
  setAccessKeyForRequest?: React.Dispatch<React.SetStateAction<string>>;
  setSecretKeyForRequest?: React.Dispatch<React.SetStateAction<string>>;
  setPasswordForRequest: React.Dispatch<React.SetStateAction<string>>;
  setUsernameForRequest: React.Dispatch<React.SetStateAction<string>>;
}

export const AuthDetails = (props: AuthDetailProps) => {
  const {
    currentUsername,
    currentPassword,
    currentAccessKey,
    currentSecretKey,
    currentRegion,
    currentAuthMethod,
    setAccessKeyForRequest,
    setPasswordForRequest,
    setRegionForRequest,
    setSecretKeyForRequest,
    setUsernameForRequest,
  } = props;
  const [password, setPassword] = useState(currentPassword);
  const [username, setUsername] = useState(currentUsername);
  const [accessKey, setAccessKey] = useState(currentAccessKey);
  const [secretKey, setSecretKey] = useState(currentSecretKey);
  const [region, setRegion] = useState(currentRegion);
  switch (currentAuthMethod) {
    case 'basicauth':
      return (
        <>
          <EuiCompressedFormRow label="Username">
            <EuiFieldText
              placeholder={'Username'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={(e) => setUsernameForRequest(e.target.value)}
            />
          </EuiCompressedFormRow>
          <EuiCompressedFormRow label="Password">
            <EuiFieldPassword
              type={'dual'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={(e) => setPasswordForRequest(e.target.value)}
            />
          </EuiCompressedFormRow>
        </>
      );
    case 'awssigv4':
      return (
        <>
          <EuiCompressedFormRow label="Auth Region">
            <EuiFieldText
              placeholder="us-west-2"
              value={region}
              onBlur={(e) => {
                setRegionForRequest(e.target.value);
              }}
              onChange={(e) => {
                setRegion(e.target.value);
              }}
            />
          </EuiCompressedFormRow>
          <EuiCompressedFormRow label="Access Key">
            <EuiFieldText
              placeholder={'Access key placeholder'}
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              onBlur={(e) => setAccessKeyForRequest(e.target.value)}
            />
          </EuiCompressedFormRow>
          <EuiCompressedFormRow label="Secret Key">
            <EuiFieldPassword
              type={'dual'}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              onBlur={(e) => setSecretKeyForRequest(e.target.value)}
            />
          </EuiCompressedFormRow>
        </>
      );
    default:
      return null;
  }
};

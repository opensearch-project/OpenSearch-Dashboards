/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCompressedFormRow,
  EuiCompressedFieldText,
  EuiCompressedFieldPassword,
  EuiCompressedSelect,
} from '@elastic/eui';
import { useState, useEffect } from 'react';
import React from 'react';
import { AuthMethod } from '../../constants';

interface AuthDetailProps {
  currentAuthMethod: AuthMethod;
  currentPassword: string;
  currentUsername: string;
  currentAccessKey?: string;
  currentSecretKey?: string;
  currentRegion?: string;
  // OAuth2 fields
  currentClientId?: string;
  currentClientSecret?: string;
  currentTokenUrl?: string;
  currentScopes?: string;
  currentAudience?: string;
  currentGrantType?: string;
  setRegionForRequest?: React.Dispatch<React.SetStateAction<string>>;
  setAccessKeyForRequest?: React.Dispatch<React.SetStateAction<string>>;
  setSecretKeyForRequest?: React.Dispatch<React.SetStateAction<string>>;
  setPasswordForRequest: React.Dispatch<React.SetStateAction<string>>;
  setUsernameForRequest: React.Dispatch<React.SetStateAction<string>>;
  // OAuth2 setters
  setClientIdForRequest?: React.Dispatch<React.SetStateAction<string>>;
  setClientSecretForRequest?: React.Dispatch<React.SetStateAction<string>>;
  setTokenUrlForRequest?: React.Dispatch<React.SetStateAction<string>>;
  setScopesForRequest?: React.Dispatch<React.SetStateAction<string>>;
  setAudienceForRequest?: React.Dispatch<React.SetStateAction<string>>;
  setGrantTypeForRequest?: React.Dispatch<React.SetStateAction<string>>;
}

export const AuthDetails = (props: AuthDetailProps) => {
  const {
    currentUsername,
    currentPassword,
    currentAccessKey,
    currentSecretKey,
    currentRegion,
    // OAuth2 props
    currentClientId,
    currentClientSecret,
    currentTokenUrl,
    currentScopes,
    currentAudience,
    currentGrantType,
    currentAuthMethod,
    setAccessKeyForRequest,
    setPasswordForRequest,
    setRegionForRequest,
    setSecretKeyForRequest,
    setUsernameForRequest,
    // OAuth2 setters
    setClientIdForRequest,
    setClientSecretForRequest,
    setTokenUrlForRequest,
    setScopesForRequest,
    setAudienceForRequest,
    setGrantTypeForRequest,
  } = props;
  const [password, setPassword] = useState(currentPassword);
  const [username, setUsername] = useState(currentUsername);
  const [accessKey, setAccessKey] = useState(currentAccessKey);
  const [secretKey, setSecretKey] = useState(currentSecretKey);
  const [region, setRegion] = useState(currentRegion);
  // OAuth2 state
  const [clientId, setClientId] = useState(currentClientId ?? '');
  const [clientSecret, setClientSecret] = useState(currentClientSecret ?? '');
  const [tokenUrl, setTokenUrl] = useState(currentTokenUrl ?? '');
  const [scopes, setScopes] = useState(currentScopes ?? '');
  const [audience, setAudience] = useState(currentAudience ?? '');
  const [grantType, setGrantType] = useState(currentGrantType ?? 'client_credentials');

  // Initialize grant type with default value if not provided
  useEffect(() => {
    if (!currentGrantType && setGrantTypeForRequest) {
      setGrantTypeForRequest('client_credentials');
    }
  }, [currentGrantType, setGrantTypeForRequest]);
  switch (currentAuthMethod) {
    case 'basicauth':
      return (
        <>
          <EuiCompressedFormRow label="Username">
            <EuiCompressedFieldText
              placeholder={'Username'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={(e) => setUsernameForRequest(e.target.value)}
            />
          </EuiCompressedFormRow>
          <EuiCompressedFormRow label="Password">
            <EuiCompressedFieldPassword
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
            <EuiCompressedFieldText
              placeholder="us-west-2"
              value={region}
              onBlur={(e) => {
                // @ts-expect-error TS2722 TODO(ts-error): fixme
                setRegionForRequest(e.target.value);
              }}
              onChange={(e) => {
                setRegion(e.target.value);
              }}
            />
          </EuiCompressedFormRow>
          <EuiCompressedFormRow label="Access Key">
            <EuiCompressedFieldText
              placeholder={'Access key placeholder'}
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              // @ts-expect-error TS2722 TODO(ts-error): fixme
              onBlur={(e) => setAccessKeyForRequest(e.target.value)}
            />
          </EuiCompressedFormRow>
          <EuiCompressedFormRow label="Secret Key">
            <EuiCompressedFieldPassword
              type={'dual'}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              // @ts-expect-error TS2722 TODO(ts-error): fixme
              onBlur={(e) => setSecretKeyForRequest(e.target.value)}
            />
          </EuiCompressedFormRow>
        </>
      );
    case 'oauth2': {
      const grantTypeOptions = [{ value: 'client_credentials', text: 'Client Credentials' }];

      return (
        <>
          <EuiCompressedFormRow label="Grant Type">
            <EuiCompressedSelect
              options={grantTypeOptions}
              value={grantType || 'client_credentials'}
              onChange={(e) => {
                setGrantType(e.target.value);
                if (setGrantTypeForRequest) {
                  setGrantTypeForRequest(e.target.value);
                }
              }}
            />
          </EuiCompressedFormRow>
          <EuiCompressedFormRow label="Client ID">
            <EuiCompressedFieldText
              placeholder="Enter client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              onBlur={(e) => setClientIdForRequest && setClientIdForRequest(e.target.value)}
            />
          </EuiCompressedFormRow>
          <EuiCompressedFormRow label="Client Secret">
            <EuiCompressedFieldPassword
              type={'dual'}
              placeholder="Enter client secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              onBlur={(e) => setClientSecretForRequest && setClientSecretForRequest(e.target.value)}
            />
          </EuiCompressedFormRow>
          <EuiCompressedFormRow label="Token URL">
            <EuiCompressedFieldText
              placeholder="https://auth.example.com/oauth/token"
              value={tokenUrl}
              onChange={(e) => setTokenUrl(e.target.value)}
              onBlur={(e) => setTokenUrlForRequest && setTokenUrlForRequest(e.target.value)}
            />
          </EuiCompressedFormRow>
          <EuiCompressedFormRow label="Scopes (Optional)">
            <EuiCompressedFieldText
              placeholder="read write admin"
              value={scopes}
              onChange={(e) => setScopes(e.target.value)}
              onBlur={(e) => setScopesForRequest && setScopesForRequest(e.target.value)}
            />
          </EuiCompressedFormRow>
          <EuiCompressedFormRow label="Audience (Optional)">
            <EuiCompressedFieldText
              placeholder="https://api.example.com"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              onBlur={(e) => setAudienceForRequest && setAudienceForRequest(e.target.value)}
            />
          </EuiCompressedFormRow>
        </>
      );
    }
    default:
      return null;
  }
};

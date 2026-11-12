/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCompressedFieldText,
  EuiCompressedFieldPassword,
  EuiCompressedFormRow,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

/**
 * OAuth2 credential form component
 * This component provides the UI form for OAuth2 authentication credentials
 * Isolated to reduce OSS merge conflicts
 */
export const OAuth2CredentialForm = (state: any, handleStateChange: (state: any) => void) => {
  return (
    <>
      <EuiCompressedFormRow
        label={i18n.translate('dataSourcesManagement.createDataSource.clientId', {
          defaultMessage: 'Client ID',
        })}
      >
        <EuiCompressedFieldText
          placeholder={i18n.translate(
            'dataSourcesManagement.createDataSource.clientIdPlaceholder',
            {
              defaultMessage: 'OAuth2 Client ID',
            }
          )}
          value={state.auth?.credentials?.clientId || ''}
          onChange={(e) =>
            handleStateChange({
              ...state,
              auth: {
                ...state.auth,
                credentials: { ...state.auth.credentials, clientId: e.target.value },
              },
            })
          }
          data-test-subj="createDataSourceFormClientIdField"
        />
      </EuiCompressedFormRow>
      <EuiCompressedFormRow
        label={i18n.translate('dataSourcesManagement.createDataSource.clientSecret', {
          defaultMessage: 'Client Secret',
        })}
      >
        <EuiCompressedFieldPassword
          placeholder={i18n.translate(
            'dataSourcesManagement.createDataSource.clientSecretPlaceholder',
            {
              defaultMessage: 'OAuth2 Client Secret',
            }
          )}
          type={'dual'}
          value={state.auth?.credentials?.clientSecret || ''}
          onChange={(e) =>
            handleStateChange({
              ...state,
              auth: {
                ...state.auth,
                credentials: { ...state.auth.credentials, clientSecret: e.target.value },
              },
            })
          }
          spellCheck={false}
          data-test-subj="createDataSourceFormClientSecretField"
        />
      </EuiCompressedFormRow>
      <EuiCompressedFormRow
        label={i18n.translate('dataSourcesManagement.createDataSource.tokenUrl', {
          defaultMessage: 'Token URL',
        })}
      >
        <EuiCompressedFieldText
          placeholder={i18n.translate(
            'dataSourcesManagement.createDataSource.tokenUrlPlaceholder',
            {
              defaultMessage: 'https://auth.example.com/oauth/token',
            }
          )}
          value={state.auth?.credentials?.tokenUrl || ''}
          onChange={(e) =>
            handleStateChange({
              ...state,
              auth: {
                ...state.auth,
                credentials: { ...state.auth.credentials, tokenUrl: e.target.value },
              },
            })
          }
          data-test-subj="createDataSourceFormTokenUrlField"
        />
      </EuiCompressedFormRow>
      <EuiCompressedFormRow
        label={i18n.translate('dataSourcesManagement.createDataSource.scopes', {
          defaultMessage: 'Scopes (Optional)',
        })}
      >
        <EuiCompressedFieldText
          placeholder={i18n.translate('dataSourcesManagement.createDataSource.scopesPlaceholder', {
            defaultMessage: 'read write',
          })}
          value={state.auth?.credentials?.scopes || ''}
          onChange={(e) =>
            handleStateChange({
              ...state,
              auth: {
                ...state.auth,
                credentials: { ...state.auth.credentials, scopes: e.target.value },
              },
            })
          }
          data-test-subj="createDataSourceFormScopesField"
        />
      </EuiCompressedFormRow>
      <EuiCompressedFormRow
        label={i18n.translate('dataSourcesManagement.createDataSource.audience', {
          defaultMessage: 'Audience (Optional)',
        })}
      >
        <EuiCompressedFieldText
          placeholder={i18n.translate(
            'dataSourcesManagement.createDataSource.audiencePlaceholder',
            {
              defaultMessage: 'https://api.example.com',
            }
          )}
          value={state.auth?.credentials?.audience || ''}
          onChange={(e) =>
            handleStateChange({
              ...state,
              auth: {
                ...state.auth,
                credentials: { ...state.auth.credentials, audience: e.target.value },
              },
            })
          }
          data-test-subj="createDataSourceFormAudienceField"
        />
      </EuiCompressedFormRow>
    </>
  );
};

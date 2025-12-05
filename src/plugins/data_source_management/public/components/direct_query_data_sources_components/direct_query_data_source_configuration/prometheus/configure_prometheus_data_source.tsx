/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCompressedFieldText,
  EuiCompressedFormRow,
  EuiCompressedSelect,
  EuiCompressedTextArea,
  EuiForm,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { ApplicationStart } from 'opensearch-dashboards/public';
import React, { useState } from 'react';
import { NavigationPublicPluginStart } from 'src/plugins/navigation/public';
import { DataSourceTableItem, Role } from '../../../../types';
import { AuthMethod, LocalCluster, OPENSEARCH_DOCUMENTATION_URL } from '../../../constants';
import { AuthDetails } from '../direct_query_data_source_auth_details';
import { NameRow } from '../name_row';
import { QueryPermissionsConfiguration } from '../query_permissions';

interface ConfigurePrometheusDatasourceProps {
  useNewUX: boolean;
  navigation: NavigationPublicPluginStart;
  application: ApplicationStart;
  roles: Role[];
  selectedQueryPermissionRoles: Role[];
  setSelectedQueryPermissionRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  currentName: string;
  currentDetails: string;
  currentStore: string;
  currentUsername: string;
  currentPassword: string;
  currentAccessKey: string;
  currentSecretKey: string;
  currentRegion: string;
  currentAuthMethod: AuthMethod;
  hasSecurityAccess: boolean;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setAuthMethodForRequest: React.Dispatch<React.SetStateAction<AuthMethod>>;
  setRegionForRequest: React.Dispatch<React.SetStateAction<string>>;
  setAccessKeyForRequest: React.Dispatch<React.SetStateAction<string>>;
  setSecretKeyForRequest: React.Dispatch<React.SetStateAction<string>>;
  setPasswordForRequest: React.Dispatch<React.SetStateAction<string>>;
  setUsernameForRequest: React.Dispatch<React.SetStateAction<string>>;
  setStoreForRequest: React.Dispatch<React.SetStateAction<string>>;
  setNameForRequest: React.Dispatch<React.SetStateAction<string>>;
  setDetailsForRequest: React.Dispatch<React.SetStateAction<string>>;
  dataSources: DataSourceTableItem[];
  currentDataSourceId: string;
  setDataSourceIdForRequest: React.Dispatch<React.SetStateAction<string>>;
  hideLocalCluster: boolean;
  featureFlagStatus: boolean;
}

export const ConfigurePrometheusDatasourcePanel = (props: ConfigurePrometheusDatasourceProps) => {
  const {
    useNewUX,
    navigation,
    application,
    setNameForRequest,
    setDetailsForRequest,
    setStoreForRequest,
    currentStore,
    currentName,
    currentDetails,
    roles,
    selectedQueryPermissionRoles,
    setSelectedQueryPermissionRoles,
    currentUsername,
    setUsernameForRequest,
    currentPassword,
    setPasswordForRequest,
    currentAccessKey,
    setAccessKeyForRequest,
    currentSecretKey,
    setSecretKeyForRequest,
    currentRegion,
    setRegionForRequest,
    currentAuthMethod,
    setAuthMethodForRequest,
    hasSecurityAccess,
    error,
    setError,
    dataSources,
    currentDataSourceId,
    setDataSourceIdForRequest,
    hideLocalCluster,
    featureFlagStatus,
  } = props;

  const [details, setDetails] = useState(currentDetails);
  const [store, setStore] = useState(currentStore);
  const authOptions = [
    { value: 'noauth', text: 'No authentication' },
    { value: 'basicauth', text: 'Basic authentication' },
    { value: 'awssigv4', text: 'AWS Signature Version 4' },
  ];

  const description = (
    <EuiText size="s" color="subdued">
      <FormattedMessage
        id="dataSourcesManagement.configurePrometheusDataSource.description"
        defaultMessage="Connect to Prometheus with OpenSearch and OpenSearch Dashboards. "
      />
      <EuiLink external={true} href={OPENSEARCH_DOCUMENTATION_URL} target="blank">
        Learn more
      </EuiLink>
    </EuiText>
  );

  return (
    <div>
      <EuiPanel>
        <EuiText size="s">{!useNewUX && <h1>{`Configure Prometheus data source`}</h1>}</EuiText>
        {useNewUX ? (
          <navigation.ui.HeaderControl
            setMountPoint={application.setAppDescriptionControls}
            controls={[{ renderComponent: description }]}
          />
        ) : (
          <>
            <EuiSpacer size="s" />
            {description}
            <EuiSpacer />
          </>
        )}
        <EuiForm component="form">
          <EuiText size="s">
            <h2>Data source details</h2>
          </EuiText>
          <EuiSpacer size="m" />
          <NameRow
            currentName={currentName}
            setNameForRequest={setNameForRequest}
            currentError={error}
            setErrorForForm={setError}
          />
          <EuiCompressedFormRow label="Description - Optional">
            <EuiCompressedTextArea
              data-test-subj="data-source-description"
              placeholder="Placeholder"
              value={details}
              onBlur={(e) => {
                setDetailsForRequest(e.target.value);
              }}
              onChange={(e) => {
                setDetails(e.target.value);
              }}
            />
          </EuiCompressedFormRow>
          <EuiSpacer />

          {featureFlagStatus && (
            <>
              <EuiText size="s">
                <h2>OpenSearch connection</h2>
              </EuiText>
              <EuiSpacer size="m" />

              <EuiCompressedFormRow
                label="Data source"
                helpText="Select which OpenSearch cluster to associate this Prometheus connection with."
              >
                <EuiCompressedSelect
                  id="selectDataSource"
                  options={[
                    ...(!hideLocalCluster
                      ? [{ value: LocalCluster.id, text: LocalCluster.label }]
                      : []),
                    ...dataSources.map((ds) => ({ value: ds.id, text: ds.title || ds.id })),
                  ]}
                  value={currentDataSourceId}
                  onChange={(e) => setDataSourceIdForRequest(e.target.value)}
                  data-test-subj="dataSourceSelect"
                />
              </EuiCompressedFormRow>
              <EuiSpacer />
            </>
          )}

          <EuiText size="s">
            <h2>Prometheus data location</h2>
          </EuiText>
          <EuiSpacer size="m" />

          <EuiCompressedFormRow label="Prometheus URI">
            <>
              <EuiText size="xs">
                <p>Enter the Prometheus URI endpoint.</p>
              </EuiText>
              <EuiCompressedFieldText
                data-test-subj="Prometheus-URI"
                placeholder="Prometheus URI"
                value={store}
                onChange={(e) => {
                  setStore(e.target.value);
                }}
                onBlur={(e) => {
                  setStoreForRequest(e.target.value);
                }}
              />
            </>
          </EuiCompressedFormRow>
          <EuiSpacer />

          <EuiText size="s">
            <h2>Authentication details</h2>
          </EuiText>
          <EuiSpacer size="m" />

          <EuiCompressedFormRow label="Authentication method">
            <EuiCompressedSelect
              id="selectAuthMethod"
              options={authOptions}
              value={currentAuthMethod}
              onChange={(e) => {
                setAuthMethodForRequest(e.target.value as AuthMethod);
              }}
            />
          </EuiCompressedFormRow>

          <AuthDetails
            currentUsername={currentUsername}
            setUsernameForRequest={setUsernameForRequest}
            currentPassword={currentPassword}
            setPasswordForRequest={setPasswordForRequest}
            currentAccessKey={currentAccessKey}
            currentSecretKey={currentSecretKey}
            setAccessKeyForRequest={setAccessKeyForRequest}
            setSecretKeyForRequest={setSecretKeyForRequest}
            currentRegion={currentRegion}
            setRegionForRequest={setRegionForRequest}
            currentAuthMethod={currentAuthMethod}
          />

          <EuiSpacer />

          <QueryPermissionsConfiguration
            roles={roles}
            selectedRoles={selectedQueryPermissionRoles}
            setSelectedRoles={setSelectedQueryPermissionRoles}
            layout={'vertical'}
            hasSecurityAccess={hasSecurityAccess}
          />
        </EuiForm>
      </EuiPanel>
    </div>
  );
};

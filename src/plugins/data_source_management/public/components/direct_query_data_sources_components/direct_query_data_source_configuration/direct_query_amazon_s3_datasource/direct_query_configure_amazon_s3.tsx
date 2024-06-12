/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiText,
  EuiLink,
  EuiFormRow,
  EuiFieldText,
  EuiTextArea,
  EuiSelect,
  EuiCallOut,
} from '@elastic/eui';
import React, { useState, useEffect } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext } from '../../../../types';
import { getCreateAmazonS3SourceBreadcrumbs } from '../../../breadcrumbs';
import { AuthMethod, OPENSEARCH_S3_DOCUMENTATION_URL } from '../../../constants';
// import { QueryPermissionsConfiguration } from './query_permissions';
import { Role } from '../../../../types';
import { AuthDetails } from '../direct_query_data_source_auth_details';
// import { NameRow } from '../../../../types';

interface ConfigureS3DatasourceProps extends RouteComponentProps {
  roles: Role[];
  selectedQueryPermissionRoles: Role[];
  setSelectedQueryPermissionRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  currentName: string;
  currentDetails: string;
  currentArn: string;
  currentStore: string;
  currentAuthMethod: AuthMethod;
  currentUsername: string;
  currentPassword: string;
  hasSecurityAccess: boolean;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setAuthMethodForRequest: React.Dispatch<React.SetStateAction<AuthMethod>>;
  setPasswordForRequest: React.Dispatch<React.SetStateAction<string>>;
  setUsernameForRequest: React.Dispatch<React.SetStateAction<string>>;
  setStoreForRequest: React.Dispatch<React.SetStateAction<string>>;
  setNameForRequest: React.Dispatch<React.SetStateAction<string>>;
  setDetailsForRequest: React.Dispatch<React.SetStateAction<string>>;
  setArnForRequest: React.Dispatch<React.SetStateAction<string>>;
}

const ConfigureS3DatasourcePanel: React.FC<ConfigureS3DatasourceProps> = (props) => {
  const {
    setNameForRequest,
    setDetailsForRequest,
    setArnForRequest,
    setStoreForRequest,
    currentStore,
    currentName,
    currentDetails,
    currentArn,
    roles,
    currentAuthMethod,
    setAuthMethodForRequest,
    selectedQueryPermissionRoles,
    setSelectedQueryPermissionRoles,
    currentPassword,
    currentUsername,
    setPasswordForRequest,
    setUsernameForRequest,
    hasSecurityAccess,
    error,
    setError,
    history,
  } = props;

  const [details, setDetails] = useState(currentDetails);
  const [arn, setArn] = useState(currentArn);
  const [store, setStore] = useState(currentStore);
  const {
    chrome,
    setBreadcrumbs,
    savedObjects,
    notifications: { toasts },
    uiSettings,
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;

  useEffect(() => {
    setBreadcrumbs(getCreateAmazonS3SourceBreadcrumbs());
  }, [setBreadcrumbs]);

  const authOptions = [
    { value: 'basicauth', text: 'Basic authentication' },
    { value: 'noauth', text: 'No authentication' },
  ];

  return (
    <div>
      <EuiPanel>
        <EuiTitle>
          <h1>{`Configure Amazon S3 data source`}</h1>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiText size="s" color="subdued">
          {`Connect to Amazon S3 via AWS Glue Data Catalog with Amazon EMR as an execution engine. `}
          <EuiLink external={true} href={OPENSEARCH_S3_DOCUMENTATION_URL} target="blank">
            Learn more
          </EuiLink>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiCallOut title="Setup Amazon EMR as execution engine first" iconType="iInCircle">
          <EuiText size="s" color="subdued">
            {`Connect to Amazon S3 via AWS Glue Data Catalog with Amazon EMR as an execution engine. `}
            <EuiLink external={true} href={OPENSEARCH_S3_DOCUMENTATION_URL} target="blank">
              Learn more
            </EuiLink>
          </EuiText>
        </EuiCallOut>
        <EuiSpacer />
        <EuiText>
          <h3>Data source details</h3>
        </EuiText>
        <EuiSpacer size="m" />
        {/* <NameRow
          key={error}
          currentName={currentName}
          setNameForRequest={setNameForRequest}
          currentError={error}
          setErrorForForm={setError}
        /> */}
        <EuiFormRow label="Description - Optional">
          <EuiTextArea
            placeholder="Describe data source"
            value={details}
            onBlur={(e) => {
              setDetailsForRequest(e.target.value);
            }}
            onChange={(e) => {
              setDetails(e.target.value);
            }}
          />
        </EuiFormRow>
        <EuiSpacer />

        <EuiText>
          <h3>AWS Glue Data Catalog authentication details</h3>
        </EuiText>
        <EuiSpacer size="m" />

        <EuiFormRow label="Authentication Method">
          <>
            <EuiText size="xs">
              <p>
                This parameter provides the authentication type information required for execution
                engine to connect to AWS Glue Data Catalog.
              </p>
            </EuiText>
            <EuiFieldText data-test-subj="authentication-method" value="IAM role" disabled />
          </>
        </EuiFormRow>

        <EuiFormRow label="AWS Glue Data Catalog authentication ARN">
          <>
            <EuiText size="xs">
              <p>This should be the IAM role ARN</p>
            </EuiText>
            <EuiFieldText
              data-test-subj="role-ARN"
              placeholder="Role ARN"
              value={arn}
              onChange={(e) => {
                setArn(e.target.value);
              }}
              onBlur={(e) => {
                setArnForRequest(e.target.value);
              }}
            />
          </>
        </EuiFormRow>

        <EuiSpacer />

        <EuiText>
          <h3>AWS Glue Data Catalog index store details</h3>
        </EuiText>
        <EuiSpacer size="m" />

        <EuiFormRow label="AWS Glue Data Catalog index store URI">
          <>
            <EuiText size="xs">
              <p>
                This parameter provides the OpenSearch cluster host information for AWS Glue Data
                Catalog. This OpenSearch instance is used for writing index data back.
              </p>
            </EuiText>
            <EuiFieldText
              data-test-subj="index-URI"
              placeholder="Index store URI"
              value={store}
              onChange={(e) => {
                setStore(e.target.value);
              }}
              onBlur={(e) => {
                setStoreForRequest(e.target.value);
              }}
            />
          </>
        </EuiFormRow>

        <EuiFormRow label="AWS Glue Data Catalog index store authentication">
          <>
            <EuiText size="xs">
              <p>Authentication settings to access the index store.</p>
            </EuiText>
            <EuiSelect
              id="selectAuthMethod"
              options={authOptions}
              value={currentAuthMethod}
              onChange={(e) => {
                setAuthMethodForRequest(e.target.value as AuthMethod);
              }}
            />
          </>
        </EuiFormRow>
        <AuthDetails
          currentUsername={currentUsername}
          setUsernameForRequest={setUsernameForRequest}
          currentPassword={currentPassword}
          setPasswordForRequest={setPasswordForRequest}
          currentAuthMethod={currentAuthMethod}
        />

        <EuiSpacer />

        {/* <QueryPermissionsConfiguration
          roles={roles}
          selectedRoles={selectedQueryPermissionRoles}
          setSelectedRoles={setSelectedQueryPermissionRoles}
          layout={'vertical'}
          hasSecurityAccess={hasSecurityAccess}
        /> */}
      </EuiPanel>
    </div>
  );
};

export const ConfigureS3DatasourcePanelWithRouter = withRouter(ConfigureS3DatasourcePanel);

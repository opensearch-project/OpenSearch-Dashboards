/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import {
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiLink,
  EuiCompressedFormRow,
  EuiCompressedFieldText,
  EuiCompressedTextArea,
  EuiCompressedSelect,
  EuiCallOut,
} from '@elastic/eui';
import { NavigationPublicPluginStart } from 'src/plugins/navigation/public';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { FormattedMessage } from '@osd/i18n/react';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { AuthMethod } from '../../../constants';
import { QueryPermissionsConfiguration } from '../query_permissions';
import { Role } from '../../../../types';
import { AuthDetails } from '../direct_query_data_source_auth_details';
import { NameRow } from '../name_row';

interface ConfigureS3DatasourceProps extends RouteComponentProps {
  useNewUX: boolean;
  navigation: NavigationPublicPluginStart;
  application: ApplicationStart;
  roles: Role[];
  selectedQueryPermissionRoles?: Role[];
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

export const ConfigureS3DatasourcePanel: React.FC<ConfigureS3DatasourceProps> = (props) => {
  const {
    useNewUX,
    navigation,
    application,
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
    selectedQueryPermissionRoles = [],
    setSelectedQueryPermissionRoles,
    currentPassword,
    currentUsername,
    setPasswordForRequest,
    setUsernameForRequest,
    hasSecurityAccess,
    error,
    setError,
  } = props;

  const [details, setDetails] = useState(currentDetails);
  const [arn, setArn] = useState(currentArn);
  const [store, setStore] = useState(currentStore);

  const { services } = useOpenSearchDashboards();
  const docLinks = services.docLinks;

  const authOptions = [
    { value: 'basicauth', text: 'Basic authentication' },
    { value: 'noauth', text: 'No authentication' },
  ];

  const description = [
    {
      renderComponent: (
        <EuiText size="s" color="subdued">
          <FormattedMessage
            id="dataSourcesManagement.configureS3DataSource.description"
            defaultMessage="Connect to Amazon S3 via AWS Glue Data Catalog. "
          />
          {docLinks && (
            <EuiLink
              external={true}
              href={docLinks.links.opensearchDashboards.dataSource.s3DataSource}
              target="blank"
            >
              Learn more
            </EuiLink>
          )}
        </EuiText>
      ),
    },
  ];

  const callOut = (
    <EuiCallOut title="Setup Amazon EMR as execution engine first" iconType="iInCircle">
      <EuiText size="s" color="subdued">
        {`Make sure you connected to Amazon S3 via AWS Glue Data Catalog with Amazon EMR as an execution engine. `}
        {docLinks && (
          <EuiLink
            external={true}
            href={docLinks.links.opensearchDashboards.dataSource.s3DataSource}
            target="blank"
          >
            Learn more
          </EuiLink>
        )}
      </EuiText>
    </EuiCallOut>
  );

  return (
    <div>
      <EuiPanel>
        <EuiText size="s">{!useNewUX && <h1>{`Configure Amazon S3 data source`}</h1>}</EuiText>
        {useNewUX ? (
          <>
            <navigation.ui.HeaderControl
              setMountPoint={application.setAppBottomControls}
              controls={[{ renderComponent: callOut }]}
            />
            <navigation.ui.HeaderControl
              setMountPoint={application.setAppDescriptionControls}
              controls={description}
            />
          </>
        ) : (
          <>
            <EuiSpacer size="s" />
            {callOut} <EuiSpacer />
          </>
        )}
        <EuiText size="s">
          <h2>Data source details</h2>
        </EuiText>
        <EuiSpacer size="m" />
        <NameRow
          currentName={currentName}
          currentError={error}
          setErrorForForm={setError}
          setNameForRequest={setNameForRequest}
        />
        <EuiCompressedFormRow label="Description - Optional">
          <EuiCompressedTextArea
            placeholder="Describe data source"
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

        <EuiText size="s">
          <h2>AWS Glue Data Catalog authentication details</h2>
        </EuiText>
        <EuiSpacer size="m" />

        <EuiCompressedFormRow label="Authentication Method">
          <>
            <EuiText size="xs">
              <p>
                This parameter provides the authentication type information required for execution
                engine to connect to AWS Glue Data Catalog.
              </p>
            </EuiText>
            <EuiCompressedFieldText
              data-test-subj="authentication-method"
              value="IAM role"
              disabled
            />
          </>
        </EuiCompressedFormRow>

        <EuiCompressedFormRow label="AWS Glue Data Catalog authentication ARN">
          <>
            <EuiText size="xs">
              <p>This should be the IAM role ARN</p>
            </EuiText>
            <EuiCompressedFieldText
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
        </EuiCompressedFormRow>

        <EuiSpacer />

        <EuiText size="s">
          <h2>AWS Glue Data Catalog index store details</h2>
        </EuiText>
        <EuiSpacer size="m" />

        <EuiCompressedFormRow label="AWS Glue Data Catalog index store URI">
          <>
            <EuiText size="xs">
              <p>
                This parameter provides the OpenSearch cluster host information for AWS Glue Data
                Catalog. This OpenSearch instance is used for writing index data back.
              </p>
            </EuiText>
            <EuiCompressedFieldText
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
        </EuiCompressedFormRow>

        <EuiCompressedFormRow label="AWS Glue Data Catalog index store authentication">
          <>
            <EuiText size="xs">
              <p>Authentication settings to access the index store.</p>
            </EuiText>
            <EuiCompressedSelect
              id="selectAuthMethod"
              options={authOptions}
              value={currentAuthMethod}
              onChange={(e) => {
                setAuthMethodForRequest(e.target.value as AuthMethod);
              }}
            />
          </>
        </EuiCompressedFormRow>
        <AuthDetails
          currentUsername={currentUsername}
          setUsernameForRequest={setUsernameForRequest}
          currentPassword={currentPassword}
          setPasswordForRequest={setPasswordForRequest}
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
      </EuiPanel>
    </div>
  );
};

export const ConfigureS3DatasourcePanelWithRouter = withRouter(ConfigureS3DatasourcePanel);

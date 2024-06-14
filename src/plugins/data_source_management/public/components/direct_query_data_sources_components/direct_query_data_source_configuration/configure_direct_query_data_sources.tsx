/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiSpacer,
  EuiButton,
  EuiSteps,
  EuiPageSideBar,
  EuiBottomBar,
  EuiButtonEmpty,
} from '@elastic/eui';
import React, { useCallback, useEffect, useState } from 'react';
import { RouteComponentProps, useParams, withRouter } from 'react-router-dom';
import { ConfigureS3DatasourcePanel } from './direct_query_amazon_s3_datasource/direct_query_configure_amazon_s3';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
// import { DATACONNECTIONS_BASE, SECURITY_ROLES } from '../../../../../common/constants/shared';
// import { ReviewS3Datasource } from './review_s3_datasource_configuration';
// import { useToast } from '../../../../../public/components/common/toast';
import { DataSourceManagementContext, DirectQueryDatasourceType, Role } from '../../../types';
// import { ConfigurePrometheusDatasource } from './configure_prometheus_datasource';
// import { ReviewPrometheusDatasource } from './review_prometheus_datasource_configuration';
import { DatasourceTypeToDisplayName, UrlToDatasourceType } from '../../../constants';
import { AuthMethod } from '../../../types';
// import { formatError } from '../../utils';
import { NotificationsStart } from '../../../../../../core/public';
import {
  getCreateAmazonS3DataSourceBreadcrumbs,
  getCreatePrometheusDataSourceBreadcrumbs,
  getCreateBreadcrumbs,
} from '../../breadcrumbs';

interface ConfigureDatasourceProps extends RouteComponentProps {
  notifications: NotificationsStart;
}

const DirectQueryDataSourceConfigure: React.FC<ConfigureDatasourceProps> = ({ notifications }) => {
  const { type: urlType } = useParams<{ type: string }>();
  const {
    chrome,
    setBreadcrumbs,
    notifications: { toasts },
    http,
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;
  // const { setToast } = useToast();
  const [error, setError] = useState<string>('');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('basicauth');
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [arn, setArn] = useState('');
  const [storeURI, setStoreURI] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [region, setRegion] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [hasSecurityAccess, setHasSecurityAccess] = useState(true);
  const [selectedQueryPermissionRoles, setSelectedQueryPermissionRoles] = useState<Role[]>([]);
  const [page, setPage] = useState<'configure' | 'review'>('configure');
  const type = UrlToDatasourceType[urlType];
  const ConfigureDatasourceSteps = [
    {
      title: 'Configure data source',
      status: page === 'review' ? 'complete' : undefined,
    },
    {
      title: 'Review configuration',
    },
  ];

  const DATACONNECTIONS_BASE = '/api/dataconnections';

  useEffect(() => {
    // Fetch security roles from the API
    http!
      .get('/api/v1/configuration/roles')
      .then((data) =>
        setRoles(
          Object.keys(data.data).map((key) => {
            return { label: key };
          })
        )
      )
      .catch((err) => setHasSecurityAccess(false));

    // Set breadcrumbs based on the urlType
    let breadcrumbs;
    switch (urlType) {
      case 'AmazonS3AWSGlue':
        breadcrumbs = getCreateAmazonS3DataSourceBreadcrumbs();
        break;
      case 'Prometheus':
        breadcrumbs = getCreatePrometheusDataSourceBreadcrumbs();
        break;
      default:
        breadcrumbs = getCreateBreadcrumbs();
    }
    setBreadcrumbs(breadcrumbs);
  }, [urlType, setBreadcrumbs, http]);

  const ConfigureDatasource = (configurationProps: {
    datasourceType: DirectQueryDatasourceType;
  }) => {
    const { datasourceType } = configurationProps;
    switch (datasourceType) {
      case 'S3GLUE':
        return (
          <ConfigureS3DatasourcePanel
            currentName={name}
            currentDetails={details}
            setNameForRequest={setName}
            setDetailsForRequest={setDetails}
            currentArn={arn}
            setArnForRequest={setArn}
            currentStore={storeURI}
            setStoreForRequest={setStoreURI}
            roles={roles}
            selectedQueryPermissionRoles={selectedQueryPermissionRoles}
            setSelectedQueryPermissionRoles={setSelectedQueryPermissionRoles}
            currentUsername={username}
            setUsernameForRequest={setUsername}
            currentPassword={password}
            setPasswordForRequest={setPassword}
            currentAuthMethod={authMethod}
            setAuthMethodForRequest={setAuthMethod}
            hasSecurityAccess={hasSecurityAccess}
            error={error}
            setError={setError}
          />
        );
      default:
        return <></>;
    }
  };

  // const ReviewSaveOrCancel = useCallback(() => {
  //   return (
  //     <EuiBottomBar>
  //       <EuiFlexGroup justifyContent="flexEnd">
  //         <EuiFlexItem grow={false}>
  //           <EuiButtonEmpty
  //             onClick={() => {
  //               history.push('/new');
  //             }}
  //             color="ghost"
  //             size="s"
  //             iconType="cross"
  //           >
  //             Cancel
  //           </EuiButtonEmpty>
  //         </EuiFlexItem>
  //         <EuiFlexItem grow={false}>
  //           <EuiButton
  //             onClick={() => (page === 'review' ? setPage('configure') : {})}
  //             color="ghost"
  //             size="s"
  //             iconType="arrowLeft"
  //           >
  //             Previous
  //           </EuiButton>
  //         </EuiFlexItem>
  //         <EuiFlexItem grow={false}>
  //           <EuiButton
  //             onClick={() => (page === 'review' ? createDatasource() : setPage('review'))}
  //             size="s"
  //             iconType="arrowRight"
  //             fill
  //           >
  //             {page === 'configure'
  //               ? `Review Configuration`
  //               : `Connect to ${DatasourceTypeToDisplayName[type]}`}
  //           </EuiButton>
  //         </EuiFlexItem>
  //       </EuiFlexGroup>
  //     </EuiBottomBar>
  //   );
  // }, [page, history]);

  // const createDatasource = () => {
  //   let response;
  //   switch (type) {
  //     case 'S3GLUE':
  //       const s3properties =
  //         authMethod === 'basicauth'
  //           ? {
  //               'glue.auth.type': 'iam_role',
  //               'glue.auth.role_arn': arn,
  //               'glue.indexstore.opensearch.uri': storeURI,
  //               'glue.indexstore.opensearch.auth': authMethod,
  //               'glue.indexstore.opensearch.auth.username': username,
  //               'glue.indexstore.opensearch.auth.password': password,
  //             }
  //           : {
  //               'glue.auth.type': 'iam_role',
  //               'glue.auth.role_arn': arn,
  //               'glue.indexstore.opensearch.uri': storeURI,
  //               'glue.indexstore.opensearch.auth': authMethod,
  //             };
  //       response = http!.post(`${DATACONNECTIONS_BASE}`, {
  //         body: JSON.stringify({
  //           name,
  //           allowedRoles: selectedQueryPermissionRoles.map((role) => role.label),
  //           connector: 's3glue',
  //           properties: s3properties,
  //         }),
  //       });
  //       break;
  //     default:
  //       response = Promise.reject('Invalid data source type');
  //   }
  //   response
  //     .then(() => {
  //       toasts.addSuccess(`Data source ${name} created`);
  //       history.push('/manage');
  //     })
  //     .catch((err) => {
  //       const formattedError = formatError(err.name, err.message, err.body.message);
  //       notifications.toasts.addError(formattedError, {
  //         title: 'Could not create data source',
  //       });
  //       setPage('configure');
  //     });
  // };

  return (
    <EuiPage>
      <EuiPageSideBar>
        <EuiSteps titleSize="xs" steps={ConfigureDatasourceSteps} />
      </EuiPageSideBar>
      <EuiPageBody>
        {page === 'configure' ? (
          <ConfigureDatasource datasourceType={type} />
        ) : (
          // <ReviewDatasourceConfiguration datasourceType={type} />
          <>111</>
        )}
        <EuiSpacer size="xl" />
        <EuiSpacer size="xl" />
        {/* <ReviewSaveOrCancel /> */}
      </EuiPageBody>
    </EuiPage>
  );
};

export const ConfigureDirectQueryDataSourceWithRouter = withRouter(DirectQueryDataSourceConfigure);

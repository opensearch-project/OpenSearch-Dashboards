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
  EuiSteps,
  EuiPageSideBar,
  EuiBottomBar,
  EuiButtonEmpty,
  EuiButton,
} from '@elastic/eui';
import React, { useEffect, useState, useCallback } from 'react';
import { RouteComponentProps, useParams, withRouter } from 'react-router-dom';
import { ConfigureS3DatasourcePanel } from './amazon_s3_datasource/configure_amazon_s3_data_source';
import { ConfigurePrometheusDatasourcePanel } from './prometheus_data_source/configure_prometheus_data_source';
import { ReviewS3Datasource } from './amazon_s3_datasource/review_amazon_s3_data_source';
import { ReviewPrometheusDatasource } from './prometheus_data_source/review_prometheus_data_source';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext, DirectQueryDatasourceType, Role } from '../../../types';
import { DatasourceTypeToDisplayName, UrlToDatasourceType } from '../../../constants';
import { AuthMethod } from '../../../types';
import { NotificationsStart } from '../../../../../../core/public';
import {
  getCreateAmazonS3DataSourceBreadcrumbs,
  getCreatePrometheusDataSourceBreadcrumbs,
  getCreateBreadcrumbs,
} from '../../breadcrumbs';

interface ConfigureDatasourceProps extends RouteComponentProps {
  notifications: NotificationsStart;
}

export const DirectQueryDataSourceConfigure: React.FC<ConfigureDatasourceProps> = ({
  notifications,
  history,
}) => {
  const { type: urlType } = useParams<{ type: string }>();
  const {
    chrome,
    setBreadcrumbs,
    notifications: { toasts },
    http,
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;

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

  const formatError = (errorName: string, errorMessage: string, errorDetails: string) => {
    return {
      name: errorName,
      message: errorMessage,
      body: {
        attributes: {
          error: {
            caused_by: {
              type: '',
              reason: errorDetails,
            },
          },
        },
      },
    };
  };

  const createDatasource = useCallback(() => {
    let response;
    switch (type) {
      case 'S3GLUE':
        const s3properties =
          authMethod === 'basicauth'
            ? {
                'glue.auth.type': 'iam_role',
                'glue.auth.role_arn': arn,
                'glue.indexstore.opensearch.uri': storeURI,
                'glue.indexstore.opensearch.auth': authMethod,
                'glue.indexstore.opensearch.auth.username': username,
                'glue.indexstore.opensearch.auth.password': password,
              }
            : {
                'glue.auth.type': 'iam_role',
                'glue.auth.role_arn': arn,
                'glue.indexstore.opensearch.uri': storeURI,
                'glue.indexstore.opensearch.auth': authMethod,
              };
        response = http!.post(`${DATACONNECTIONS_BASE}`, {
          body: JSON.stringify({
            name,
            allowedRoles: selectedQueryPermissionRoles.map((role) => role.label),
            connector: 's3glue',
            properties: s3properties,
          }),
        });
        break;
      case 'PROMETHEUS':
        const prometheusProperties =
          authMethod === 'basicauth'
            ? {
                'prometheus.uri': storeURI,
                'prometheus.auth.type': authMethod,
                'prometheus.auth.username': username,
                'prometheus.auth.password': password,
              }
            : {
                'prometheus.uri': storeURI,
                'prometheus.auth.type': authMethod,
                'prometheus.auth.access_key': accessKey,
                'prometheus.auth.secret_key': secretKey,
                'prometheus.auth.region': region,
              };
        response = http!.post(`${DATACONNECTIONS_BASE}`, {
          body: JSON.stringify({
            name,
            allowedRoles: selectedQueryPermissionRoles.map((role) => role.label),
            connector: 'prometheus',
            properties: prometheusProperties,
          }),
        });
        break;
      default:
        response = Promise.reject('Invalid data source type');
    }
    response
      .then(() => {
        toasts.addSuccess(`Data source ${name} created`);
        history.push('/manage');
      })
      .catch((err) => {
        const formattedError = formatError(err.name, err.message, err.body.message);
        notifications.toasts.addError(formattedError, {
          title: 'Could not create data source',
        });
        setPage('configure');
      });
  }, [
    authMethod,
    arn,
    http,
    name,
    notifications.toasts,
    selectedQueryPermissionRoles,
    storeURI,
    toasts,
    type,
    username,
    password,
    accessKey,
    secretKey,
    region,
    history,
  ]);

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
      .catch(() => setHasSecurityAccess(false));

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
            history={history}
          />
        );
      case 'PROMETHEUS':
        return (
          <ConfigurePrometheusDatasourcePanel
            currentName={name}
            currentDetails={details}
            setNameForRequest={setName}
            setDetailsForRequest={setDetails}
            currentStore={storeURI}
            setStoreForRequest={setStoreURI}
            roles={roles}
            currentUsername={username}
            setUsernameForRequest={setUsername}
            currentPassword={password}
            setPasswordForRequest={setPassword}
            selectedQueryPermissionRoles={selectedQueryPermissionRoles}
            setSelectedQueryPermissionRoles={setSelectedQueryPermissionRoles}
            currentAccessKey={accessKey}
            currentSecretKey={secretKey}
            setAccessKeyForRequest={setAccessKey}
            setSecretKeyForRequest={setSecretKey}
            currentRegion={region}
            setRegionForRequest={setRegion}
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

  const ReviewDatasourceConfiguration = (configurationProps: { datasourceType: string }) => {
    const { datasourceType } = configurationProps;
    switch (datasourceType) {
      case 'S3GLUE':
        return (
          <ReviewS3Datasource
            currentName={name}
            currentDetails={details}
            currentArn={arn}
            currentStore={storeURI}
            selectedQueryPermissionRoles={selectedQueryPermissionRoles}
            currentAuthMethod={authMethod}
            goBack={() => setPage('configure')}
          />
        );
      case 'PROMETHEUS':
        return (
          <ReviewPrometheusDatasource
            currentName={name}
            currentDetails={details}
            currentArn={arn}
            currentStore={storeURI}
            currentUsername={username}
            selectedQueryPermissionRoles={selectedQueryPermissionRoles}
            currentAuthMethod={authMethod}
            goBack={() => setPage('configure')}
          />
        );
      default:
        return <></>;
    }
  };

  const ReviewSaveOrCancel = useCallback(() => {
    return (
      <EuiBottomBar data-test-subj="reviewSaveOrCancel">
        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              onClick={() => {
                history.push('/create');
              }}
              color="ghost"
              size="s"
              iconType="cross"
              data-test-subj="cancelButton"
            >
              Cancel
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              onClick={() => setPage('configure')}
              color="ghost"
              size="s"
              iconType="arrowLeft"
              data-test-subj="previousButton"
            >
              Previous
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              onClick={() => (page === 'review' ? createDatasource() : setPage('review'))}
              size="s"
              iconType="arrowRight"
              fill
              data-test-subj="nextButton"
            >
              {page === 'configure'
                ? `Review Configuration`
                : `Connect to ${DatasourceTypeToDisplayName[type]}`}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiBottomBar>
    );
  }, [page, history, createDatasource, type]);

  return (
    <EuiPage>
      <EuiPageSideBar>
        <EuiSteps titleSize="xs" steps={ConfigureDatasourceSteps} data-test-subj="configureSteps" />
      </EuiPageSideBar>
      <EuiPageBody>
        {page === 'configure' ? (
          <ConfigureDatasource datasourceType={type} />
        ) : (
          <ReviewDatasourceConfiguration datasourceType={type} />
        )}
        <EuiSpacer size="xl" />
        <EuiSpacer size="xl" />
        <ReviewSaveOrCancel />
      </EuiPageBody>
    </EuiPage>
  );
};

export const ConfigureDirectQueryDataSourceWithRouter = withRouter(DirectQueryDataSourceConfigure);

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTabbedContent,
  EuiIcon,
  EuiCard,
  EuiAccordion,
} from '@elastic/eui';
import {
  HttpStart,
  IUiSettingsClient,
  NotificationsStart,
  SavedObjectsStart,
} from 'opensearch-dashboards/public';
import { useLocation, useParams } from 'react-router-dom';
import { DATACONNECTIONS_BASE } from '../../../constants';
import { DirectQueryDatasourceDetails, PrometheusProperties } from '../../../types';
import { NoAccess } from './no_access_page';
import { InactiveDataConnectionCallout } from './inactive_data_connection_callout';
import { AccessControlTab } from './access_control_tab';
import { getManageDirectQueryDataSourceBreadcrumbs } from '../../breadcrumbs';
import { useLoadAccelerationsToCache } from '../../../../framework/catlog_cache/cache_loader';
import { AccelerationTable } from '../direct_query_acceleration_management/acceleration_table';
import { getRenderCreateAccelerationFlyout } from '../../../plugin';

interface DirectQueryDataConnectionDetailProps {
  featureFlagStatus: boolean;
  http: HttpStart;
  notifications: NotificationsStart;
  savedObjects: SavedObjectsStart;
  uiSettings: IUiSettingsClient;
  setBreadcrumbs: (breadcrumbs: any) => void;
}

export const DirectQueryDataConnectionDetail: React.FC<DirectQueryDataConnectionDetailProps> = ({
  featureFlagStatus,
  http,
  notifications,
  savedObjects,
  uiSettings,
  setBreadcrumbs,
}) => {
  const { dataSourceName } = useParams<{ dataSourceName: string }>();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const dataSourceMDSId = queryParams.get('dataSourceMDSId');
  const [datasourceDetails, setDatasourceDetails] = useState<DirectQueryDatasourceDetails>({
    allowedRoles: [],
    name: '',
    description: '',
    connector: 'PROMETHEUS',
    properties: { 'prometheus.uri': 'placeholder' },
    status: 'ACTIVE',
  });
  const [hasAccess, setHasAccess] = useState(true);

  // Cache loader hook
  const {
    loadStatus: accelerationsLoadStatus,
    startLoading: startLoadingAccelerations,
  } = useLoadAccelerationsToCache(http, notifications);

  const cacheLoadingHooks = {
    accelerationsLoadStatus,
    startLoadingAccelerations,
  };

  const fetchSelectedDatasource = () => {
    const endpoint = featureFlagStatus
      ? `${DATACONNECTIONS_BASE}/${dataSourceName}/dataSourceMDSId=${dataSourceMDSId || ''}`
      : `${DATACONNECTIONS_BASE}/${dataSourceName}`;

    http
      .get(endpoint)
      .then((data) => {
        setDatasourceDetails({
          allowedRoles: data.allowedRoles,
          description: data.description,
          name: data.name,
          connector: data.connector,
          properties: data.properties,
          status: data.status,
        });
      })
      .catch((_err) => {
        setHasAccess(false);
      });
  };

  useEffect(() => {
    setBreadcrumbs(getManageDirectQueryDataSourceBreadcrumbs(dataSourceName));
    fetchSelectedDatasource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setBreadcrumbs, http]);

  // const renderCreateAccelerationFlyout = getRenderCreateAccelerationFlyout();

  const DefaultDatasourceCards = () => {
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiCard
            icon={<EuiIcon size="xxl" type="integrationGeneral" />}
            title={'Configure Integrations'}
            description="Connect to common application log types using integrations"
            // onClick={onclickIntegrationsCard}
            // selectable={{
            //   onClick: onclickIntegrationsCard,
            //   isDisabled: false,
            //   children: 'Add Integrations',
            // }}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCard
            icon={<EuiIcon size="xxl" type="bolt" />}
            title={'Accelerate performance'}
            description="Accelerate query performance through OpenSearch indexing"
            onClick={() => renderCreateAccelerationFlyout({ dataSourceName })}
            selectable={{
              onClick: () => renderCreateAccelerationFlyout({ dataSourceName }),
              isDisabled: false,
              children: 'Accelerate Performance',
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCard
            icon={<EuiIcon size="xxl" type="discoverApp" />}
            title={'Query data'}
            description="Uncover insights from your data or better understand it"
            // onClick={onclickDiscoverCard}
            // selectable={{
            //   onClick: onclickDiscoverCard,
            //   isDisabled: false,
            //   children: 'Query in Observability Logs',
            // }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  const QueryOrAccelerateData = () => {
    switch (datasourceDetails.connector) {
      case 'S3GLUE':
        return <DefaultDatasourceCards />;
      case 'PROMETHEUS':
        // Prometheus does not have acceleration or integrations, and should go to metrics analytics
        return (
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiCard
                icon={<EuiIcon size="xxl" type="discoverApp" />}
                title={'Query data'}
                description="Query your data in Metrics Analytics."
                // onClick={() => application!.navigateToApp(observabilityMetricsID)}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        );
      default:
        return <DefaultDatasourceCards />;
    }
  };

  const S3DatasourceOverview = () => (
    <EuiPanel>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFlexGroup direction="column">
            <EuiFlexItem grow={false}>
              <EuiText className="overview-title">Description</EuiText>
              <EuiText size="s" className="overview-content">
                {datasourceDetails.description || '-'}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup direction="column">
            <EuiFlexItem grow={false}>
              <EuiText className="overview-title">Query Access</EuiText>
              <EuiText size="s" className="overview-content">
                {datasourceDetails.allowedRoles.length > 0
                  ? `Restricted to ${datasourceDetails.allowedRoles.join(', ')}`
                  : 'Admin only'}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
    </EuiPanel>
  );

  const PrometheusDatasourceOverview = () => (
    <EuiPanel>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFlexGroup direction="column">
            <EuiFlexItem grow={false}>
              <EuiText className="overview-title">Connection title</EuiText>
              <EuiText size="s" className="overview-content">
                {datasourceDetails.name || '-'}
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText className="overview-title">Data source description</EuiText>
              <EuiText size="s" className="overview-content">
                {datasourceDetails.description || '-'}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup direction="column">
            <EuiFlexItem grow={false}>
              <EuiText className="overview-title">Prometheus URI</EuiText>
              <EuiText size="s" className="overview-content">
                {(datasourceDetails.properties as PrometheusProperties)['prometheus.uri'] || '-'}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
    </EuiPanel>
  );

  const DatasourceOverview = () => {
    switch (datasourceDetails.connector) {
      case 'S3GLUE':
        return <S3DatasourceOverview />;
      case 'PROMETHEUS':
        return <PrometheusDatasourceOverview />;
      default:
        return null;
    }
  };

  if (!hasAccess) {
    return <NoAccess />;
  }

  const genericTabs = [
    {
      id: 'access_control',
      name: 'Access control',
      disabled: false,
      content: (
        <AccessControlTab
          dataConnection={dataSourceName}
          connector={datasourceDetails.connector}
          properties={datasourceDetails.properties}
          allowedRoles={datasourceDetails.allowedRoles}
          key={JSON.stringify(datasourceDetails.allowedRoles)}
        />
      ),
    },
  ];

  const conditionalTabs =
    datasourceDetails.connector === 'S3GLUE'
      ? [
          {
            id: 'acceleration_table',
            name: 'Accelerations',
            disabled: false,
            content: (
              <AccelerationTable
                dataSourceName={dataSourceName}
                cacheLoadingHooks={cacheLoadingHooks}
                http={http}
                notifications={notifications}
                featureFlagStatus={featureFlagStatus}
                dataSourceMDSId={featureFlagStatus ? dataSourceMDSId ?? undefined : undefined}
              />
            ),
          },
        ]
      : [];

  const tabs = [...conditionalTabs, ...genericTabs];

  const renderCreateAccelerationFlyout = getRenderCreateAccelerationFlyout();

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiPageHeader style={{ justifyContent: 'spaceBetween' }}>
          <EuiPageHeaderSection style={{ width: '100%', justifyContent: 'space-between' }}>
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiTitle data-test-subj="datasourceTitle" size="l">
                  <h1>{datasourceDetails.name}</h1>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageHeaderSection>
        </EuiPageHeader>
        <DatasourceOverview />
        <EuiSpacer />
        {datasourceDetails.status !== 'ACTIVE' ? (
          <InactiveDataConnectionCallout
            datasourceDetails={datasourceDetails}
            fetchSelectedDatasource={fetchSelectedDatasource}
          />
        ) : (
          <>
            <EuiAccordion
              id="queryOrAccelerateAccordion"
              buttonContent={'Get started'}
              initialIsOpen={true}
              paddingSize="m"
            >
              <QueryOrAccelerateData />
            </EuiAccordion>
            <EuiTabbedContent tabs={tabs} />
          </>
        )}

        <EuiSpacer />
      </EuiPageBody>
    </EuiPage>
  );
};

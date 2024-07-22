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
  ApplicationStart,
  HttpStart,
  IUiSettingsClient,
  NotificationsStart,
  SavedObjectsStart,
} from 'opensearch-dashboards/public';
import { useLocation, useParams } from 'react-router-dom';
import { escapeRegExp } from 'lodash';
import { DATACONNECTIONS_BASE } from '../../../constants';
import { DirectQueryDatasourceDetails, PrometheusProperties } from '../../../types';
import { NoAccess } from './utils/no_access_page';
import { InactiveDataConnectionCallout } from './utils/inactive_data_connection_callout';
import { AccessControlTab } from './access_control_tab';
import { getManageDirectQueryDataSourceBreadcrumbs } from '../../breadcrumbs';
import {
  useLoadAccelerationsToCache,
  useLoadDatabasesToCache,
  useLoadTablesToCache,
} from '../../../../framework/catalog_cache/cache_loader';
import { AccelerationTable } from '../acceleration_management/acceleration_table';
import { getRenderCreateAccelerationFlyout } from '../../../plugin';
import { AssociatedObjectsTab } from '../associated_object_management/associated_objects_tab';
import { redirectToExplorerS3 } from '../associated_object_management/utils/associated_objects_tab_utils';
import {
  InstallIntegrationFlyout,
  InstalledIntegrationsTable,
} from '../integrations/installed_integrations_table';
import {
  IntegrationInstanceResult,
  IntegrationInstancesSearchResult,
} from '../../../../framework/types';
import { INTEGRATIONS_BASE } from '../../../../framework/utils/shared';

interface DirectQueryDataConnectionDetailProps {
  featureFlagStatus: boolean;
  http: HttpStart;
  notifications: NotificationsStart;
  application: ApplicationStart;
  setBreadcrumbs: (breadcrumbs: any) => void;
}

export const DirectQueryDataConnectionDetail: React.FC<DirectQueryDataConnectionDetailProps> = ({
  featureFlagStatus,
  http,
  notifications,
  application,
  setBreadcrumbs,
}) => {
  const [observabilityDashboardsExists, setObservabilityDashboardsExists] = useState(false);
  const checkIfSQLWorkbenchPluginIsInstalled = () => {
    fetch('/api/status', {
      headers: {
        'Content-Type': 'application/json',
        'osd-xsrf': 'true',
        'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,zh-TW;q=0.6',
        pragma: 'no-cache',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
      },
      method: 'GET',
      referrerPolicy: 'strict-origin-when-cross-origin',
      mode: 'cors',
      credentials: 'include',
    })
      .then(function (response) {
        return response.json();
      })
      .then((data) => {
        for (let i = 0; i < data.status.statuses.length; ++i) {
          if (data.status.statuses[i].id.includes('plugin:observabilityDashboards')) {
            setObservabilityDashboardsExists(true);
          }
        }
      })
      .catch((error) => {
        notifications.toasts.addDanger(
          'Error checking Dashboards Observability Plugin Installation status.'
        );
        // eslint-disable-next-line no-console
        console.error(error);
      });
  };

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

  const onclickDiscoverCard = () => {
    redirectToExplorerS3(dataSourceName, application);
  };

  // Cache loader hook
  const {
    loadStatus: databasesLoadStatus,
    startLoading: startLoadingDatabases,
  } = useLoadDatabasesToCache(http, notifications);

  const { loadStatus: tablesLoadStatus, startLoading: startLoadingTables } = useLoadTablesToCache(
    http,
    notifications
  );

  const [selectedDatabase, setSelectedDatabase] = useState<string>('');

  const {
    loadStatus: accelerationsLoadStatus,
    startLoading: startLoadingAccelerations,
  } = useLoadAccelerationsToCache(http, notifications);

  const cacheLoadingHooks = {
    databasesLoadStatus,
    startLoadingDatabases,
    tablesLoadStatus,
    startLoadingTables,
    accelerationsLoadStatus,
    startLoadingAccelerations,
  };

  const [dataSourceIntegrations, setDataSourceIntegrations] = useState(
    [] as IntegrationInstanceResult[]
  );
  const [refreshIntegrationsFlag, setRefreshIntegrationsFlag] = useState(false);
  const refreshInstances = () => setRefreshIntegrationsFlag((prev) => !prev);

  useEffect(() => {
    const searchDataSourcePattern = new RegExp(
      `flint_${escapeRegExp(datasourceDetails.name)}_default_.*`
    );
    const findIntegrations = async () => {
      const result: { data: IntegrationInstancesSearchResult } = await http!.get(
        INTEGRATIONS_BASE + `/store`
      );
      if (result.data?.hits) {
        setDataSourceIntegrations(
          result.data.hits.filter((res) => res.dataSource.match(searchDataSourcePattern))
        );
      } else {
        setDataSourceIntegrations([]);
      }
    };
    findIntegrations();
  }, [http, datasourceDetails.name, refreshIntegrationsFlag]);

  const [showIntegrationsFlyout, setShowIntegrationsFlyout] = useState(false);
  const onclickIntegrationsCard = () => {
    setShowIntegrationsFlyout(true);
  };
  const integrationsFlyout = showIntegrationsFlyout ? (
    <InstallIntegrationFlyout
      closeFlyout={() => setShowIntegrationsFlyout(false)}
      datasourceType={datasourceDetails.connector}
      datasourceName={datasourceDetails.name}
      http={http}
    />
  ) : null;

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
    checkIfSQLWorkbenchPluginIsInstalled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setBreadcrumbs(getManageDirectQueryDataSourceBreadcrumbs(dataSourceName));
    fetchSelectedDatasource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setBreadcrumbs, http]);

  const renderCreateAccelerationFlyout = getRenderCreateAccelerationFlyout();

  const DefaultDatasourceCards = () => {
    return (
      <EuiFlexGroup>
        {!featureFlagStatus && observabilityDashboardsExists && (
          <EuiFlexItem>
            <EuiCard
              icon={<EuiIcon size="xxl" type="integrationGeneral" />}
              title={'Configure Integrations'}
              description="Connect to common application log types using integrations"
              onClick={onclickIntegrationsCard}
              selectable={{
                onClick: onclickIntegrationsCard,
                isDisabled: false,
                children: 'Add Integrations',
              }}
            />
          </EuiFlexItem>
        )}
        <EuiFlexItem>
          <EuiCard
            icon={<EuiIcon size="xxl" type="bolt" />}
            title={'Accelerate performance'}
            description="Accelerate query performance through OpenSearch indexing"
            onClick={() =>
              renderCreateAccelerationFlyout({
                dataSourceName,
                dataSourceMDSId: featureFlagStatus && dataSourceMDSId ? dataSourceMDSId : undefined,
              })
            }
            selectable={{
              onClick: () =>
                renderCreateAccelerationFlyout({
                  dataSourceName,
                  dataSourceMDSId:
                    featureFlagStatus && dataSourceMDSId ? dataSourceMDSId : undefined,
                }),
              isDisabled: false,
              children: 'Accelerate Performance',
            }}
          />
        </EuiFlexItem>
        {observabilityDashboardsExists && (
          <EuiFlexItem>
            <EuiCard
              icon={<EuiIcon size="xxl" type="discoverApp" />}
              title={'Query data'}
              description="Uncover insights from your data or better understand it"
              onClick={onclickDiscoverCard}
              selectable={{
                onClick: onclickDiscoverCard,
                isDisabled: false,
                children: 'Query in Observability Logs',
              }}
            />
          </EuiFlexItem>
        )}
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
                onClick={() => application.navigateToApp('observability-metrics')}
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
            id: 'associated_objects',
            name: 'Associated Objects',
            disabled: false,
            content: (
              <AssociatedObjectsTab
                datasource={datasourceDetails}
                cacheLoadingHooks={cacheLoadingHooks}
                selectedDatabase={selectedDatabase}
                setSelectedDatabase={setSelectedDatabase}
                http={http}
                notifications={notifications}
                application={application}
                dataSourceMDSId={featureFlagStatus ? dataSourceMDSId ?? undefined : undefined}
              />
            ),
          },
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
                application={application}
              />
            ),
          },
          !featureFlagStatus &&
            observabilityDashboardsExists && {
              id: 'installed_integrations',
              name: 'Installed Integrations',
              disabled: false,
              content: (
                <InstalledIntegrationsTable
                  integrations={dataSourceIntegrations}
                  datasourceType={datasourceDetails.connector}
                  datasourceName={datasourceDetails.name}
                  refreshInstances={refreshInstances}
                  http={http}
                />
              ),
            },
        ].filter(Boolean)
      : [];

  const tabs = [...conditionalTabs, ...genericTabs];

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
        {integrationsFlyout}
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

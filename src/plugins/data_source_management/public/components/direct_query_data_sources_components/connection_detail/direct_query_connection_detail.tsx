/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiAccordion,
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiPanel,
  EuiSpacer,
  EuiTabbedContent,
  EuiTitle,
  EuiText,
} from '@elastic/eui';
import { escapeRegExp } from 'lodash';
import {
  ApplicationStart,
  HttpStart,
  MountPoint,
  NotificationsStart,
  SavedObjectsStart,
} from 'opensearch-dashboards/public';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  useLoadAccelerationsToCache,
  useLoadDatabasesToCache,
  useLoadTablesToCache,
} from '../../../../framework/catalog_cache/cache_loader';
import {
  IntegrationInstanceResult,
  IntegrationInstancesSearchResult,
} from '../../../../framework/types';
import { INTEGRATIONS_BASE } from '../../../../framework/utils/shared';
import { DATACONNECTIONS_BASE } from '../../../constants';
import { getRenderCreateAccelerationFlyout } from '../../../plugin';
import { DirectQueryDatasourceDetails, PrometheusProperties } from '../../../types';
import { getManageDirectQueryDataSourceBreadcrumbs } from '../../breadcrumbs';
import { createDataSourceMenu, DataSourceViewConfig } from '../../data_source_menu';
import { getDataSourcesWithFields, isPluginInstalled } from '../../utils';
import { AccelerationTable } from '../acceleration_management/acceleration_table';
import { AssociatedObjectsTab } from '../associated_object_management/associated_objects_tab';
import { redirectToDiscover } from '../associated_object_management/utils/associated_objects_tab_utils';
import {
  InstalledIntegrationsTable,
  InstallIntegrationFlyout,
} from '../integrations/installed_integrations_table';
import { AccessControlTab } from './access_control_tab';
import { InactiveDataConnectionCallout } from './utils/inactive_data_connection_callout';
import { NoAccess } from './utils/no_access_page';
import prometheusSvg from '../../direct_query_data_sources_components/icons/prometheus_logo.svg';
import s3Svg from '../../direct_query_data_sources_components/icons/s3_logo.svg';

interface DirectQueryDataConnectionDetailProps {
  featureFlagStatus: boolean;
  http: HttpStart;
  notifications: NotificationsStart;
  application: ApplicationStart;
  setBreadcrumbs: (breadcrumbs: any) => void;
  useNewUX: boolean;
  savedObjects: SavedObjectsStart;
  setHeaderActionMenu: (menuMount: MountPoint | undefined) => void;
}

export const DirectQueryDataConnectionDetail: React.FC<DirectQueryDataConnectionDetailProps> = ({
  featureFlagStatus,
  http,
  notifications,
  application,
  setBreadcrumbs,
  useNewUX,
  savedObjects,
  setHeaderActionMenu,
}) => {
  const [observabilityDashboardsExists, setObservabilityDashboardsExists] = useState(false);
  const { dataSourceName } = useParams<{ dataSourceName: string }>();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const dataSourceMDSId = queryParams.get('dataSourceMDSId') ?? '';
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
    redirectToDiscover(application);
  };

  const dataSourceMenuView = useMemo(() => {
    if (!featureFlagStatus) return null;

    const DataSourceMenuView = createDataSourceMenu<DataSourceViewConfig>();

    const dataSourceViewProps = {
      setMenuMountPoint: setHeaderActionMenu,
      componentConfig: {
        activeOption: [{ id: dataSourceMDSId }],
        savedObjects: savedObjects.client,
        notifications,
        fullWidth: true,
      },
    };

    return <DataSourceMenuView {...dataSourceViewProps} componentType={'DataSourceView'} />;
  }, [featureFlagStatus, dataSourceMDSId, setHeaderActionMenu, savedObjects.client, notifications]);

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

  const [clusterTitle, setDataSourceTitle] = useState<string | undefined>();
  const fetchDataSources = async () => {
    try {
      const dataSources = await getDataSourcesWithFields(savedObjects.client, ['id', 'title']);

      // Find the data source title based on the dataSourceMDSId
      const foundDataSource = dataSources.find((ds: any) => ds.id === dataSourceMDSId);
      if (foundDataSource) {
        setDataSourceTitle(foundDataSource.attributes.title);
      }
    } catch (error) {
      notifications.toasts.addDanger({
        title: 'Failed to fetch data sources',
        text: error.message,
      });
    }
  };

  useEffect(() => {
    if (featureFlagStatus) {
      fetchDataSources();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureFlagStatus, savedObjects, notifications, dataSourceMDSId]);

  useEffect(() => {
    const searchDataSourcePattern = new RegExp(
      `flint_${escapeRegExp(datasourceDetails.name)}_default_.*`
    );

    const findIntegrations = async () => {
      const result: { data: IntegrationInstancesSearchResult } = await http!.get(
        INTEGRATIONS_BASE + `/store`
      );

      if (result.data?.hits) {
        let filteredIntegrations = result.data.hits.filter((res) =>
          res.dataSource.match(searchDataSourcePattern)
        );

        if (featureFlagStatus && dataSourceMDSId !== null) {
          filteredIntegrations = filteredIntegrations.filter((res) => {
            return res.references && res.references.some((ref) => ref.id === dataSourceMDSId);
          });
        }

        setDataSourceIntegrations(filteredIntegrations);
      } else {
        setDataSourceIntegrations([]);
      }
    };

    findIntegrations();
  }, [http, datasourceDetails.name, refreshIntegrationsFlag, featureFlagStatus, dataSourceMDSId]);

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
      selectedDataSourceId={dataSourceMDSId || ''}
      selectedClusterName={clusterTitle}
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
    isPluginInstalled('plugin:observabilityDashboards', notifications, http).then(
      setObservabilityDashboardsExists
    );
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
        {observabilityDashboardsExists && (
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
                children: 'Query in Discover',
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
        <EuiFlexItem grow={false}>
          <EuiFlexGroup direction="column" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiText className="overview-title">Data Source Type</EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup alignItems="center" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiIcon type={s3Svg} size="xl" />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiTitle size="s">
                    <h3>Amazon S3</h3>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup direction="column">
            <EuiFlexItem grow={false}>
              <EuiText className="overview-title">Description</EuiText>
              <EuiText size="s" className="overview-content">
                {datasourceDetails.description || '\u2014'}
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
        <EuiFlexItem grow={false}>
          <EuiFlexGroup direction="column" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiText className="overview-title">Data Source Type</EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup alignItems="center" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiIcon type={prometheusSvg} size="xl" />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiTitle size="s">
                    <h3>Prometheus</h3>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup direction="column">
            <EuiFlexItem grow={false}>
              <EuiText className="overview-title">Connection title</EuiText>
              <EuiText size="s" className="overview-content">
                {datasourceDetails.name || '\u2014'}
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText className="overview-title">Data source description</EuiText>
              <EuiText size="s" className="overview-content">
                {datasourceDetails.description || '\u2014'}
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
          dataSourceMDSId={featureFlagStatus ? dataSourceMDSId ?? '' : ''}
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
                selectedDataSourceId={featureFlagStatus ? dataSourceMDSId ?? undefined : undefined}
                selectedClusterName={clusterTitle}
              />
            ),
          },
        ].filter(Boolean)
      : [];

  const tabs = [...conditionalTabs, ...genericTabs];

  return (
    <EuiPage paddingSize="none">
      <EuiPageBody>
        <EuiPageHeader style={{ justifyContent: 'spaceBetween' }}>
          <EuiPageHeaderSection style={{ width: '100%', justifyContent: 'space-between' }}>
            <EuiFlexGroup alignItems="center">
              <EuiFlexItem>
                {!useNewUX && (
                  <EuiText data-test-subj="datasourceTitle" size="s">
                    <h1>{datasourceDetails.name}</h1>
                  </EuiText>
                )}
              </EuiFlexItem>
              <EuiFlexItem grow={false}>{dataSourceMenuView}</EuiFlexItem>
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
            <EuiTabbedContent tabs={tabs} size="s" />
          </>
        )}

        <EuiSpacer />
      </EuiPageBody>
    </EuiPage>
  );
};

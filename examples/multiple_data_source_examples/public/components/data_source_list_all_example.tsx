/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {
  EuiBasicTable,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiText,
  EuiTitle,
  EuiSpacer,
} from '@elastic/eui';
import { CoreStart, MountPoint } from 'opensearch-dashboards/public';
import {
  DataSourceAggregatedViewConfig,
  DataSourceManagementPluginSetup,
} from 'src/plugins/data_source_management/public';
import { ComponentProp } from './types';
import { COLUMNS } from './constants';

interface DataSourceListAllExampleProps {
  savedObjects: CoreStart['savedObjects'];
  dataSourceEnabled: boolean;
  notifications: CoreStart['notifications'];
  setActionMenu?: (menuMount: MountPoint | undefined) => void;
  dataSourceManagement: DataSourceManagementPluginSetup;
  uiSettings: CoreStart['uiSettings'];
}

export const DataSourceListAllExample = ({
  savedObjects,
  dataSourceEnabled,
  notifications,
  setActionMenu,
  dataSourceManagement,
  uiSettings,
}: DataSourceListAllExampleProps) => {
  const DataSourceMenu = dataSourceManagement.ui.getDataSourceMenu<
    DataSourceAggregatedViewConfig
  >();

  const data: ComponentProp[] = [
    {
      name: 'savedObjects',
      required: true,
      defaultValue: '-',
      description: 'The saved object client is used to fetch available data sources',
      deprecated: false,
    },
    {
      name: 'notifications',
      required: true,
      defaultValue: '-',
      description: 'The notifications toasts object exposes interfaces to show toasts',
      deprecated: false,
    },
    {
      name: 'hideLocalCluster',
      required: false,
      defaultValue: 'false',
      description: 'The property to hide local cluster from the data source selector',
      deprecated: false,
    },
    {
      name: 'fullWidth',
      required: true,
      defaultValue: '-',
      description:
        'The property of OutComboBox and when specified to true would expand to the entire width available',
      deprecated: false,
    },
    {
      name: 'displayAllCompatibleDataSources',
      required: false,
      defaultValue: 'undefined',
      description: 'When specified to true, it will show all compatible data sources',
      deprecated: false,
    },
    {
      name: 'dataSourceFilter',
      required: false,
      defaultValue: 'undefined',
      description:
        'When specified, the filter function will be used to filter the available options before rendering',
      deprecated: false,
    },
  ];

  return (
    <EuiPageBody component="main">
      <EuiPageHeader>
        {dataSourceEnabled && (
          <DataSourceMenu
            setMenuMountPoint={setActionMenu}
            componentType={'DataSourceAggregatedView'}
            componentConfig={{
              fullWidth: false,
              savedObjects: savedObjects.client,
              notifications,
              displayAllCompatibleDataSources: true,
            }}
          />
        )}
        <EuiPageHeaderSection>
          <EuiTitle size="l">
            <h1>Data Source Aggregated View To List All Example</h1>
          </EuiTitle>
        </EuiPageHeaderSection>
      </EuiPageHeader>
      <EuiPageContent>
        <EuiPageContentBody>
          <EuiText>
            The data source aggregated view component is introduced in 2.14 which uses
            OuiContextMenu and OuiPopOver as the base components. When multi data source feature is
            enabled, this component can be consumed by adding dataSourceManagement as option plugin,
            and then mounted to the navigation bar by passing setHeaderActionMenu from
            AppMountParameters to the getDataSourceMenu function exposed from the plugin. This
            component can be used to show all qualified connected data sources in the page. Find the
            mounted example in the navigation bar
          </EuiText>
          <EuiSpacer />
          <EuiText>
            The component exposes a few properties via the DataSourceMenu component:
          </EuiText>
          <EuiBasicTable
            tableCaption="dataSourceListAllEuiBasicTable"
            items={data}
            rowHeader="name"
            columns={COLUMNS}
          />
        </EuiPageContentBody>
      </EuiPageContent>
    </EuiPageBody>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo } from 'react';
import {
  EuiBasicTable,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { CoreStart, MountPoint } from 'opensearch-dashboards/public';
import {
  DataSourceManagementPluginSetup,
  DataSourceViewConfig,
} from 'src/plugins/data_source_management/public';
import { ComponentProp } from './types';
import { COLUMNS } from './constants';

interface DataSourceViewExampleProps {
  savedObjects: CoreStart['savedObjects'];
  dataSourceEnabled: boolean;
  notifications: CoreStart['notifications'];
  setActionMenu?: (menuMount: MountPoint | undefined) => void;
  dataSourceManagement: DataSourceManagementPluginSetup;
}

export const DataSourceViewExample = ({
  dataSourceEnabled,
  setActionMenu,
  dataSourceManagement,
  notifications,
  savedObjects,
}: DataSourceViewExampleProps) => {
  const DataSourceMenu = dataSourceManagement.ui.getDataSourceMenu<DataSourceViewConfig>();
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);
  const data: ComponentProp[] = [
    {
      name: 'savedObjects',
      required: false,
      defaultValue: '-',
      description: 'The saved object client is used to fetch available data sources',
      deprecated: false,
    },
    {
      name: 'notifications',
      required: false,
      defaultValue: '-',
      description: 'The notifications toasts object exposes interfaces to show toasts',
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
      name: 'activeOption',
      required: true,
      defaultValue: 'undefined',
      description: 'Show specified compatible data source',
      deprecated: false,
    },
  ];

  const renderDataSourceComponent = useMemo(() => {
    return (
      <DataSourceMenu
        setMenuMountPoint={setActionMenu}
        componentType={'DataSourceView'}
        componentConfig={{
          notifications,
          savedObjects: savedObjects.client,
          fullWidth: false,
          activeOption: [{ id: '' }],
          dataSourceFilter: (ds) => {
            return true;
          },
          onSelectedDataSources: (ds) => {
            setSelectedDataSources(ds);
          },
        }}
      />
    );
  }, [setActionMenu, notifications, savedObjects]);

  return (
    <EuiPageBody component="main">
      <EuiPageHeader>
        {dataSourceEnabled && renderDataSourceComponent}
        <EuiPageHeaderSection>
          <EuiTitle size="l">
            <h1>Data Source View Example</h1>
          </EuiTitle>
        </EuiPageHeaderSection>
      </EuiPageHeader>
      <EuiPageContent>
        <EuiPageContentBody>
          <EuiText>
            The data source view component is introduced in 2.14 which uses OuiContextMenu and
            OuiPopOver as the base components. When multi data source feature is enabled, this
            component can be consumed by adding dataSourceManagement as option plugin, and then
            mounted to the navigation bar by passing setHeaderActionMenu from AppMountParameters to
            the getDataSourceMenu function exposed from the plugin. This component can be used to
            show specified connected data sources in the page. Find the mounted example in the
            navigation bar
          </EuiText>
          <EuiSpacer />
          <EuiText>
            The component exposes a few properties via the DataSourceMenu component:
          </EuiText>
          <EuiBasicTable
            tableCaption="dataSourceViewEuiBasicTable"
            items={data}
            rowHeader="name"
            columns={COLUMNS}
          />
        </EuiPageContentBody>
      </EuiPageContent>
    </EuiPageBody>
  );
};

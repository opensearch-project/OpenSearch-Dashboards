/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo, useState } from 'react';
import {
  EuiBasicTable,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiSpacer,
  EuiText,
  EuiTextColor,
  EuiTitle,
} from '@elastic/eui';
import { MountPoint } from 'opensearch-dashboards/public';
import { CoreStart } from 'opensearch-dashboards/public';
import {
  DataSourceManagementPluginSetup,
  DataSourceSelectableConfig,
} from 'src/plugins/data_source_management/public';
import { ComponentProp } from './types';
import { COLUMNS } from './constants';

interface DataSourceSelectableExampleProps {
  savedObjects: CoreStart['savedObjects'];
  dataSourceEnabled: boolean;
  notifications: CoreStart['notifications'];
  setActionMenu?: (menuMount: MountPoint | undefined) => void;
  dataSourceManagement: DataSourceManagementPluginSetup;
}

export const DataSourceSelectableExample = ({
  savedObjects,
  dataSourceEnabled,
  notifications,
  setActionMenu,
  dataSourceManagement,
}: DataSourceSelectableExampleProps) => {
  const DataSourceMenu = dataSourceManagement.ui.getDataSourceMenu<DataSourceSelectableConfig>();
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);

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

  const renderDataSourceComponent = useMemo(() => {
    return (
      <DataSourceMenu
        setMenuMountPoint={setActionMenu}
        componentType={'DataSourceSelectable'}
        componentConfig={{
          fullWidth: false,
          savedObjects: savedObjects.client,
          notifications,
          hideLocalCluster: false,
          // activeOption: [{id: "fcff3d50-f2f1-11ee-8da7-63a1072e6128"}], // invalid ds only
          // activeOption: [{id: "cef124c0-f399-11ee-b119-0769c634fdbe", label: "test2"}], // valid ds only should display test2
          // activeOption: [{id: ""}], // invalid ds only
          // activeOption: [], // invalid ds only
          // activeOption: [{id: "b707f5b0-f5d7-11ee-9951-911715e0878f"}],
          onSelectedDataSources: (ds) => {
            setSelectedDataSources(ds);
          },
          // dataSourceFilter: (ds) => ds.attributes.title !== 'default-ds'

        }}
      />
    );
  }, [savedObjects, notifications, setActionMenu]);

  return (
    <EuiPageBody component="main">
      <EuiPageHeader>
        {dataSourceEnabled && renderDataSourceComponent}
        <EuiPageHeaderSection>
          <EuiTitle size="l">
            <h1>Data Source Selectable Example </h1>
          </EuiTitle>
        </EuiPageHeaderSection>
      </EuiPageHeader>
      <EuiPageContent>
        <EuiPageContentBody>
          <EuiText>
            <p>
              The data source selectable component is introduced in 2.14 which uses OuiFieldSearch
              and OuiPopover as the base components. When multi data source feature is enabled, this
              component can be consumed by adding dataSourceManagement as option plugin, and then
              mounted to the navigation bar by passing setHeaderActionMenu from AppMountParameters
              to the getDataSourceMenu function exposed from the plugin. This component can be used
              to select single connected data sources. Find the mounted example in the navigation
              bar with selected option
            </p>
            <p>
              <EuiTextColor color="accent">
                Selected: {selectedDataSources.map((ds) => ds.label).join(', ')}
              </EuiTextColor>
            </p>
          </EuiText>
          <EuiSpacer />
          <EuiText>
            The component exposes a few properties via the DataSourceMenu component:
          </EuiText>
          <EuiBasicTable
            tableCaption="dataSourceSelectableOuiBasicTable"
            items={data}
            rowHeader="name"
            columns={COLUMNS}
          />
        </EuiPageContentBody>
      </EuiPageContent>
    </EuiPageBody>
  );
};

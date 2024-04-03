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
  DataSourceMultiSelectableConfig,
} from 'src/plugins/data_source_management/public';
import { ComponentProp } from './types';
import { COLUMNS } from './constants';

interface DataSourceMultiSelectableExampleProps {
  savedObjects: CoreStart['savedObjects'];
  dataSourceEnabled: boolean;
  notifications: CoreStart['notifications'];
  setActionMenu?: (menuMount: MountPoint | undefined) => void;
  dataSourceManagement: DataSourceManagementPluginSetup;
}

export const DataSourceMultiSelectableExample = ({
  savedObjects,
  dataSourceEnabled,
  notifications,
  setActionMenu,
  dataSourceManagement,
}: DataSourceMultiSelectableExampleProps) => {
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);
  const DataSourceMenu = dataSourceManagement.ui.getDataSourceMenu<
    DataSourceMultiSelectableConfig
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
      name: 'onSelectedDataSources',
      required: true,
      defaultValue: 'undefined',
      description:
        'The call back function which is triggered when there is a change in the data source selection',
      deprecated: false,
    },
  ];

  const renderDataSourceComponent = useMemo(() => {
    return (
      <DataSourceMenu
        setMenuMountPoint={setActionMenu}
        componentType={'DataSourceMultiSelectable'}
        componentConfig={{
          fullWidth: false,
          savedObjects: savedObjects.client,
          notifications,
          onSelectedDataSources: (ds) => setSelectedDataSources(ds),
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
            <h1>Data Source Multi Selectable Example</h1>
          </EuiTitle>
        </EuiPageHeaderSection>
      </EuiPageHeader>
      <EuiPageContent>
        <EuiPageContentBody>
          <EuiText>
            <p>
              The data source multi selectable component is introduced in 2.14 which uses
              OuiFieldSearch and OuiPopover as the base components. When multi data source feature
              is enabled, this component can be consumed by adding dataSourceManagement as option
              plugin, and then mounted to the navigation bar by passing setHeaderActionMenu from
              AppMountParameters to the getDataSourceMenu function exposed from the plugin. This
              component can be used to select multiple connected data sources. Find the mounted
              example in the navigation bar with selected option
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
            tableCaption="dataSourceMultiSelectableOuiBasicTable"
            items={data}
            rowHeader="name"
            columns={COLUMNS}
          />
        </EuiPageContentBody>
      </EuiPageContent>
    </EuiPageBody>
  );
};

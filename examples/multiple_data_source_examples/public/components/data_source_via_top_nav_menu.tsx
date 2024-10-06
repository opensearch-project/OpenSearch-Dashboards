/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import React from 'react';
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
import { MountPoint } from 'opensearch-dashboards/public';
import { CoreStart } from 'opensearch-dashboards/public';
import { NavigationPublicPluginStart, TopNavMenuData } from 'src/plugins/navigation/public';
import { ComponentProp } from './types';
import { COLUMNS } from './constants';

interface DataSourceViaTopNavMenuExampleProps {
  savedObjects: CoreStart['savedObjects'];
  dataSourceEnabled: boolean;
  notifications: CoreStart['notifications'];
  setActionMenu?: (menuMount: MountPoint | undefined) => void;
  navigation: NavigationPublicPluginStart;
}

export const DataSourceViaTopNavMenuExample = ({
  savedObjects,
  dataSourceEnabled,
  notifications,
  setActionMenu,
  navigation,
}: DataSourceViaTopNavMenuExampleProps) => {
  const TopNavMenu = navigation.ui.TopNavMenu;
  const data: ComponentProp[] = [
    {
      name: 'showDataSourceMenu',
      required: false,
      defaultValue: '-',
      description:
        'When set to true and dataSourceMenuConfig is specified, data source menu will be mounted along with other menus into the navigation bar',
      deprecated: false,
    },
    {
      name: 'dataSourceMenuConfig',
      required: false,
      defaultValue: '-',
      description:
        'The config for the data source menu to determine the component to mount and configuration for the component',
      deprecated: false,
    },
  ];

  const config: TopNavMenuData[] = [
    {
      iconType: 'save',
      emphasize: true,
      id: 'save',
      label: i18n.translate('multipleDataSourceExample.topNav', {
        defaultMessage: `Save`,
      }),
      testId: 'mapSaveButton',
      run: (_anchorElement: any) => {
        // do nothing
        return;
      },
    },
  ];
  return (
    <EuiPageBody component="main">
      <EuiPageHeader>
        {dataSourceEnabled && (
          <TopNavMenu
            appName={'ExampleApp'}
            config={config}
            setMenuMountPoint={setActionMenu}
            showFilterBar={false}
            showDataSourceMenu={true}
            dataSourceMenuConfig={{
              componentType: 'DataSourceAggregatedView',
              componentConfig: {
                fullWidth: true,
                savedObjects: savedObjects.client,
                notifications,
                displayAllCompatibleDataSources: true,
              },
            }}
          />
        )}
        <EuiPageHeaderSection>
          <EuiTitle size="l">
            <h1>Data Source List All Component Mounted Via TopNavMenu Example</h1>
          </EuiTitle>
        </EuiPageHeaderSection>
      </EuiPageHeader>
      <EuiPageContent>
        <EuiPageContentBody>
          <EuiText>
            The capability of TopNavMenu to mount data source component is introduced in 2.14. When
            showDataSourceMenu is set to to true, specified component would show up in the
            navigation bar behind the menus specified via the TopNavMenu via config. Here is an
            example to render the data source list all within the TopNavMenu. This provides solution
            for plugins which needs to mount menus in addition to data source component into the
            navigation bar.
          </EuiText>
          <EuiSpacer />
          <EuiText>The newly added properties to TopNavMenu are as follows:</EuiText>
          <EuiBasicTable
            tableCaption="TopNavMenuOuiBasicTable"
            items={data}
            rowHeader="name"
            columns={COLUMNS}
          />
        </EuiPageContentBody>
      </EuiPageContent>
    </EuiPageBody>
  );
};

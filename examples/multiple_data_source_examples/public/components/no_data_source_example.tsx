/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
import { NoDataSourceConfig } from 'src/plugins/data_source_management/public/components/data_source_menu';
import { MountPoint } from 'opensearch-dashboards/public';


interface NoDataSourceExampleProps {
  dataSourceEnabled: boolean;
  dataSourceManagement: DataSourceManagementPluginSetup;
  setActionMenu?: (menuMount: MountPoint | undefined) => void;
}

export const NoDataSourceExample = ({
  dataSourceEnabled,
  dataSourceManagement,
  setActionMenu
}: NoDataSourceExampleProps) => {
  const DataSourceMenu = dataSourceManagement.ui.getDataSourceMenu<NoDataSourceConfig>();
  return (
    <EuiPageBody component="main">
      <EuiPageHeader>
      {dataSourceEnabled && (
          <DataSourceMenu
          setMenuMountPoint={setActionMenu}
            componentType={'NoDataSource'}
            componentConfig={{
              fullWidth: false,
            }}
          />
        )}
        <EuiPageHeaderSection>
          <EuiTitle size="l">
            <h1>No data source example</h1>
          </EuiTitle>
        </EuiPageHeaderSection>
      </EuiPageHeader>
      <EuiPageContent>
        <EuiPageContentBody>
          <EuiText>
            The no data source component is introduced in 2.14 which uses OuiButton as the base
            component. When multi data source feature is enabled, this
            component can be consumed by adding dataSourceManagement as option plugin, and then
            mounted to the navigation bar by passing setHeaderActionMenu from AppMountParameters to
            the getDataSourceMenu function exposed from the plugin. This component can be used to
            show no connected data sources in the page. Find the mounted example in the
            navigation bar
          </EuiText>
        </EuiPageContentBody>
      </EuiPageContent>
    </EuiPageBody>
  );
};

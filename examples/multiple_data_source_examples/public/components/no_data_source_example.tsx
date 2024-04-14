/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {
<<<<<<< HEAD
=======
  EuiButtonEmpty,
  EuiIcon,
>>>>>>> add empty state WIP
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageHeader,
  EuiPageHeaderSection,
<<<<<<< HEAD
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
import { MountPoint } from 'opensearch-dashboards/public';
import { DataSourceBaseConfig } from 'src/plugins/data_source_management/public';
=======
  EuiSpacer,
  EuiText,
  EuiTextColor,
  EuiTitle,
  OuiButtonEmpty,
  OuiFlexGroup,
  OuiFlexItem,
  OuiIcon,
  OuiTextColor,
  // OuiWarningTextColor
} from '@elastic/eui';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
<<<<<<< HEAD
>>>>>>> add empty state WIP
=======
import { NoDataSourceConfig } from 'src/plugins/data_source_management/public/components/data_source_menu';
import { CoreStart, MountPoint } from 'opensearch-dashboards/public';

>>>>>>> add no-data-source component in examples

interface NoDataSourceExampleProps {
  dataSourceEnabled: boolean;
  dataSourceManagement: DataSourceManagementPluginSetup;
<<<<<<< HEAD
<<<<<<< HEAD
  setActionMenu?: (menuMount: MountPoint | undefined) => void;
=======
>>>>>>> add empty state WIP
=======
  setActionMenu?: (menuMount: MountPoint | undefined) => void;

>>>>>>> add no-data-source component in examples
}

export const NoDataSourceExample = ({
  dataSourceEnabled,
<<<<<<< HEAD
<<<<<<< HEAD
  dataSourceManagement,
  setActionMenu,
}: NoDataSourceExampleProps) => {
  const DataSourceMenu = dataSourceManagement.ui.getDataSourceMenu<DataSourceBaseConfig>();
=======
  dataSourceManagement
=======
  dataSourceManagement,
  setActionMenu
>>>>>>> add no-data-source component in examples
}: NoDataSourceExampleProps) => {
  const DataSourceMenu = dataSourceManagement.ui.getDataSourceMenu<NoDataSourceConfig>();
const label = "    No data sources";
>>>>>>> add empty state WIP
  return (
    <EuiPageBody component="main">
      <EuiPageHeader>
<<<<<<< HEAD
        {dataSourceEnabled && (
<<<<<<< HEAD
          <DataSourceMenu
            setMenuMountPoint={setActionMenu}
=======
      {dataSourceEnabled && (
          <DataSourceMenu
          setMenuMountPoint={setActionMenu}
>>>>>>> add no-data-source component in examples
            componentType={'NoDataSource'}
            componentConfig={{
              fullWidth: false,
            }}
          />
<<<<<<< HEAD
=======
=======
        )}
        {/* {dataSourceEnabled && (
>>>>>>> add no-data-source component in examples

 <>
            <EuiButtonEmpty
              className="euiHeaderLink"
              data-test-subj="dataSourceViewContextMenuHeaderLink"
              iconType="alert"
              iconSide="left"
              size="s"
              color='warning'
            >
              {label}
            </EuiButtonEmpty></>

<<<<<<< HEAD
>>>>>>> add empty state WIP
        )}
=======
        )} */}
>>>>>>> add no-data-source component in examples
        <EuiPageHeaderSection>
          <EuiTitle size="l">
            <h1>No data source example</h1>
          </EuiTitle>
        </EuiPageHeaderSection>
      </EuiPageHeader>
      <EuiPageContent>
        <EuiPageContentBody>
          <EuiText>
<<<<<<< HEAD
<<<<<<< HEAD
            The no data source component is introduced in 2.14 which uses OuiButton as the base
            component. When multi data source feature is enabled, this component can be consumed by
            adding dataSourceManagement as option plugin, and then mounted to the navigation bar by
            passing setHeaderActionMenu from AppMountParameters to the getDataSourceMenu function
            exposed from the plugin. This component can be used to show no connected data sources in
            the page. Find the mounted example in the navigation bar
=======
            The data source view component is introduced in 2.14 which uses OuiContextMenu and
            OuiPopOver as the base components. When multi data source feature is enabled, this
=======
            The no data source component is introduced in 2.14 which uses OuiButton as the base
            component. When multi data source feature is enabled, this
>>>>>>> add no-data-source component in examples
            component can be consumed by adding dataSourceManagement as option plugin, and then
            mounted to the navigation bar by passing setHeaderActionMenu from AppMountParameters to
            the getDataSourceMenu function exposed from the plugin. This component can be used to
            show no connected data sources in the page. Find the mounted example in the
            navigation bar
          </EuiText>
<<<<<<< HEAD
          <EuiSpacer />
          <EuiText>
            The component exposes a few properties via the DataSourceMenu component:
>>>>>>> add empty state WIP
          </EuiText>
=======
>>>>>>> add no-data-source component in examples
        </EuiPageContentBody>
      </EuiPageContent>
    </EuiPageBody>
  );
};

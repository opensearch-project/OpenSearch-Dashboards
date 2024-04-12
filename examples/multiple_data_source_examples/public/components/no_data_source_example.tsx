/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {
  EuiButtonEmpty,
  EuiIcon,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageHeader,
  EuiPageHeaderSection,
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

interface NoDataSourceExampleProps {
  dataSourceEnabled: boolean;
  dataSourceManagement: DataSourceManagementPluginSetup;
}

export const NoDataSourceExample = ({
  dataSourceEnabled,
  dataSourceManagement
}: NoDataSourceExampleProps) => {
  // const DataSourceMenu = dataSourceManagement.ui.getDataSourceMenu<{}>();
const label = "    No data sources";
  return (
    <EuiPageBody component="main">
      <EuiPageHeader>
        {dataSourceEnabled && (

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
        </EuiPageContentBody>
      </EuiPageContent>
    </EuiPageBody>
  );
};

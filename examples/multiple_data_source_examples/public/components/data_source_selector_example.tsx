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
  EuiText,
  EuiTitle,
  EuiSpacer,
  EuiTextColor,
} from '@elastic/eui';
import { MountPoint } from 'opensearch-dashboards/public';
import { CoreStart } from 'opensearch-dashboards/public';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
import { ComponentProp } from './types';
import { COLUMNS } from './constants';

interface DataSourceSelectorExampleProps {
  savedObjects: CoreStart['savedObjects'];
  dataSourceEnabled: boolean;
  notifications: CoreStart['notifications'];
  setActionMenu?: (menuMount: MountPoint | undefined) => void;
  dataSourceManagement: DataSourceManagementPluginSetup;
}

export const DataSourceSelectorExample = ({
  savedObjects,
  notifications,
  dataSourceManagement,
  dataSourceEnabled,
}: DataSourceSelectorExampleProps) => {
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);

  const data: ComponentProp[] = [
    {
      name: 'savedObjectsClient',
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
      name: 'onSelectedDataSource',
      required: true,
      defaultValue: '-',
      description:
        'The call back function which is triggered when there is a change in the data source selection',
      deprecated: false,
    },
    {
      name: 'disabled',
      required: true,
      defaultValue: '-',
      description: 'The property to disable the data source selection',
      deprecated: false,
    },
    {
      name: 'hideLocalCluster',
      required: true,
      defaultValue: '-',
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
      name: 'defaultOption',
      required: false,
      defaultValue: 'undefined',
      description:
        'When specified, it will override the option when the component is first rendered',
      deprecated: false,
    },
    {
      name: 'placeholderText',
      required: false,
      defaultValue: 'undefined',
      description: 'When specified, it will set the placeholder of the input',
      deprecated: false,
    },
    {
      name: 'removePrepend',
      required: false,
      defaultValue: 'false',
      description: 'When specified to true, it will hide the prepend from the component',
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
    {
      name: 'compressed',
      required: false,
      defaultValue: 'false',
      description:
        'When specified, the property will be passed to OuiComboBox component where true value creates a shorter height input',
      deprecated: false,
    },
  ];

  const renderDataSourceComponent = useMemo(() => {
    const DataSourceSelector = dataSourceManagement.ui.DataSourceSelector;
    return (
      <DataSourceSelector
        savedObjectsClient={savedObjects.client}
        notifications={notifications.toasts}
        fullWidth={false}
        onSelectedDataSource={(ds) => setSelectedDataSources(ds)}
        disabled={false}
        hideLocalCluster={true}
      />
    );
  }, [savedObjects, notifications, dataSourceManagement]);

  return (
    <EuiPageBody component="main">
      <EuiPageHeader>
        <EuiPageHeaderSection>
          <EuiTitle size="l">
            <h1>Data Source Selector Example</h1>
          </EuiTitle>
        </EuiPageHeaderSection>
      </EuiPageHeader>
      <EuiPageContent>
        <EuiPageContentBody>
          <EuiText>
            <p>
              The data source selector component is introduced in 2.12 which uses OuiComboBox as the
              base component. When multi data source feature is enabled, this component would show
              up in the devtools page and add sample data page. Here is an example to render the
              data source selector within the page. This component can be used to select a single
              connected data source. Find the selector component rendered below with selected option
              below
            </p>
            <p>
              <EuiTextColor color="accent">
                Selected: {selectedDataSources.map((ds) => ds.label).join(', ')}
              </EuiTextColor>
            </p>
          </EuiText>
          <EuiSpacer />
          {dataSourceEnabled && renderDataSourceComponent}

          <EuiSpacer />
          <EuiText>
            There are a few properties exposed by this component which can be used to customize the
            behavior:
          </EuiText>
          <EuiBasicTable
            tableCaption="Demo of EuiBasicTable"
            items={data}
            rowHeader="name"
            columns={COLUMNS}
          />
        </EuiPageContentBody>
      </EuiPageContent>
    </EuiPageBody>
  );
};

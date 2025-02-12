/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { coreMock } from '../../../../../core/public/mocks';
import * as utils from '../../utils';
import { DataSourceEngineType } from 'src/plugins/data_source/common/data_sources';
import { OpenSearchDashboardsContextProvider } from '../../../../../plugins/opensearch_dashboards_react/public';
import { DataSourceConnectionType } from '../../../common/types';

import { SelectDataSourcePanel, SelectDataSourcePanelProps } from './select_data_source_panel';

const dataSources = [
  {
    id: 'ds1',
    title: 'Data Source 1',
    description: 'Description of data source 1',
    auth: '',
    dataSourceEngineType: '' as DataSourceEngineType,
    workspaces: [],
  },
  {
    id: 'ds2',
    title: 'Data Source 2',
    description: 'Description of data source 2',
    auth: '',
    dataSourceEngineType: '' as DataSourceEngineType,
    workspaces: [],
  },
];

const dataSourceConnectionsMock = [
  {
    id: 'ds1',
    name: 'Data Source 1',
    connectionType: DataSourceConnectionType.OpenSearchConnection,
    type: 'OpenSearch',
    relatedConnections: [
      {
        id: 'ds1-dqc1',
        name: 'dqc1',
        parentId: 'ds1',
        connectionType: DataSourceConnectionType.DirectQueryConnection,
        type: 'Amazon S3',
      },
    ],
  },
  {
    id: 'ds1-dqc1',
    name: 'dqc1',
    parentId: 'ds1',
    connectionType: DataSourceConnectionType.DirectQueryConnection,
    type: 'Amazon S3',
  },
  {
    id: 'ds2',
    name: 'Data Source 2',
    connectionType: DataSourceConnectionType.OpenSearchConnection,
    type: 'OpenSearch',
    relatedConnections: [],
  },
  {
    id: 'dqs1',
    name: 'Data Connection 1',
    connectionType: DataSourceConnectionType.DataConnection,
    type: 'AWS Security Lake',
  },
];
const assignedDataSourcesConnections = [dataSourceConnectionsMock[0], dataSourceConnectionsMock[2]];
jest.spyOn(utils, 'getDataSourcesList').mockResolvedValue(dataSources);
jest.spyOn(utils, 'fetchDataSourceConnections').mockImplementation(async (passedDataSources) => {
  return dataSourceConnectionsMock.filter(({ id }) =>
    passedDataSources.some((dataSource) => dataSource.id === id)
  );
});

const mockCoreStart = coreMock.createStart();

const setup = ({
  savedObjects = mockCoreStart.savedObjects,
  assignedDataSourceConnections = [],
  onChange = jest.fn(),
  errors = undefined,
  showDataSourceManagement = true,
}: Partial<SelectDataSourcePanelProps>) => {
  return render(
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={mockCoreStart}>
        <SelectDataSourcePanel
          onChange={onChange}
          savedObjects={savedObjects}
          assignedDataSourceConnections={assignedDataSourceConnections}
          errors={errors}
          showDataSourceManagement={showDataSourceManagement}
        />
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
};

describe('SelectDataSourcePanel', () => {
  const originalOffsetHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetHeight'
  );
  const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 600,
    });
  });
  afterEach(() => {
    Object.defineProperty(
      HTMLElement.prototype,
      'offsetHeight',
      originalOffsetHeight as PropertyDescriptor
    );
    Object.defineProperty(
      HTMLElement.prototype,
      'offsetWidth',
      originalOffsetWidth as PropertyDescriptor
    );
  });
  it('should render consistent data sources when selected data sources passed', async () => {
    const onChangeMock = jest.fn();
    const { getByTestId, getByText, queryByText } = setup({
      onChange: onChangeMock,
      assignedDataSourceConnections: [dataSourceConnectionsMock[0]],
    });

    expect(queryByText('Data Source 1')).toBeInTheDocument();
    expect(queryByText('Data Source 2')).not.toBeInTheDocument();
    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('workspace-creator-dataSources-assign-button'));
    expect(
      getByText(
        'Add data sources that will be available in the workspace. If a selected data source has related Direct Query data sources, they will also be available in the workspace.'
      )
    ).toBeInTheDocument();
  });

  it('should call onChange when updating data sources', async () => {
    const onChangeMock = jest.fn();
    const { getByTestId, getByText } = setup({
      onChange: onChangeMock,
      assignedDataSourceConnections: [],
    });
    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('workspace-creator-dataSources-assign-button'));
    await waitFor(() => {
      expect(
        getByText(
          'Add data sources that will be available in the workspace. If a selected data source has related Direct Query data sources, they will also be available in the workspace.'
        )
      ).toBeInTheDocument();
      expect(getByText(assignedDataSourcesConnections[1].name)).toBeInTheDocument();
    });

    fireEvent.click(getByText(assignedDataSourcesConnections[1].name));
    fireEvent.click(getByText('Associate data sources'));
    expect(onChangeMock).toHaveBeenCalledWith([
      expect.objectContaining({
        id: assignedDataSourcesConnections[1].id,
      }),
    ]);

    fireEvent.click(getByTestId('workspace-creator-dqc-assign-button'));
    await waitFor(() => {
      expect(getByText(assignedDataSourcesConnections[0].name)).toBeInTheDocument();
    });
    fireEvent.click(getByText(assignedDataSourcesConnections[0].name));
    fireEvent.click(getByText('Associate data sources'));
    expect(onChangeMock).toHaveBeenCalledWith([
      expect.objectContaining({
        id: assignedDataSourcesConnections[0].id,
      }),
    ]);
  });

  it('should call onChange when deleting selected data source', async () => {
    const onChangeMock = jest.fn();
    const { getByText, getByTestId } = setup({
      onChange: onChangeMock,
      assignedDataSourceConnections: assignedDataSourcesConnections,
    });
    fireEvent.click(getByTestId('workspace-creator-dataSources-assign-button'));

    await waitFor(() => {
      expect(
        getByText(
          'Add data sources that will be available in the workspace. If a selected data source has related Direct Query data sources, they will also be available in the workspace.'
        )
      ).toBeInTheDocument();
      expect(getByText(assignedDataSourcesConnections[0].name)).toBeInTheDocument();
      expect(getByText(assignedDataSourcesConnections[1].name)).toBeInTheDocument();
    });

    fireEvent.click(getByText(assignedDataSourcesConnections[1].name));
    fireEvent.click(getByText('Associate data sources'));

    fireEvent.click(getByTestId('checkboxSelectRow-' + dataSources[1].id));
    fireEvent.click(getByText('Remove selected'));

    expect(onChangeMock).toHaveBeenCalledWith([assignedDataSourcesConnections[0]]);
  });

  it('should close associate data sources modal', async () => {
    const { getByText, queryByText, getByTestId } = setup({
      assignedDataSourceConnections: [],
    });
    fireEvent.click(getByTestId('workspace-creator-dataSources-assign-button'));
    await waitFor(() => {
      expect(
        getByText(
          'Add data sources that will be available in the workspace. If a selected data source has related Direct Query data sources, they will also be available in the workspace.'
        )
      ).toBeInTheDocument();
      fireEvent.click(getByText('Cancel'));
    });
    expect(
      queryByText(
        'Add data sources that will be available in the workspace. If a selected data source has related Direct Query data sources, they will also be available in the workspace.'
      )
    ).toBeNull();
  });

  it('should render empty message and action buttons', () => {
    const { getByText, getByTestId } = setup({
      assignedDataSourceConnections: [],
    });

    expect(getByText('Associated data sources will appear here')).toBeInTheDocument();
    expect(
      getByTestId('workspace-creator-emptyPrompt-dataSources-assign-button')
    ).toBeInTheDocument();
    expect(getByTestId('workspace-creator-emptyPrompt-dqc-assign-button')).toBeInTheDocument();
  });
});

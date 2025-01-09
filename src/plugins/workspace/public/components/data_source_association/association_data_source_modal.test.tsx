/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { DataSourceConnectionType } from '../../../common/types';
import { chromeServiceMock, coreMock } from '../../../../../core/public/mocks';
import * as utilsExports from '../../utils';

import {
  AssociationDataSourceModal,
  AssociationDataSourceModalProps,
} from './association_data_source_modal';
import { AssociationDataSourceModalMode } from 'src/plugins/workspace/common/constants';
import { DataSourceEngineType } from '../../../../data_source/common/data_sources';
const dataSourcesList = [
  {
    id: 'ds1',
    title: 'Data Source 1',
    description: 'Description of data source 1',
    auth: '',
    dataSourceEngineType: '' as DataSourceEngineType,
    workspaces: [],
    // This is used for mocking saved object function
    get: () => {
      return 'Data Source 1';
    },
  },
  {
    id: 'dqs1',
    title: 'Data Connection 1',
    description: 'Description of data connection 1',
    auth: '',
    dataSourceEngineType: '' as DataSourceEngineType,
    workspaces: [],
    get: () => {
      return 'Data Connection 1';
    },
  },
];

const openSearchAndDataConnectionsMock = {
  openSearchConnections: [
    {
      id: 'ds1',
      name: 'Data Source 1',
      type: 'OpenSearch',
      connectionType: DataSourceConnectionType.OpenSearchConnection,
      relatedConnections: [],
    },
  ],
  dataConnections: [
    {
      id: 'dqs1',
      name: 'Data Connection 1',
      connectionType: DataSourceConnectionType.DataConnection,
      type: 'AWS Security Lake',
    },
  ],
};
const setupAssociationDataSourceModal = ({
  mode,
  excludedConnectionIds,
  handleAssignDataSourceConnections,
}: Partial<AssociationDataSourceModalProps> = {}) => {
  const coreServices = coreMock.createStart();
  jest.spyOn(utilsExports, 'getDataSourcesList').mockResolvedValue(dataSourcesList);

  jest
    .spyOn(utilsExports, 'convertDataSourcesToOpenSearchAndDataConnections')
    .mockReturnValue(openSearchAndDataConnectionsMock);

  jest.spyOn(utilsExports, 'fetchDirectQueryConnectionsByIDs').mockResolvedValue([
    {
      id: 'ds1-dqc1',
      name: 'dqc1',
      type: 'Amazon S3',
      connectionType: DataSourceConnectionType.DirectQueryConnection,
      parentId: 'ds1',
    },
  ]);

  const { logos } = chromeServiceMock.createStartContract();
  render(
    <IntlProvider locale="en">
      <AssociationDataSourceModal
        logos={logos}
        mode={mode ?? AssociationDataSourceModalMode.DirectQueryConnections}
        http={coreServices.http}
        notifications={coreServices.notifications}
        savedObjects={coreServices.savedObjects}
        closeModal={jest.fn()}
        excludedConnectionIds={excludedConnectionIds ?? []}
        handleAssignDataSourceConnections={handleAssignDataSourceConnections ?? jest.fn()}
      />
    </IntlProvider>
  );
  return {};
};

describe('AssociationDataSourceModal', () => {
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

  it('should display opensearch connections', async () => {
    setupAssociationDataSourceModal({ mode: AssociationDataSourceModalMode.OpenSearchConnections });
    expect(screen.getByText('Associate OpenSearch data sources')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Add data sources that will be available in the workspace. If a selected data source has related Direct Query data sources, they will also be available in the workspace.'
      )
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Data Source 1')).toBeInTheDocument());
  });

  it('should display direct query connections after opensearch connection selected', async () => {
    setupAssociationDataSourceModal({
      mode: AssociationDataSourceModalMode.DirectQueryConnections,
    });
    expect(screen.getByText('Associate direct query data sources')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Data Source 1')).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'dqc1' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('option', { name: 'Data Source 1' }));
      expect(screen.getByRole('option', { name: 'dqc1' })).toBeInTheDocument();
    });
  });

  it('should hide associated connections', async () => {
    setupAssociationDataSourceModal({
      excludedConnectionIds: ['ds1'],
    });
    expect(
      screen.getByText(
        'Add data sources that will be available in the workspace. If a selected data source has related Direct Query data sources, they will also be available in the workspace.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Data Source 1' })).not.toBeInTheDocument();
  });

  it('should call handleAssignDataSourceConnections with opensearch connections after assigned', async () => {
    const handleAssignDataSourceConnectionsMock = jest.fn();
    setupAssociationDataSourceModal({
      handleAssignDataSourceConnections: handleAssignDataSourceConnectionsMock,
    });
    await waitFor(() => {
      expect(screen.getByText('Data Source 1')).toBeInTheDocument();
      expect(screen.getByText('Associate data sources')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Data Source 1'));
    fireEvent.click(screen.getByText('Associate data sources'));

    expect(handleAssignDataSourceConnectionsMock).toHaveBeenCalledWith([
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
    ]);
  });

  it('should call handleAssignDataSourceConnections with data connections after assigned', async () => {
    const handleAssignDataSourceConnectionsMock = jest.fn();
    setupAssociationDataSourceModal({
      handleAssignDataSourceConnections: handleAssignDataSourceConnectionsMock,
      mode: AssociationDataSourceModalMode.OpenSearchConnections,
    });
    await waitFor(() => {
      expect(screen.getByText('Data Source 1')).toBeInTheDocument();
      expect(screen.getByText('Data Connection 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Associate data sources')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Data Connection 1'));
    fireEvent.click(screen.getByText('Associate data sources'));

    expect(handleAssignDataSourceConnectionsMock).toHaveBeenCalledWith([
      {
        id: 'dqs1',
        name: 'Data Connection 1',
        connectionType: DataSourceConnectionType.DataConnection,
        type: 'AWS Security Lake',
      },
    ]);
  });
});

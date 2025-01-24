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

const setupAssociationDataSourceModal = ({
  mode,
  excludedConnectionIds,
  handleAssignDataSourceConnections,
}: Partial<AssociationDataSourceModalProps> = {}) => {
  const coreServices = coreMock.createStart();
  jest.spyOn(utilsExports, 'getDataSourcesList').mockResolvedValue([]);
  jest.spyOn(utilsExports, 'fetchDataSourceConnections').mockResolvedValue([
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
    },
    {
      id: 'dqs1',
      name: 'Data Connection 1',
      connectionType: DataSourceConnectionType.DataConnection,
      type: 'AWS Security Lake',
    },
  ]);
  const { logos } = chromeServiceMock.createStartContract();
  render(
    <IntlProvider locale="en">
      <AssociationDataSourceModal
        logos={logos}
        mode={mode ?? AssociationDataSourceModalMode.OpenSearchConnections}
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

  it('should display opensearch connections and should not display data connection when associating OpenSearch data sources', async () => {
    setupAssociationDataSourceModal();
    expect(screen.getByText('Associate OpenSearch data sources')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Add data sources that will be available in the workspace. If a selected data source has related Direct Query data sources, they will also be available in the workspace.'
      )
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Data Source 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Data Source 2' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Data Connection 1' })).not.toBeInTheDocument();
    });
  });

  it('should display data connection when associating direct query data sources', async () => {
    setupAssociationDataSourceModal({
      mode: AssociationDataSourceModalMode.DirectQueryConnections,
    });
    expect(screen.getByText('Associate direct query data sources')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Data Connection 1' })).toBeInTheDocument();
    });
  });

  it('should not render the second step fetching dqc when associating OpenSearch data sources', async () => {
    setupAssociationDataSourceModal();
    expect(screen.getByText('Associate OpenSearch data sources')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Data Source 1' })).toBeInTheDocument();
      expect(screen.queryByText('+ 1 related')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('option', { name: 'Data Source 1' }));
      expect(screen.queryByRole('option', { name: 'dqc1' })).not.toBeInTheDocument();
    });
  });

  it('should display direct query connections after opensearch connection selected', async () => {
    setupAssociationDataSourceModal({
      mode: AssociationDataSourceModalMode.DirectQueryConnections,
    });
    expect(screen.getByText('Associate direct query data sources')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('+ 1 related')).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'dqc1' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('option', { name: 'Data Source 1' }));
      expect(screen.getByRole('option', { name: 'dqc1' })).toBeInTheDocument();
    });
  });

  it('should hide associated connections', async () => {
    setupAssociationDataSourceModal({
      excludedConnectionIds: ['ds2'],
    });
    expect(
      screen.getByText(
        'Add data sources that will be available in the workspace. If a selected data source has related Direct Query data sources, they will also be available in the workspace.'
      )
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Data Source 1' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Data Source 2' })).not.toBeInTheDocument();
    });
  });

  it('should call handleAssignDataSourceConnections with opensearch connections after assigned', async () => {
    const handleAssignDataSourceConnectionsMock = jest.fn();
    setupAssociationDataSourceModal({
      handleAssignDataSourceConnections: handleAssignDataSourceConnectionsMock,
    });

    await waitFor(() => {
      fireEvent.click(screen.getByRole('option', { name: 'Data Source 1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Associate data sources' }));
    });

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
      mode: AssociationDataSourceModalMode.DirectQueryConnections,
    });

    await waitFor(() => {
      fireEvent.click(screen.getByRole('option', { name: 'Data Connection 1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Associate data sources' }));
    });

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

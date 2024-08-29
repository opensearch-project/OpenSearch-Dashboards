/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { DataSourceConnectionType } from '../../../common/types';
import { coreMock } from '../../../../../core/public/mocks';
import * as utilsExports from '../../utils';

import {
  getUpdatedOptions,
  DataSourceModalOption,
  AssociationDataSourceModal,
  AssociationDataSourceModalProps,
} from './association_data_source_modal';

const mockPrevAllOptions = [
  {
    connection: {
      id: 'ds1',
      connectionType: DataSourceConnectionType.OpenSearchConnection,
    },
    checked: undefined,
  },
  {
    connection: {
      id: 'dqc1',
      connectionType: DataSourceConnectionType.DirectQueryConnection,
      parentId: 'ds1',
    },
    checked: undefined,
  },
  {
    connection: {
      id: 'ds2',
      connectionType: DataSourceConnectionType.OpenSearchConnection,
    },
    checked: 'on',
  },
  {
    connection: {
      id: 'dqc2',
      connectionType: DataSourceConnectionType.DirectQueryConnection,
      parentId: 'ds2',
    },
    checked: 'on',
  },
] as DataSourceModalOption[];

describe('AssociationDataSourceModal utils: getUpdatedOptions', () => {
  it('should not update checked status when an option remains unchanged', () => {
    const newOptions = [
      {
        connection: {
          id: 'ds1',
          connectionType: DataSourceConnectionType.OpenSearchConnection,
          parentId: null,
        },
        checked: undefined,
      },
      {
        connection: {
          id: 'dqc1',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
          parentId: 'ds1',
        },
        checked: undefined,
      },
      {
        connection: {
          id: 'ds2',
          connectionType: DataSourceConnectionType.OpenSearchConnection,
          parentId: null,
        },
        checked: 'on',
      },
      {
        connection: {
          id: 'dqc2',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
          parentId: 'ds2',
        },
        checked: 'on',
      },
    ] as DataSourceModalOption[];

    const updatedOptions = getUpdatedOptions({ prevAllOptions: mockPrevAllOptions, newOptions });

    expect(updatedOptions).toEqual(mockPrevAllOptions);
  });

  it('should update checked status when a data source option is checked', () => {
    const newOptions = [
      {
        connection: {
          id: 'ds1',
          connectionType: DataSourceConnectionType.OpenSearchConnection,
        },
        checked: 'on',
      },
      {
        connection: {
          id: 'ds2',
          connectionType: DataSourceConnectionType.OpenSearchConnection,
        },
        checked: 'on',
      },
    ] as DataSourceModalOption[];

    const updatedOptions = getUpdatedOptions({ prevAllOptions: mockPrevAllOptions, newOptions });

    expect(updatedOptions).toEqual([
      {
        connection: {
          id: 'ds1',
          connectionType: DataSourceConnectionType.OpenSearchConnection,
        },
        checked: 'on',
      },
      {
        connection: {
          id: 'dqc1',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
          parentId: 'ds1',
        },
        checked: 'on',
      },
      {
        connection: {
          id: 'ds2',
          connectionType: DataSourceConnectionType.OpenSearchConnection,
        },
        checked: 'on',
      },
      {
        connection: {
          id: 'dqc2',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
          parentId: 'ds2',
        },
        checked: 'on',
      },
    ]);
  });

  it('should update checked status when a direct query connection option is checked', () => {
    const newOptions = [
      {
        connection: {
          id: 'dqc1',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
          parentId: 'ds1',
        },
        checked: 'on',
      },
      {
        connection: {
          id: 'dqc2',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
          parentId: 'ds2',
        },
        checked: 'on',
      },
    ] as DataSourceModalOption[];

    const updatedOptions = getUpdatedOptions({ prevAllOptions: mockPrevAllOptions, newOptions });

    expect(updatedOptions).toEqual([
      {
        connection: {
          id: 'ds1',
          connectionType: DataSourceConnectionType.OpenSearchConnection,
        },
        checked: 'on',
      },
      {
        connection: {
          id: 'dqc1',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
          parentId: 'ds1',
        },
        checked: 'on',
      },
      {
        connection: {
          id: 'ds2',
          connectionType: DataSourceConnectionType.OpenSearchConnection,
        },
        checked: 'on',
      },
      {
        connection: {
          id: 'dqc2',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
          parentId: 'ds2',
        },
        checked: 'on',
      },
    ]);
  });

  it('should update checked status when a data source option is unchecked', () => {
    const newOptions = [
      {
        connection: {
          id: 'ds1',
          connectionType: DataSourceConnectionType.OpenSearchConnection,
        },
        checked: undefined,
      },
      {
        connection: {
          id: 'ds2',
          connectionType: DataSourceConnectionType.OpenSearchConnection,
        },
        checked: undefined,
      },
    ] as DataSourceModalOption[];

    const updatedOptions = getUpdatedOptions({ prevAllOptions: mockPrevAllOptions, newOptions });

    expect(updatedOptions).toEqual([
      {
        connection: {
          id: 'ds1',
          connectionType: DataSourceConnectionType.OpenSearchConnection,
        },
        checked: undefined,
      },
      {
        connection: {
          id: 'dqc1',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
          parentId: 'ds1',
        },
        checked: undefined,
      },
      {
        connection: {
          id: 'ds2',
          connectionType: DataSourceConnectionType.OpenSearchConnection,
        },
        checked: undefined,
      },
      {
        connection: {
          id: 'dqc2',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
          parentId: 'ds2',
        },
        checked: undefined,
      },
    ]);
  });

  it('should update checked status when a direct query connection option is unchecked', () => {
    const newOptions = [
      {
        connection: {
          id: 'dqc1',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
          parentId: 'ds1',
        },
        checked: undefined,
      },
      {
        connection: {
          id: 'dqc2',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
          parentId: 'ds2',
        },
        checked: undefined,
      },
    ] as DataSourceModalOption[];

    const updatedOptions = getUpdatedOptions({ prevAllOptions: mockPrevAllOptions, newOptions });

    expect(updatedOptions).toEqual([
      {
        connection: {
          id: 'ds1',
          connectionType: DataSourceConnectionType.OpenSearchConnection,
        },
        checked: undefined,
      },
      {
        connection: {
          id: 'dqc1',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
          parentId: 'ds1',
        },
        checked: undefined,
      },
      {
        connection: {
          id: 'ds2',
          connectionType: DataSourceConnectionType.OpenSearchConnection,
        },
        checked: 'on',
      },
      {
        connection: {
          id: 'dqc2',
          connectionType: DataSourceConnectionType.DirectQueryConnection,
          parentId: 'ds2',
        },
        checked: undefined,
      },
    ]);
  });
});

const setupAssociationDataSourceModal = ({
  assignedConnections,
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
          type: 'S3',
        },
      ],
    },
    {
      id: 'ds1-dqc1',
      name: 'dqc1',
      parentId: 'ds1',
      connectionType: DataSourceConnectionType.DirectQueryConnection,
      type: 'S3',
    },
    {
      id: 'ds2',
      name: 'Data Source 2',
      connectionType: DataSourceConnectionType.OpenSearchConnection,
      type: 'OpenSearch',
    },
  ]);
  render(
    <IntlProvider locale="en">
      <AssociationDataSourceModal
        http={coreServices.http}
        notifications={coreServices.notifications}
        savedObjects={coreServices.savedObjects}
        closeModal={jest.fn()}
        assignedConnections={assignedConnections || []}
        handleAssignDataSourceConnections={handleAssignDataSourceConnections || jest.fn()}
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

  it('should display data sources options by default', async () => {
    setupAssociationDataSourceModal();
    expect(screen.getByText('Associate OpenSearch connections')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Data Source 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Data Source 2' })).toBeInTheDocument();
    });
  });

  it('should hide associated data sources', async () => {
    setupAssociationDataSourceModal({
      assignedConnections: [
        {
          id: 'ds2',
          name: 'Data Source 2',
          connectionType: DataSourceConnectionType.OpenSearchConnection,
          type: 'OpenSearch',
        },
      ],
    });
    expect(screen.getByText('Associate OpenSearch connections')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Data Source 1' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Data Source 2' })).not.toBeInTheDocument();
    });
  });

  it('should call handleAssignDataSourceConnections with data source and DQCs after data source assigned', async () => {
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
            type: 'S3',
          },
        ],
      },
      {
        id: 'ds1-dqc1',
        name: 'dqc1',
        parentId: 'ds1',
        connectionType: DataSourceConnectionType.DirectQueryConnection,
        type: 'S3',
      },
    ]);
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { DataSourceConnectionType } from '../../../common/types';

import { DataSourceModalOption, getUpdatedOptions } from './association_data_source_modal';

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

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createDataSourceMenu } from './create_data_source_menu';
import { SavedObjectsClientContract } from '../../../../../core/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import React from 'react';
import { render } from '@testing-library/react';
import { DataSourceComponentType, DataSourceSelectableConfig } from './types';

describe('create data source menu', () => {
  let client: SavedObjectsClientContract;
  const notifications = notificationServiceMock.createStartContract();

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
  });

  it('should render data source selectable normally', () => {
    const props = {
      savedObjects: client,
      notifications,
      componentType: DataSourceComponentType.DataSourceSelectable,
      componentConfig: {
        fullWidth: true,
        hideLocalCluster: true,
        onSelectedDataSources: jest.fn(),
      },
    };
    const TestComponent = createDataSourceMenu<DataSourceSelectableConfig>();
    const component = render(<TestComponent {...props} />);
    expect(component).toMatchSnapshot();
    expect(client.find).toBeCalledWith({
      fields: ['id', 'title', 'auth.type'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(notifications.toasts.addWarning).toBeCalledTimes(0);
  });
});

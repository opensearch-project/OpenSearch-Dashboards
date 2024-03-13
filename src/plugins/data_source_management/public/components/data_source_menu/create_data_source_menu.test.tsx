/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createDataSourceMenu } from './create_data_source_menu';
import { SavedObjectsClientContract } from '../../../../../core/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import React from 'react';
import { render } from '@testing-library/react';

describe('create data source menu', () => {
  let client: SavedObjectsClientContract;
  const notifications = notificationServiceMock.createStartContract();

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
  });

  it('should render normally', () => {
    const props = {
      showDataSourceSelectable: true,
      appName: 'myapp',
      savedObjects: client,
      notifications,
      fullWidth: true,
      hideLocalCluster: true,
      disableDataSourceSelectable: false,
      className: 'myclass',
    };
    const TestComponent = createDataSourceMenu();
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

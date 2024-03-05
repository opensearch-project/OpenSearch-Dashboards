/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { createClusterSelector } from './create_cluster_selector';
import { SavedObjectsClientContract } from '../../../../../core/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import React from 'react';
import { render } from '@testing-library/react';

describe('create cluster selector', () => {
  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
  });

  it('should render normally', () => {
    const props = {
      savedObjectsClient: client,
      notifications: toasts,
      onSelectedDataSource: jest.fn(),
      disabled: false,
      hideLocalCluster: false,
      fullWidth: false,
    };
    const TestComponent = createClusterSelector();
    const component = render(<TestComponent {...props} />);
    expect(component).toMatchSnapshot();
    expect(client.find).toBeCalledWith({
      fields: ['id', 'description', 'title'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(toasts.addWarning).toBeCalledTimes(0);
  });
});

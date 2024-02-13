/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow } from 'enzyme';
import { ClusterSelector } from './cluster_selector';
import { SavedObjectsClientContract } from '../../../../../core/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import React from 'react';

describe('ClusterSelector', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
  });

  it('should render normally with local cluster not hidden', () => {
    component = shallow(
      <ClusterSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
      />
    );
    expect(component).toMatchSnapshot();
    expect(client.find).toBeCalledWith({
      fields: ['id', 'description', 'title'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(toasts.addWarning).toBeCalledTimes(0);
  });

  it('should render normally with local cluster is hidden', () => {
    component = shallow(
      <ClusterSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={true}
        fullWidth={false}
      />
    );
    expect(component).toMatchSnapshot();
    expect(client.find).toBeCalledWith({
      fields: ['id', 'description', 'title'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(toasts.addWarning).toBeCalledTimes(0);
  });
});

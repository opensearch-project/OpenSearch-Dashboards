/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createDataSourceMenu } from './create_data_source_menu';
import { MountPoint, SavedObjectsClientContract } from '../../../../../core/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import React from 'react';
import { act, render } from '@testing-library/react';
import { DataSourceComponentType, DataSourceSelectableConfig } from './types';
import { ReactWrapper } from 'enzyme';

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
      componentType: DataSourceComponentType.DataSourceSelectable,
      componentConfig: {
        fullWidth: true,
        hideLocalCluster: true,
        onSelectedDataSources: jest.fn(),
        savedObjects: client,
        notifications,
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

describe('when setMenuMountPoint is provided', () => {
  let portalTarget: HTMLElement;
  let mountPoint: MountPoint;
  let setMountPoint: jest.Mock<(mountPoint: MountPoint<HTMLElement>) => void>;
  let dom: ReactWrapper;

  let client: SavedObjectsClientContract;
  const notifications = notificationServiceMock.createStartContract();

  const refresh = () => {
    new Promise(async (resolve) => {
      if (dom) {
        act(() => {
          dom.update();
        });
      }
      setImmediate(() => resolve(dom)); // flushes any pending promises
    });
  };

  beforeEach(() => {
    portalTarget = document.createElement('div');
    document.body.append(portalTarget);
    setMountPoint = jest.fn().mockImplementation((mp) => (mountPoint = mp));
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
  });

  afterEach(() => {
    if (portalTarget) {
      portalTarget.remove();
    }
  });

  it('should mount data source component', async () => {
    const props = {
      setMenuMountPoint: setMountPoint,
      componentType: DataSourceComponentType.DataSourceSelectable,
      componentConfig: {
        fullWidth: true,
        hideLocalCluster: true,
        onSelectedDataSources: jest.fn(),
        savedObjects: client,
        notifications,
      },
    };
    const TestComponent = createDataSourceMenu<DataSourceSelectableConfig>();
    const component = render(<TestComponent {...props} />);
    act(() => {
      mountPoint(portalTarget);
    });

    await refresh();
    expect(component).toMatchSnapshot();
    expect(client.find).toBeCalledWith({
      fields: ['id', 'title', 'auth.type'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(notifications.toasts.addWarning).toBeCalledTimes(0);
    expect(setMountPoint).toBeCalledTimes(1);
  });
});

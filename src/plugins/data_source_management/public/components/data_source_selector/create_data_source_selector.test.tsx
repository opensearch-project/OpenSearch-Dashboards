/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { createDataSourceSelector } from './create_data_source_selector';
import { SavedObjectsClientContract } from '../../../../../core/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import React from 'react';
import { getByText, render } from '@testing-library/react';
import { coreMock } from '../../../../../core/public/mocks';
import {
  mockDataSourcePluginSetupWithHideLocalCluster,
  mockDataSourcePluginSetupWithShowLocalCluster,
} from '../../mocks';
import { DataSourceSelectionService } from '../../service/data_source_selection_service';
import * as utils from '../utils';

describe('create data source selector', () => {
  let client: SavedObjectsClientContract;
  const { uiSettings } = coreMock.createSetup();
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
    const dataSourceSelection = new DataSourceSelectionService();
    spyOn(utils, 'getDataSourceSelection').and.returnValue(dataSourceSelection);

    const TestComponent = createDataSourceSelector(
      uiSettings,
      mockDataSourcePluginSetupWithHideLocalCluster
    );
    const component = render(<TestComponent {...props} />);
    expect(component).toMatchSnapshot();
    expect(client.find).toBeCalledWith({
      fields: ['id', 'title', 'auth.type', 'dataSourceVersion', 'installedPlugins'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(toasts.addWarning).toBeCalledTimes(0);
  });

  it('should ignore props.hideLocalCluster, and show local cluster when data_source.hideLocalCluster is set to false', () => {
    const props = {
      savedObjectsClient: client,
      notifications: toasts,
      onSelectedDataSource: jest.fn(),
      disabled: false,
      hideLocalCluster: true,
      fullWidth: false,
    };
    const dataSourceSelection = new DataSourceSelectionService();
    spyOn(utils, 'getDataSourceSelection').and.returnValue(dataSourceSelection);

    const TestComponent = createDataSourceSelector(
      uiSettings,
      mockDataSourcePluginSetupWithShowLocalCluster
    );
    const component = render(<TestComponent {...props} />);
    expect(component).toMatchSnapshot();
    expect(getByText(component.container, 'Local cluster')).toBeInTheDocument();
  });
});

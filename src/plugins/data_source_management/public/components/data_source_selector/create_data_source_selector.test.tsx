/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { createDataSourceSelector } from './create_data_source_selector';
import { SavedObjectsClientContract } from '../../../../../core/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';

import { getByText, queryByText, render } from '@testing-library/react';
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
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);

    const TestComponent = createDataSourceSelector(
      uiSettings,
      mockDataSourcePluginSetupWithHideLocalCluster
    );
    const component = render(<TestComponent {...props} />);
    expect(component).toMatchSnapshot();
    expect(client.find).toHaveBeenCalledWith({
      fields: [
        'id',
        'title',
        'auth.type',
        'dataSourceVersion',
        'installedPlugins',
        'dataSourceEngineType',
      ],
      perPage: 10000,
      type: 'data-source',
    });
    expect(toasts.addWarning).toHaveBeenCalledTimes(0);
  });

  it('lets an explicit props.hideLocalCluster=true win over the data_source config (hides local cluster)', () => {
    const props = {
      savedObjectsClient: client,
      notifications: toasts,
      onSelectedDataSource: jest.fn(),
      disabled: false,
      hideLocalCluster: true,
      fullWidth: false,
    };
    const dataSourceSelection = new DataSourceSelectionService();
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);

    // Global config says SHOW local cluster, but the caller explicitly passes hideLocalCluster=true.
    const TestComponent = createDataSourceSelector(
      uiSettings,
      mockDataSourcePluginSetupWithShowLocalCluster
    );
    const component = render(<TestComponent {...props} />);
    expect(component).toMatchSnapshot();
    // The explicit prop wins → the synthetic "Local cluster" option is not rendered.
    expect(queryByText(component.container, 'Local cluster')).not.toBeInTheDocument();
  });

  it('falls back to the data_source config when the caller omits hideLocalCluster', () => {
    const props = {
      savedObjectsClient: client,
      notifications: toasts,
      onSelectedDataSource: jest.fn(),
      disabled: false,
      fullWidth: false,
    };
    const dataSourceSelection = new DataSourceSelectionService();
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);

    // No hideLocalCluster prop → uses the config value (here: show local cluster).
    const TestComponent = createDataSourceSelector(
      uiSettings,
      mockDataSourcePluginSetupWithShowLocalCluster
    );
    const component = render(<TestComponent {...(props as any)} />);
    expect(getByText(component.container, 'Local cluster')).toBeInTheDocument();
  });
});

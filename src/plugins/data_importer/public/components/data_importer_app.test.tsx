/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { DataImporterPluginApp } from './data_importer_app';
import { coreMock } from '../../../../core/public/mocks';
import { testDataSourceManagementPlugin } from '../../../data_source_management/public/mocks';
import { PublicConfigSchema } from '../../config';
import { navigationPluginMock } from '../../../navigation/public/mocks';
import { DEFAULT_SUPPORTED_FILE_TYPES_LIST, PLUGIN_ID } from '../../common';

describe('App', () => {
  const notificationsMock = coreMock.createStart().notifications;
  const httpMock = coreMock.createStart().http;
  const savedObjectsMock = coreMock.createStart().savedObjects;
  const navigationMock = navigationPluginMock.createStartContract();
  const mockConfig: PublicConfigSchema = {
    filePreviewDocumentsCount: 10,
    enabledFileTypes: DEFAULT_SUPPORTED_FILE_TYPES_LIST,
    maxFileSizeBytes: 104857600,
    maxTextCount: 10000,
  };

  it('should render without MDS', () => {
    const dataSourceManagementMock = {
      registerAuthenticationMethod: jest.fn(),
      ui: {
        DataSourceSelector: () => <div>Mock DataSourceSelector</div>,
        getDataSourceMenu: jest.fn(),
      },
      dataSourceSelection: {} as any,
      getDefaultDataSourceId: jest.fn(),
      getDefaultDataSourceId$: jest.fn(),
    };
    const { container } = render(
      <DataImporterPluginApp
        basename={PLUGIN_ID}
        notifications={notificationsMock}
        http={httpMock}
        savedObjects={savedObjectsMock}
        navigation={navigationMock}
        config={mockConfig}
        dataSourceEnabled={false}
        hideLocalCluster={false}
        dataSourceManagement={dataSourceManagementMock}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should render with MDS', () => {
    const dataSourceManagementMock = testDataSourceManagementPlugin(
      coreMock.createSetup(),
      coreMock.createStart()
    ).setup;

    // @ts-expect-error
    dataSourceManagementMock.ui.getDataSourceMenu = jest.fn(() => <div>DataSourceMenu</div>);

    const { container } = render(
      <DataImporterPluginApp
        basename={PLUGIN_ID}
        notifications={notificationsMock}
        http={httpMock}
        savedObjects={savedObjectsMock}
        navigation={navigationMock}
        config={mockConfig}
        dataSourceEnabled={true}
        hideLocalCluster={false}
        dataSourceManagement={dataSourceManagementMock}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should render in embedded mode without Router and page wrappers', () => {
    const dataSourceManagementMock = {
      registerAuthenticationMethod: jest.fn(),
      ui: {
        DataSourceSelector: () => <div>Mock DataSourceSelector</div>,
        getDataSourceMenu: jest.fn(),
      },
      dataSourceSelection: {} as any,
      getDefaultDataSourceId: jest.fn(),
      getDefaultDataSourceId$: jest.fn(),
    };
    const { container } = render(
      <DataImporterPluginApp
        basename={PLUGIN_ID}
        notifications={notificationsMock}
        http={httpMock}
        savedObjects={savedObjectsMock}
        navigation={navigationMock}
        config={mockConfig}
        dataSourceEnabled={false}
        hideLocalCluster={false}
        dataSourceManagement={dataSourceManagementMock}
        embedded={true}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should render with Router when embedded is false', () => {
    const dataSourceManagementMock = {
      registerAuthenticationMethod: jest.fn(),
      ui: {
        DataSourceSelector: () => <div>Mock DataSourceSelector</div>,
        getDataSourceMenu: jest.fn(),
      },
      dataSourceSelection: {} as any,
      getDefaultDataSourceId: jest.fn(),
      getDefaultDataSourceId$: jest.fn(),
    };
    const { container } = render(
      <DataImporterPluginApp
        basename={PLUGIN_ID}
        notifications={notificationsMock}
        http={httpMock}
        savedObjects={savedObjectsMock}
        navigation={navigationMock}
        config={mockConfig}
        dataSourceEnabled={false}
        hideLocalCluster={false}
        dataSourceManagement={dataSourceManagementMock}
        embedded={false}
      />
    );
    expect(container).toMatchSnapshot();
  });
});

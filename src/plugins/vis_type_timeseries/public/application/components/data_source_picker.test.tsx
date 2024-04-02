/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';

import { DataSourcePicker } from './data_source_picker';
import {
  coreMock,
  notificationServiceMock,
  savedObjectsServiceMock,
} from '../../../../../core/public/mocks';
import { testDataSourceManagementPlugin } from '../../../../data_source_management/public/mocks';
import { DataSourceSelector } from '../../../../data_source_management/public';

describe('DataSourcePicker', () => {
  const nextTick = () => new Promise((res) => process.nextTick(res));
  const getPluginSetupStartMocks = () => {
    const savedObjectsClient = savedObjectsServiceMock.createStartContract().client;
    savedObjectsClient.get = jest.fn().mockImplementation((type: string, id: string) => {
      if (type === 'data-source' && id !== 'nonexistent-id') {
        return Promise.resolve({
          id,
          type,
          attributes: {
            title: `some-title-for-${id}`,
          },
        });
      }

      return Promise.resolve({
        id,
        type,
        error: {
          statusCode: 404,
          message: 'Not found',
        },
      });
    });

    return {
      savedObjectsClient,
      dataSourceManagement: testDataSourceManagementPlugin(
        coreMock.createSetup(),
        coreMock.createStart()
      ).setup,
      toasts: notificationServiceMock.createStartContract().toasts,
      handleChange: jest.fn(),
      hideLocalCluster: false,
    };
  };

  test('should render local cluster without datasource id provided', () => {
    const {
      dataSourceManagement,
      savedObjectsClient,
      toasts,
      handleChange,
    } = getPluginSetupStartMocks();
    const component = mount(
      <DataSourcePicker
        savedObjectsClient={savedObjectsClient}
        dataSourceManagement={dataSourceManagement}
        toasts={toasts}
        handleChange={handleChange}
      />
    );

    const dataSourceSelector = component.find(DataSourceSelector);
    expect(dataSourceSelector.prop('defaultOption')).toBe(null);
    expect(component).toMatchSnapshot();
    expect(toasts.addWarning).toBeCalledTimes(0);
    expect(handleChange).toBeCalledTimes(0);
  });

  test('render local cluster when datasource id = ""', () => {
    const {
      dataSourceManagement,
      savedObjectsClient,
      toasts,
      handleChange,
    } = getPluginSetupStartMocks();
    const component = mount(
      <DataSourcePicker
        savedObjectsClient={savedObjectsClient}
        dataSourceManagement={dataSourceManagement}
        toasts={toasts}
        handleChange={handleChange}
        defaultDataSourceId={''}
      />
    );

    const dataSourceSelector = component.find(DataSourceSelector);
    expect(dataSourceSelector.prop('defaultOption')).toBe(null);
    expect(component).toMatchSnapshot();
    expect(toasts.addWarning).toBeCalledTimes(0);
    expect(handleChange).toBeCalledTimes(0);
  });

  test('render local cluster when datasource id is not in saved objects', async () => {
    const {
      dataSourceManagement,
      savedObjectsClient,
      toasts,
      handleChange,
    } = getPluginSetupStartMocks();
    const component = mount(
      <DataSourcePicker
        savedObjectsClient={savedObjectsClient}
        dataSourceManagement={dataSourceManagement}
        toasts={toasts}
        handleChange={handleChange}
        defaultDataSourceId={'nonexistent-id'}
      />
    );

    await nextTick();
    component.update();
    const dataSourceSelector = component.find(DataSourceSelector);
    expect(dataSourceSelector.prop('defaultOption')).toBe(null);
    expect(component).toMatchSnapshot();
    expect(toasts.addWarning).toBeCalledTimes(0);
    expect(handleChange).toBeCalledTimes(0);
    expect(savedObjectsClient.get).toBeCalledTimes(1);
  });

  test('render correct default option when datasource id is valid', async () => {
    const {
      dataSourceManagement,
      savedObjectsClient,
      toasts,
      handleChange,
    } = getPluginSetupStartMocks();
    const component = mount(
      <DataSourcePicker
        savedObjectsClient={savedObjectsClient}
        dataSourceManagement={dataSourceManagement}
        toasts={toasts}
        handleChange={handleChange}
        defaultDataSourceId={'some-valid-id'}
      />
    );

    await nextTick();
    component.update();
    const dataSourceSelector = component.find(DataSourceSelector);
    expect(dataSourceSelector.prop('defaultOption')).toMatchObject([
      { label: 'some-title-for-some-valid-id', id: 'some-valid-id' },
    ]);
    expect(component).toMatchSnapshot();
    expect(toasts.addWarning).toBeCalledTimes(0);
    expect(handleChange).toBeCalledTimes(0);
    expect(savedObjectsClient.get).toBeCalledTimes(1);
  });
});

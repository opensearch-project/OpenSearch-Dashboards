/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from 'src/core/public';
import { coreMock } from '../../../core/public/mocks';
import { managementPluginMock } from '../../management/public/mocks';
import { urlForwardingPluginMock } from '../../url_forwarding/public/mocks';
import { dataPluginMock } from '../../data/public/mocks';
import { DatasetManagementSetup, DatasetManagementStart, DatasetManagementPlugin } from './plugin';

const createSetupContract = (): DatasetManagementSetup => ({
  creation: {
    addCreationConfig: jest.fn(),
  } as any,
  list: {
    addListConfig: jest.fn(),
  } as any,
  fieldFormatEditors: {
    getAll: jest.fn(),
    getById: jest.fn(),
  } as any,
  environment: {
    update: jest.fn(),
  },
  columns: {
    register: jest.fn(),
  },
});

// @ts-expect-error TS2741 TODO(ts-error): fixme
const createStartContract = (): DatasetManagementStart => ({
  creation: {
    getType: jest.fn(),
    getDatasetCreationOptions: jest.fn(),
  } as any,
  list: {
    getDatasetTags: jest.fn(),
    getFieldInfo: jest.fn(),
    areScriptedFieldsEnabled: jest.fn(),
  } as any,
  fieldFormatEditors: {
    getAll: jest.fn(),
    getById: jest.fn(),
  } as any,
});

const createInstance = async () => {
  // @ts-expect-error TS2554 TODO(ts-error): fixme
  const plugin = new DatasetManagementPlugin({} as PluginInitializerContext);

  const setup = plugin.setup(coreMock.createSetup(), {
    management: managementPluginMock.createSetupContract(),
    urlForwarding: urlForwardingPluginMock.createSetupContract(),
  });
  const doStart = () =>
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    plugin.start(coreMock.createStart(), {
      data: dataPluginMock.createStartContract(),
    });

  return {
    plugin,
    setup,
    doStart,
  };
};

const docLinks = {
  links: {
    noDocumentation: {
      indexPatterns: {},
      scriptedFields: {},
    },
  },
};

const createDatasetManagmentContext = () => {
  const {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
  } = coreMock.createStart();
  const { http } = coreMock.createSetup();
  const data = dataPluginMock.createStartContract();

  return {
    chrome,
    application,
    savedObjects,
    uiSettings,
    notifications,
    overlays,
    http,
    docLinks,
    data,
    datasetManagementStart: createStartContract(),
    setBreadcrumbs: () => {},
    navigationUI: {
      HeaderControl: () => null,
    },
  };
};

export const mockManagementPlugin = {
  createSetupContract,
  createStartContract,
  createInstance,
  createDatasetManagmentContext,
};

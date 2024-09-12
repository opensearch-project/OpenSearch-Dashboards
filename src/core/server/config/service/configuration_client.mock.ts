/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse } from '@opensearch-project/opensearch/.';
import { IDynamicConfigurationClient, IInternalDynamicConfigurationClient } from '../types';
import { createApiResponse } from '../utils/utils';

const createInternalDynamicConfigurationClientMock = (
  props: InternalDynamicConfigurationClientMockProps = {
    getConfig: {},
    bulkGetConfigs: new Map<string, Record<string, any>>(),
    listConfigs: new Map<string, Record<string, any>>(),
  }
) => {
  const mocked: jest.Mocked<IInternalDynamicConfigurationClient> = {
    getConfig: jest.fn(),
    bulkGetConfigs: jest.fn(),
    listConfigs: jest.fn(),
    createConfig: jest.fn(),
    bulkCreateConfigs: jest.fn(),
    deleteConfig: jest.fn(),
    bulkDeleteConfigs: jest.fn(),
  };
  mocked.getConfig.mockResolvedValue(props.getConfig);
  mocked.bulkGetConfigs.mockResolvedValue(props.bulkGetConfigs);
  mocked.listConfigs.mockResolvedValue(props.listConfigs);
  mocked.createConfig.mockResolvedValue(createApiResponse(props.createConfig));
  mocked.bulkCreateConfigs.mockResolvedValue(createApiResponse(props.bulkCreateConfigs));
  mocked.deleteConfig.mockResolvedValue(createApiResponse(props.deleteConfig));
  mocked.bulkDeleteConfigs.mockResolvedValue(createApiResponse(props.bulkDeleteConfigs));
  return mocked;
};

const createDynamicConfigurationClientMock = (
  props: DynamicConfigurationClientMockProps = {
    getConfig: {},
    bulkGetConfigs: new Map<string, Record<string, any>>(),
    listConfigs: new Map<string, Record<string, any>>(),
  }
) => {
  const mocked: jest.Mocked<IDynamicConfigurationClient> = {
    getConfig: jest.fn(),
    bulkGetConfigs: jest.fn(),
    listConfigs: jest.fn(),
  };
  mocked.getConfig.mockImplementation((getConfigProps, options) => {
    if (getConfigProps.name && getConfigProps.name === 'csp') {
      return Promise.resolve({
        rules: [],
        strict: false,
        warnLegacyBrowsers: false,
      });
    }

    return Promise.resolve(props.getConfig);
  });
  mocked.bulkGetConfigs.mockResolvedValue(props.bulkGetConfigs);
  mocked.listConfigs.mockResolvedValue(props.listConfigs);
  return mocked;
};

export interface InternalDynamicConfigurationClientMockProps {
  getConfig: Record<string, any>;
  bulkGetConfigs: Map<string, Record<string, any>>;
  listConfigs: Map<string, Record<string, any>>;
  createConfig?: Partial<ApiResponse>;
  bulkCreateConfigs?: Partial<ApiResponse>;
  deleteConfig?: Partial<ApiResponse>;
  bulkDeleteConfigs?: Partial<ApiResponse>;
}

export type DynamicConfigurationClientMockProps = Pick<
  InternalDynamicConfigurationClientMockProps,
  'getConfig' | 'bulkGetConfigs' | 'listConfigs'
>;

export const internalDynamicConfigurationClientMock = {
  create: createInternalDynamicConfigurationClientMock,
  createApiResponse,
};

export const dynamicConfigurationClientMock = {
  create: createDynamicConfigurationClientMock,
  createApiResponse,
};

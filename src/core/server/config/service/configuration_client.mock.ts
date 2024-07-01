/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDynamicConfigurationClient, IInternalDynamicConfigurationClient } from '../types';

const createInternalDynamicConfigurationClientMock = (
  props: InternalDynamicConfigurationClientMockProps = {
    getConfig: {},
    bulkGetConfigs: new Map<string, Record<string, any>>(),
    listConfigs: new Map<string, Record<string, any>>(),
    createConfig: '',
    bulkCreateConfigs: '',
    deleteConfig: '',
    bulkDeleteConfigs: '',
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
  mocked.createConfig.mockResolvedValue(props.createConfig);
  mocked.bulkCreateConfigs.mockResolvedValue(props.bulkCreateConfigs);
  mocked.deleteConfig.mockResolvedValue(props.deleteConfig);
  mocked.bulkDeleteConfigs.mockResolvedValue(props.bulkDeleteConfigs);
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
  mocked.getConfig.mockResolvedValue(props.getConfig);
  mocked.bulkGetConfigs.mockResolvedValue(props.bulkGetConfigs);
  mocked.listConfigs.mockResolvedValue(props.listConfigs);
  return mocked;
};

export interface InternalDynamicConfigurationClientMockProps {
  getConfig: Record<string, any>;
  bulkGetConfigs: Map<string, Record<string, any>>;
  listConfigs: Map<string, Record<string, any>>;
  createConfig: string;
  bulkCreateConfigs: string;
  deleteConfig: string;
  bulkDeleteConfigs: string;
}

export type DynamicConfigurationClientMockProps = Pick<
  InternalDynamicConfigurationClientMockProps,
  'getConfig' | 'bulkGetConfigs' | 'listConfigs'
>;

export const internalDynamicConfigurationClientMock = {
  create: createInternalDynamicConfigurationClientMock,
};

export const dynamicConfigurationClientMock = {
  create: createDynamicConfigurationClientMock,
};

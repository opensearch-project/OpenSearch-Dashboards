/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { MetricsRecorderSetup, MetricsRecorderStart } from '.';

export type Setup = jest.Mocked<MetricsRecorderSetup>;
export type Start = jest.Mocked<MetricsRecorderStart>;

const createSetupContract = (): Setup => {
  const setupContract: Setup = {
    recordCount: jest.fn(),
  };

  return setupContract;
};

const createStartContract = (): Start => {
  const startContract: Start = {
    recordCount: jest.fn(),
  };

  return startContract;
};

export const usageCollectionPluginMock = {
  createSetupContract,
  createStartContract,
};

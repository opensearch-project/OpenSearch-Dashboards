/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentManagementPluginSetup, ContentManagementPluginStart } from './types';

const createStartContract = (): jest.Mocked<ContentManagementPluginStart> => {
  return {
    registerContentProvider: jest.fn(),
    renderPage: jest.fn(),
    updatePageSection: jest.fn(),
    getPage: jest.fn(),
  };
};

const createSetupContract = (): jest.Mocked<ContentManagementPluginSetup> => {
  return {
    registerPage: jest.fn(),
  };
};

export const contentManagementPluginMocks = {
  createStartContract,
  createSetupContract,
};

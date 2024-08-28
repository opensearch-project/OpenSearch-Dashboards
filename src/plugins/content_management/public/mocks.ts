/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentManagementPluginSetup, ContentManagementPluginStart } from './types';

const createStartContract = (): ContentManagementPluginStart => {
  return {
    registerContentProvider: jest.fn(),
    renderPage: jest.fn(),
    updatePageSection: jest.fn(),
  };
};

const createSetupContract = (): ContentManagementPluginSetup => {
  return {
    registerPage: jest.fn(),
  };
};

export const contentManagementPluginMocks = {
  createStartContract,
  createSetupContract,
};

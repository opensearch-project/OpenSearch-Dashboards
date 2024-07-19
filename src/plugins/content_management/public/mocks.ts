import { ContentManagementPluginSetup, ContentManagementPluginStart } from './types';

const createStartContract = (): ContentManagementPluginStart => {
  return {
    registerContentProvider: jest.fn(),
    renderPage: jest.fn(),
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

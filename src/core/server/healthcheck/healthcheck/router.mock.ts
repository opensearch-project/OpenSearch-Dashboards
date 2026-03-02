/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from '../../http';

export type RouterMock = jest.Mocked<IRouter>;

function createRouter({ routerPath = '' }: { routerPath?: string } = {}): RouterMock {
  return {
    routerPath,
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    getRoutes: jest.fn(),
    handleLegacyErrors: jest.fn().mockImplementation((handler) => handler),
  };
}

export const mockRouter = {
  createRouter,
};

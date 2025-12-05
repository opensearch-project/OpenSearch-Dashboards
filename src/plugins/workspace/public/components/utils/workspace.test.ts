/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { navigateToWorkspacePageWithUseCase } from './workspace';
jest.mock('../../../../../core/public/utils');

import { coreMock } from '../../../../../core/public/mocks';

const coreStartMock = coreMock.createStart();
let mockNavigateToUrl = jest.fn();

describe('workspace utils', () => {
  beforeEach(() => {
    mockNavigateToUrl = jest.fn();
    coreStartMock.application.navigateToUrl = mockNavigateToUrl;
  });

  describe('navigateToWorkspacePageWithUseCase', () => {
    it('should redirect if newUrl is returned', () => {
      coreStartMock.application.getUrlForApp.mockImplementation(
        () => 'localhost:5601/app/workspace_list'
      );
      navigateToWorkspacePageWithUseCase(coreStartMock.application, 'Search', 'workspace_list');
      expect(mockNavigateToUrl).toHaveBeenCalledWith(
        'localhost:5601/app/workspace_list#/?useCase=Search'
      );
    });
  });
});

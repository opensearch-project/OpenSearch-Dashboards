/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { navigateToWorkspaceDetail } from './workspace';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
jest.mock('../../../../../core/public/utils');

import { coreMock } from '../../../../../core/public/mocks';

const coreStartMock = coreMock.createStart();
let mockNavigateToUrl = jest.fn();

const defaultUrl = 'localhost://';

describe('workspace utils', () => {
  beforeEach(() => {
    mockNavigateToUrl = jest.fn();
    coreStartMock.application.navigateToUrl = mockNavigateToUrl;
  });

  describe('navigateToWorkspaceDetail', () => {
    it('should redirect if newUrl is returned', () => {
      // @ts-ignore
      formatUrlWithWorkspaceId.mockImplementation(() => 'localhost:5601/w/id/app/workspace_detail');
      navigateToWorkspaceDetail(
        { application: coreStartMock.application, http: coreStartMock.http },
        'id'
      );
      expect(mockNavigateToUrl).toHaveBeenCalledWith(
        'localhost:5601/w/id/app/workspace_detail#/?tab=details'
      );
    });

    it('should redirect to collaborators if newUrl is returned and tab id is collaborators', () => {
      // @ts-ignore
      formatUrlWithWorkspaceId.mockImplementation(() => 'localhost:5601/w/id/app/workspace_detail');
      navigateToWorkspaceDetail(
        { application: coreStartMock.application, http: coreStartMock.http },
        'id',
        'collaborators'
      );
      expect(mockNavigateToUrl).toHaveBeenCalledWith(
        'localhost:5601/w/id/app/workspace_detail#/?tab=collaborators'
      );
    });

    it('should not redirect if newUrl is not returned', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: defaultUrl,
        },
        writable: true,
      });
      // @ts-ignore
      formatUrlWithWorkspaceId.mockImplementation(() => '');
      navigateToWorkspaceDetail(
        { application: coreStartMock.application, http: coreStartMock.http },
        ''
      );
      expect(mockNavigateToUrl).not.toBeCalled();
    });
  });
});

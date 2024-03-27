/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { switchWorkspace, navigateToWorkspaceUpdatePage } from './workspace';
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

  describe('switchWorkspace', () => {
    it('should redirect if newUrl is returned', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: defaultUrl,
        },
        writable: true,
      });
      // @ts-ignore
      formatUrlWithWorkspaceId.mockImplementation(() => 'new_url');
      switchWorkspace({ application: coreStartMock.application, http: coreStartMock.http }, '');
      expect(mockNavigateToUrl).toHaveBeenCalledWith('new_url');
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
      switchWorkspace({ application: coreStartMock.application, http: coreStartMock.http }, '');
      expect(mockNavigateToUrl).not.toBeCalled();
    });
  });

  describe('navigateToWorkspaceUpdatePage', () => {
    it('should redirect if newUrl is returned', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: defaultUrl,
        },
        writable: true,
      });
      // @ts-ignore
      formatUrlWithWorkspaceId.mockImplementation(() => 'new_url');
      navigateToWorkspaceUpdatePage(
        { application: coreStartMock.application, http: coreStartMock.http },
        ''
      );
      expect(mockNavigateToUrl).toHaveBeenCalledWith('new_url');
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
      navigateToWorkspaceUpdatePage(
        { application: coreStartMock.application, http: coreStartMock.http },
        ''
      );
      expect(mockNavigateToUrl).not.toBeCalled();
    });
  });
});

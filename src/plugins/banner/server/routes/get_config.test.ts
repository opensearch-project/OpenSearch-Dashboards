/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { defineRoutes } from './get_config';
import { httpServerMock } from '../../../../core/server/mocks';
import { httpServiceMock } from '../../../../core/server/mocks';
import { BannerPluginSetup } from '../types';

describe('Banner routes', () => {
  let mockRouter: ReturnType<typeof httpServiceMock.createRouter>;
  let mockBannerSetup: jest.Mocked<BannerPluginSetup>;

  beforeEach(() => {
    mockRouter = httpServiceMock.createRouter();
    mockBannerSetup = {
      bannerEnabled: jest.fn().mockReturnValue(true),
      getConfig: jest.fn().mockReturnValue({
        content: 'Test Banner Content',
        color: 'primary',
        iconType: 'iInCircle',
        isVisible: true,
        useMarkdown: true,
        size: 'm',
      }),
    };
  });

  describe('GET /api/_plugins/_banner/content', () => {
    test('returns banner config', async () => {
      defineRoutes(mockRouter, mockBannerSetup);

      const [[, handler]] = mockRouter.get.mock.calls;
      const mockContext = {} as any;
      const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      const mockResponse = httpServerMock.createResponseFactory();

      await handler(mockContext, mockRequest, mockResponse);

      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: {
          content: 'Test Banner Content',
          color: 'primary',
          iconType: 'iInCircle',
          isVisible: true,
          useMarkdown: true,
          size: 'm',
        },
      });
    });
  });
});

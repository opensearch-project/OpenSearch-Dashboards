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
      // Create a mock context with the required properties
      const mockContext = {
        core: {
          uiSettings: {
            client: {
              get: jest.fn().mockImplementation((key) => {
                // Return mock values based on the requested setting
                switch (key) {
                  case 'banner:content':
                    return 'Test Banner Content';
                  case 'banner:color':
                    return 'primary';
                  case 'banner:iconType':
                    return 'iInCircle';
                  case 'banner:active':
                    return true;
                  case 'banner:useMarkdown':
                    return true;
                  case 'banner:size':
                    return 'm';
                  default:
                    return undefined;
                }
              }),
            },
          },
        },
        dataSource: {
          opensearch: {
            client: {},
          },
        },
      } as any; // Cast to any to bypass TypeScript checks for the test
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

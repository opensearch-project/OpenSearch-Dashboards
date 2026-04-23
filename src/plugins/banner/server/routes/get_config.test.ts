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
import {
  httpServerMock,
  coreMock,
  httpServiceMock,
  loggingSystemMock,
} from '../../../../core/server/mocks';
import { BannerPluginSetup } from '../types';
import { fetchExternalConfig } from './fetch_external_config';
import { validateBannerConfig } from '../validate_banner_config';

// Mock the fetchExternalConfig and validateBannerConfig functions
jest.mock('./fetch_external_config');
jest.mock('../validate_banner_config');

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
      logger: loggingSystemMock.createLogger(),
    };
  });

  describe('GET /api/_plugins/_banner/content', () => {
    beforeEach(() => {
      // Reset mocks
      (fetchExternalConfig as jest.Mock).mockReset();
      (validateBannerConfig as jest.Mock).mockReset();
    });

    test('returns banner config', async () => {
      defineRoutes(mockRouter, mockBannerSetup);

      const [[, handler]] = mockRouter.get.mock.calls;
      // Create a mock context using coreMock
      const mockCoreContext = coreMock.createRequestHandlerContext();
      // Override the uiSettings client get method
      mockCoreContext.uiSettings.client.get = jest.fn().mockImplementation((key) => {
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
      });

      // Mock the getAll method to return all banner settings
      mockCoreContext.uiSettings.client.getAll = jest.fn().mockReturnValue({
        'banner:content': 'Test Banner Content',
        'banner:color': 'primary',
        'banner:iconType': 'iInCircle',
        'banner:active': true,
        'banner:useMarkdown': true,
        'banner:size': 'm',
      });

      // Create a mock context with proper types
      const mockContext = {
        core: mockCoreContext,
        dataSource: {
          opensearch: {
            getClient: jest.fn().mockResolvedValue({}),
            legacy: {
              getClient: jest.fn().mockReturnValue({
                callAPI: jest.fn(),
              }),
            },
          },
        },
      } as any; // Still need to cast as any for the test
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

    test('validates external config when fetched successfully', async () => {
      // Mock the fetchExternalConfig to return a config
      const mockExternalConfig = {
        content: 'External Banner Content',
        color: 'warning',
        isVisible: true,
      };
      (fetchExternalConfig as jest.Mock).mockResolvedValue(mockExternalConfig);

      // Mock validateBannerConfig to return true (valid config)
      (validateBannerConfig as jest.Mock).mockReturnValue(true);

      // Set up the plugin with an external link
      mockBannerSetup.getConfig.mockReturnValue({
        content: 'Default Content',
        color: 'primary',
        isVisible: true,
        externalLink: 'http://example.com/banner-config',
      });

      defineRoutes(mockRouter, mockBannerSetup);

      const [[, handler]] = mockRouter.get.mock.calls;
      const mockCoreContext = coreMock.createRequestHandlerContext();
      mockCoreContext.uiSettings.client.getAll = jest.fn().mockReturnValue({
        'banner:content': 'Test Banner Content',
        'banner:color': 'primary',
        'banner:iconType': 'iInCircle',
        'banner:active': true,
        'banner:useMarkdown': true,
        'banner:size': 'm',
      });

      const mockContext = {
        core: mockCoreContext,
        dataSource: {
          opensearch: {
            getClient: jest.fn().mockResolvedValue({}),
            legacy: {
              getClient: jest.fn().mockReturnValue({
                callAPI: jest.fn(),
              }),
            },
          },
        },
      } as any;
      const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      const mockResponse = httpServerMock.createResponseFactory();

      await handler(mockContext, mockRequest, mockResponse);

      // Verify fetchExternalConfig was called
      expect(fetchExternalConfig).toHaveBeenCalledWith(
        'http://example.com/banner-config',
        expect.anything()
      );

      // Verify validateBannerConfig was called with the external config
      expect(validateBannerConfig).toHaveBeenCalledWith(mockExternalConfig, expect.anything());

      // Verify the response includes the external config values
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: expect.objectContaining({
          content: 'External Banner Content',
          color: 'warning',
        }),
      });
    });

    test('uses default config when external config validation fails', async () => {
      // Mock the fetchExternalConfig to return a config
      const mockExternalConfig = {
        content: 'External Banner Content',
        color: 'invalid-color', // Invalid color
        isVisible: true,
      };
      (fetchExternalConfig as jest.Mock).mockResolvedValue(mockExternalConfig);

      // Mock validateBannerConfig to return false (invalid config)
      (validateBannerConfig as jest.Mock).mockReturnValue(false);

      // Set up the plugin with an external link
      mockBannerSetup.getConfig.mockReturnValue({
        content: 'Default Content',
        color: 'primary',
        isVisible: true,
        externalLink: 'http://example.com/banner-config',
      });

      defineRoutes(mockRouter, mockBannerSetup);

      const [[, handler]] = mockRouter.get.mock.calls;
      const mockCoreContext = coreMock.createRequestHandlerContext();
      mockCoreContext.uiSettings.client.getAll = jest.fn().mockReturnValue({
        'banner:content': 'Test Banner Content',
        'banner:color': 'primary',
        'banner:iconType': 'iInCircle',
        'banner:active': true,
        'banner:useMarkdown': true,
        'banner:size': 'm',
      });

      const mockContext = {
        core: mockCoreContext,
        dataSource: {
          opensearch: {
            getClient: jest.fn().mockResolvedValue({}),
            legacy: {
              getClient: jest.fn().mockReturnValue({
                callAPI: jest.fn(),
              }),
            },
          },
        },
      } as any;
      const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      const mockResponse = httpServerMock.createResponseFactory();

      await handler(mockContext, mockRequest, mockResponse);

      // Verify fetchExternalConfig was called
      expect(fetchExternalConfig).toHaveBeenCalledWith(
        'http://example.com/banner-config',
        expect.anything()
      );

      // Verify validateBannerConfig was called with the external config
      expect(validateBannerConfig).toHaveBeenCalledWith(mockExternalConfig, expect.anything());

      // Verify the response uses the default config values
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: expect.objectContaining({
          content: 'Test Banner Content',
          color: 'primary',
        }),
      });

      // Verify error was logged
      expect(mockBannerSetup.logger.error).toHaveBeenCalled();
    });

    test('uses default config when fetchExternalConfig returns null', async () => {
      // Mock fetchExternalConfig to return null (e.g., due to network error)
      (fetchExternalConfig as jest.Mock).mockResolvedValue(null);

      // Set up the plugin with an external link
      mockBannerSetup.getConfig.mockReturnValue({
        content: 'Default Content',
        color: 'primary',
        isVisible: true,
        externalLink: 'http://example.com/banner-config',
      });

      defineRoutes(mockRouter, mockBannerSetup);

      const [[, handler]] = mockRouter.get.mock.calls;
      const mockCoreContext = coreMock.createRequestHandlerContext();
      mockCoreContext.uiSettings.client.getAll = jest.fn().mockReturnValue({
        'banner:content': 'Test Banner Content',
        'banner:color': 'primary',
        'banner:iconType': 'iInCircle',
        'banner:active': true,
        'banner:useMarkdown': true,
        'banner:size': 'm',
      });

      const mockContext = {
        core: mockCoreContext,
        dataSource: {
          opensearch: {
            getClient: jest.fn().mockResolvedValue({}),
            legacy: {
              getClient: jest.fn().mockReturnValue({
                callAPI: jest.fn(),
              }),
            },
          },
        },
      } as any;
      const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      const mockResponse = httpServerMock.createResponseFactory();

      await handler(mockContext, mockRequest, mockResponse);

      // Verify fetchExternalConfig was called
      expect(fetchExternalConfig).toHaveBeenCalledWith(
        'http://example.com/banner-config',
        expect.anything()
      );

      // Verify the response uses the default config values
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: expect.objectContaining({
          content: 'Test Banner Content',
          color: 'primary',
        }),
      });

      // Verify warning was logged
      expect(mockBannerSetup.logger.warn).toHaveBeenCalled();
    });

    test('handles error thrown during fetch process', async () => {
      // Mock fetchExternalConfig to throw an error
      const mockError = new Error('Network error');
      (fetchExternalConfig as jest.Mock).mockRejectedValue(mockError);

      // Set up the plugin with an external link
      mockBannerSetup.getConfig.mockReturnValue({
        content: 'Default Content',
        color: 'primary',
        isVisible: true,
        externalLink: 'http://example.com/banner-config',
      });

      defineRoutes(mockRouter, mockBannerSetup);

      const [[, handler]] = mockRouter.get.mock.calls;
      const mockCoreContext = coreMock.createRequestHandlerContext();
      mockCoreContext.uiSettings.client.getAll = jest.fn().mockReturnValue({
        'banner:content': 'Test Banner Content',
        'banner:color': 'primary',
        'banner:iconType': 'iInCircle',
        'banner:active': true,
        'banner:useMarkdown': true,
        'banner:size': 'm',
      });

      const mockContext = {
        core: mockCoreContext,
        dataSource: {
          opensearch: {
            getClient: jest.fn().mockResolvedValue({}),
            legacy: {
              getClient: jest.fn().mockReturnValue({
                callAPI: jest.fn(),
              }),
            },
          },
        },
      } as any;
      const mockRequest = httpServerMock.createOpenSearchDashboardsRequest();
      const mockResponse = httpServerMock.createResponseFactory();

      await handler(mockContext, mockRequest, mockResponse);

      // Verify fetchExternalConfig was called
      expect(fetchExternalConfig).toHaveBeenCalledWith(
        'http://example.com/banner-config',
        expect.anything()
      );

      // Verify the response uses the default config values
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: expect.objectContaining({
          content: 'Test Banner Content',
          color: 'primary',
        }),
      });

      // Verify error was logged
      expect(mockBannerSetup.logger.error).toHaveBeenCalledWith(
        `Error loading banner config from external URL: ${mockError}`
      );
    });
  });
});

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

import { validateBannerConfig } from './validate_banner_config';
import { loggingSystemMock } from '../../../core/server/mocks';

describe('validateBannerConfig', () => {
  // Create mock logger
  let mockLogger: ReturnType<typeof loggingSystemMock.createLogger>;

  beforeEach(() => {
    mockLogger = loggingSystemMock.createLogger();
    jest.clearAllMocks();
  });

  test('returns true for valid config with all fields', () => {
    const validConfig = {
      content: 'Test Banner Content',
      color: 'primary',
      iconType: 'iInCircle',
      isVisible: true,
      useMarkdown: true,
      size: 'm',
      externalLink: 'https://example.com/banner-config',
    };

    const result = validateBannerConfig(validConfig, mockLogger);

    expect(result).toBe(true);
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test('returns true for valid config with minimal fields', () => {
    const validConfig = {
      content: 'Test Banner Content',
    };

    const result = validateBannerConfig(validConfig, mockLogger);

    expect(result).toBe(true);
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test('returns false for config with unexpected fields', () => {
    const invalidConfig = {
      content: 'Test Banner Content',
      color: 'primary',
      unknownField: 'some value', // Unexpected field
    };

    const result = validateBannerConfig(invalidConfig, mockLogger);

    expect(result).toBe(false);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('unexpected fields found: unknownField')
    );
  });

  test('returns false for config with invalid content type', () => {
    const invalidConfig = {
      content: 123, // Should be a string
      color: 'primary',
    };

    const result = validateBannerConfig(invalidConfig, mockLogger);

    expect(result).toBe(false);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("'content' must be a string")
    );
  });

  test('returns false for config with invalid color value', () => {
    const invalidConfig = {
      content: 'Test Banner Content',
      color: 'invalid-color', // Not one of the allowed values
    };

    const result = validateBannerConfig(invalidConfig, mockLogger);

    expect(result).toBe(false);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("'color' must be one of primary, success, warning")
    );
  });

  test('returns false for config with invalid iconType type', () => {
    const invalidConfig = {
      content: 'Test Banner Content',
      iconType: 123, // Should be a string
    };

    const result = validateBannerConfig(invalidConfig, mockLogger);

    expect(result).toBe(false);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("'iconType' must be a string")
    );
  });

  test('returns false for config with invalid isVisible type', () => {
    const invalidConfig = {
      content: 'Test Banner Content',
      isVisible: 'true', // Should be a boolean
    };

    const result = validateBannerConfig(invalidConfig, mockLogger);

    expect(result).toBe(false);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("'isVisible' must be a boolean")
    );
  });

  test('returns false for config with invalid useMarkdown type', () => {
    const invalidConfig = {
      content: 'Test Banner Content',
      useMarkdown: 'true', // Should be a boolean
    };

    const result = validateBannerConfig(invalidConfig, mockLogger);

    expect(result).toBe(false);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("'useMarkdown' must be a boolean")
    );
  });

  test('returns false for config with invalid size value', () => {
    const invalidConfig = {
      content: 'Test Banner Content',
      size: 'xl', // Not one of the allowed values
    };

    const result = validateBannerConfig(invalidConfig, mockLogger);

    expect(result).toBe(false);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("'size' must be one of s, m")
    );
  });

  describe('externalLink validation', () => {
    test('returns true for config with valid HTTP URL', () => {
      const validConfig = {
        content: 'Test Banner Content',
        externalLink: 'http://example.com/banner-config',
      };

      const result = validateBannerConfig(validConfig, mockLogger);

      expect(result).toBe(true);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    test('returns true for config with valid HTTPS URL', () => {
      const validConfig = {
        content: 'Test Banner Content',
        externalLink: 'https://example.com/banner-config',
      };

      const result = validateBannerConfig(validConfig, mockLogger);

      expect(result).toBe(true);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    test('returns true for config with valid URL with query parameters', () => {
      const validConfig = {
        content: 'Test Banner Content',
        externalLink: 'https://example.com/banner-config?param=value&another=123',
      };

      const result = validateBannerConfig(validConfig, mockLogger);

      expect(result).toBe(true);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    test('returns false for config with invalid externalLink type', () => {
      const invalidConfig = {
        content: 'Test Banner Content',
        externalLink: 123, // Should be a string
      };

      const result = validateBannerConfig(invalidConfig, mockLogger);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("'externalLink' must be a string")
      );
    });

    test('returns false for config with invalid URL format', () => {
      const invalidConfig = {
        content: 'Test Banner Content',
        externalLink: 'not-a-valid-url',
      };

      const result = validateBannerConfig(invalidConfig, mockLogger);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("'externalLink' must be a valid URI")
      );
    });

    test('returns false for config with unsupported protocol', () => {
      const invalidConfig = {
        content: 'Test Banner Content',
        externalLink: 'ftp://example.com/banner-config',
      };

      // This should still be considered valid by the URL constructor
      const result = validateBannerConfig(invalidConfig, mockLogger);

      expect(result).toBe(true);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  test('returns false when multiple validation errors are present', () => {
    const invalidConfig = {
      content: 123, // Should be a string
      color: 'invalid-color', // Not one of the allowed values
      externalLink: 'not-a-valid-url', // Invalid URL
    };

    const result = validateBannerConfig(invalidConfig, mockLogger);

    expect(result).toBe(false);
    expect(mockLogger.error).toHaveBeenCalledTimes(3);
  });
});

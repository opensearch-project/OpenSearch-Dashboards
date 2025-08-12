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

/**
 * DOM element ID for the banner container
 */
export const BANNER_CONTAINER_ID = 'pluginGlobalBanner';

/**
 * Height of the banner when hidden (in pixels)
 */
export const HIDDEN_BANNER_HEIGHT = '0px';

/**
 * Default banner configuration values
 */
export const DEFAULT_BANNER_CONFIG = {
  content: 'Banner Content',
  color: 'primary' as const,
  iconType: 'iInCircle',
  isVisible: true,
  useMarkdown: true,
  size: 'm' as const,
};

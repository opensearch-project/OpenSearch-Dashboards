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
 * Helper function to validate if a string is a valid URI
 * @param uri The string to validate as URI
 * @returns Whether the string is a valid URI
 */
const isValidUri = (uri: string): boolean => {
  try {
    new URL(uri);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Validates that the banner configuration meets the required schema
 * @param config The banner configuration to validate
 * @param logger Logger instance for logging errors
 * @returns Whether the configuration is valid
 */
export function validateBannerConfig(
  config: any,
  logger: { error: (message: string) => void }
): boolean {
  let isValid = true;

  // Check for unexpected fields
  const validFields = [
    'content',
    'color',
    'iconType',
    'isVisible',
    'useMarkdown',
    'size',
    'externalLink',
  ];

  const configKeys = Object.keys(config);
  const invalidFields = configKeys.filter((key) => !validFields.includes(key));

  if (invalidFields.length > 0) {
    logger.error(`Invalid banner config: unexpected fields found: ${invalidFields.join(', ')}`);
    isValid = false;
  }

  // Check content
  if (config.content !== undefined && typeof config.content !== 'string') {
    logger.error(`Invalid banner config: 'content' must be a string, got ${typeof config.content}`);
    isValid = false;
  }

  // Check color
  if (config.color !== undefined) {
    const validColors = ['primary', 'success', 'warning'];
    if (!validColors.includes(config.color)) {
      logger.error(
        `Invalid banner config: 'color' must be one of ${validColors.join(', ')}, got '${
          config.color
        }'`
      );
      isValid = false;
    }
  }

  // Check iconType
  if (config.iconType !== undefined && typeof config.iconType !== 'string') {
    logger.error(
      `Invalid banner config: 'iconType' must be a string, got ${typeof config.iconType}`
    );
    isValid = false;
  }

  // Check isVisible
  if (config.isVisible !== undefined && typeof config.isVisible !== 'boolean') {
    logger.error(
      `Invalid banner config: 'isVisible' must be a boolean, got ${typeof config.isVisible}`
    );
    isValid = false;
  }

  // Check useMarkdown
  if (config.useMarkdown !== undefined && typeof config.useMarkdown !== 'boolean') {
    logger.error(
      `Invalid banner config: 'useMarkdown' must be a boolean, got ${typeof config.useMarkdown}`
    );
    isValid = false;
  }

  // Check size
  if (config.size !== undefined) {
    const validSizes = ['s', 'm'];
    if (!validSizes.includes(config.size)) {
      logger.error(
        `Invalid banner config: 'size' must be one of ${validSizes.join(', ')}, got '${
          config.size
        }'`
      );
      isValid = false;
    }
  }

  // Check externalLink
  if (config.externalLink !== undefined) {
    if (typeof config.externalLink !== 'string') {
      logger.error(
        `Invalid banner config: 'externalLink' must be a string, got ${typeof config.externalLink}`
      );
      isValid = false;
    } else if (!isValidUri(config.externalLink)) {
      logger.error(
        `Invalid banner config: 'externalLink' must be a valid URI, got '${config.externalLink}'`
      );
      isValid = false;
    }
  }

  return isValid;
}

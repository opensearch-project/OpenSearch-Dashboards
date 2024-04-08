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

import stylelint from 'stylelint';

const { validateOptions } = stylelint.utils;

/**
 * Validates options for a Stylelint rule.
 *
 * @param postcssResult - The PostCSS result object.
 * @param ruleName - The name of the Stylelint rule.
 * @param primaryOption - The primary option for the rule.
 * @returns {boolean} - A boolean indicating whether the options are valid.
 */
export const isValidOptions = (
  postcssResult: any,
  ruleName: string,
  primaryOption: Record<string, any>
) => {
  return validateOptions(postcssResult, ruleName, {
    actual: primaryOption,
    possible: {
      config: [(input) => typeof input === 'string'],
    },
  });
};

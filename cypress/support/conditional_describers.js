/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Helper function to describe conditional test suites, based on features enabled in OSD
 *
 * @param {string[] | string} featureNames - The name or array of names of features to check.
 *        MUST be in SCREAMING_SNAKE_CASE (e.g., 'FEATURE_NAME').
 *
 * @description
 * This function determines whether to run a test suite based on the status of specified features:
 *
 * - If a single string is provided, it checks for that specific feature.
 * - If an array is provided, it checks all features in the array (using AND logic).
 * - Prefix a feature name with "!" to negate the condition (i.e., run if the feature is not enabled).
 * - To achieve OR logic, negate the conditions using "!" and use "not()".
 *
 * @example
 * // Run suite if 'featureA' is enabled
 * ifEnabled('FEATURE_A').describe('With A...', () => { ... });
 *
 * // Run suite if 'featureB' is NOT enabled
 * ifEnabled('!FEATURE_B').describe('Without B...', () => { ... });
 * ifEnabled('FEATURE_B').not('Without B...', () => { ... });
 * ifEnabled('FEATURE_B').describe('Without B...', () => { ... }, { not: true });
 *
 * // Run suite if both 'featureC' and 'featureD' are enabled: G && H
 * ifEnabled(['FEATURE_C', 'FEATURE_D']).describe('With C and D...', () => { ... });
 *
 * // Run suite if either one of 'featureE' or 'featureF' is enabled: G || H
 * ifEnabled(['!FEATURE_E', '!FEATURE_F']).not('With E or F...', () => { ... });
 * ifEnabled(['!FEATURE_E', '!FEATURE_F']).describe('With E or F...', () => { ... }, { not: true });
 *
 * // Run suite if either 'featureG' or 'featureH' is NOT enabled: !G || !H
 * ifEnabled(['FEATURE_G', 'FEATURE_H']).not('Without G or without H...', () => { ... });
 * ifEnabled(['FEATURE_G', 'FEATURE_H']).describe('Without G or without H...', () => { ... }, { not: true });
 *
 * // Run suite if 'featureJ' is enabled but 'featureK' is NOT enabled: J && !K
 * ifEnabled(['FEATURE_J', '!FEATURE_K']).describe('With J but without K...', () => { ... });
 *
 * @returns {Mocha.SuiteFunction & { describe: Mocha.SuiteFunction, not: Mocha.SuiteFunction & { describe: Mocha.SuiteFunction }}}
 */

const ifEnabled = (featureNames) => {
  /**
   * Describes a "suite" that should be executed if the feature is enabled.
   * @type {Mocha.SuiteFunction & { not: Mocha.SuiteFunction & {describe: Mocha.SuiteFunction}}}
   */
  const describer = (name, config, fn, options) => {
    let _config = config || {};
    let _fn = fn;
    let _options = options || {};

    if (typeof config === 'function') {
      _config = {};
      _fn = config;
      _options = fn || {};
    }

    const { skip = false, only = false, condition = true, not = false } = _options;

    let shouldSkip = skip || !condition;
    if (!shouldSkip) {
      const allConditionsPass = (Array.isArray(featureNames)
        ? featureNames
        : [featureNames]
      ).every((name) =>
        name[0] === '!'
          ? !Cypress.env(`${name.substring(1)}_ENABLED`)
          : Cypress.env(`${name}_ENABLED`)
      );

      // If all conditions pass, we should NOT skip, unless the condition is negated by passing in "not" as true
      shouldSkip = not ? allConditionsPass : !allConditionsPass;
    }

    if (shouldSkip) {
      describe.skip(name, _config, _fn);
    } else if (only) {
      // eslint-disable-next-line mocha/no-exclusive-tests
      describe.only(name, _config, _fn);
    } else {
      describe(name, _config, _fn);
    }
  };

  /**
   * Describes a "suite" that should be executed if the feature is disabled.
   * @type {Mocha.SuiteFunction & {describe: Mocha.SuiteFunction}}
   */
  describer.not = (name, config, fn, options = {}) => {
    let _config = config || {};
    let _fn = fn;
    let _options = options || {};

    if (typeof config === 'function') {
      _config = {};
      _fn = config;
      _options = fn || {};
    }

    describer(name, _config, _fn, { ..._options, not: true });
  };

  /**
   * Describes a "suite" that should not be executed.
   * @type {Mocha.PendingSuiteFunction}
   */
  describer.skip = describer.not.skip = (name, config, fn) => {
    let _config = config || {};
    let _fn = fn;

    if (typeof config === 'function') {
      _config = {};
      _fn = config;
    }

    describer(name, _config, _fn, { skip: true });
  };

  /**
   * Describes a "suite" that should be executed exclusively and only if the feature is enabled.
   * @type {Mocha.ExclusiveSuiteFunction}
   */
  describer.only = (name, config, fn) => {
    let _config = config || {};
    let _fn = fn;

    if (typeof config === 'function') {
      _config = {};
      _fn = config;
    }

    describer(name, _config, _fn, { only: true });
  };

  /**
   * Describes a "suite" that should be executed exclusively and only if the feature is disabled.
   * @type {Mocha.ExclusiveSuiteFunction}
   */
  describer.not.only = (name, config, fn) => {
    let _config = config || {};
    let _fn = fn;

    if (typeof config === 'function') {
      _config = {};
      _fn = config;
    }

    describer(name, _config, _fn, { not: true, only: true });
  };

  // Ease-of-use aliases

  /**
   * Describes a "suite" that should be executed if the feature is enabled.
   * @type {Mocha.SuiteFunction}
   */
  describer.describe = describer;

  /**
   * Describes a "suite" that should be executed if the feature is disabled.
   * @type {Mocha.SuiteFunction}
   */
  describer.not.describe = describer.not;

  /**
   * Describes a "suite" that should not be executed.
   * @type {Mocha.PendingSuiteFunction}
   */
  describer.describe.skip = describer.not.describe.skip = describer.skip;

  /**
   * Describes a "suite" that should be executed exclusively and only if the feature is enabled.
   * @type {Mocha.ExclusiveSuiteFunction}
   */
  describer.only.describe = describer.only;

  /**
   * Describes a "suite" that should be executed exclusively and only if the feature is disabled.
   * @type {Mocha.ExclusiveSuiteFunction}
   */
  describer.not.describe.only = describer.not.only;

  return describer;
};

global.ifEnabled = ifEnabled;

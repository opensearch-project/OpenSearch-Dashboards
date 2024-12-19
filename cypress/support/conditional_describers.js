/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Helper function to describe conditional test suites, based on features enabled in OSD
 *
 * @param {string} featureName - The name of feature to be checked.
 * Based on the status of the feature, the suite will be described.
 *
 * @returns {Mocha.SuiteFunction & { describe: Mocha.SuiteFunction, not: Mocha.SuiteFunction & { describe: Mocha.SuiteFunction }}}
 */

const ifEnabled = (featureName) => {
  /**
   * Describes a "suite" that should be executed if the feature is enabled.
   * @type {Mocha.SuiteFunction & { not: Mocha.SuiteFunction & {describe: Mocha.SuiteFunction}}}
   */
  const describer = (name, fn, options = {}) => {
    const { skip = false, only = false, condition = true, not = false } = options;

    if (
      skip ||
      !condition ||
      (!not && !Cypress.env(`${featureName}_ENABLED`)) ||
      (not && Cypress.env(`${featureName}_ENABLED`))
    ) {
      describe.skip(name, fn);
    } else if (only) {
      // eslint-disable-next-line mocha/no-exclusive-tests
      describe.only(name, fn);
    } else {
      describe(name, fn);
    }
  };

  /**
   * Describes a "suite" that should be executed if the feature is disabled.
   * @type {Mocha.SuiteFunction & {describe: Mocha.SuiteFunction}}
   */
  describer.not = (name, fn, options = {}) => {
    describer(name, fn, { ...options, not: true });
  };

  /**
   * Describes a "suite" that should not be executed.
   * @type {Mocha.PendingSuiteFunction}
   */
  describer.skip = describer.not.skip = (name, fn) => {
    describer(name, fn, { skip: true });
  };

  /**
   * Describes a "suite" that should be executed exclusively and only if the feature is enabled.
   * @type {Mocha.ExclusiveSuiteFunction}
   */
  describer.only = (name, fn) => {
    describer(name, fn, { only: true });
  };

  /**
   * Describes a "suite" that should be executed exclusively and only if the feature is disabled.
   * @type {Mocha.ExclusiveSuiteFunction}
   */
  describer.not.only = (name, fn) => {
    describer(name, fn, { not: true, only: true });
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

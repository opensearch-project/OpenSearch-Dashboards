/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Callback for prepareTestSuite
 * @callback PrepareTestSuiteCallback
 * @returns {void}
 */

const loginMethods = [
  {
    name: 'IAM Auth Session',
    method: 'iamAuthLogin',
  },
];

/**
 Sets up the test suite depending on the codebase
 * @param {string} testSuiteName - name of test suite
 * @param {PrepareTestSuiteCallback} runTestSuiteCallback - function that run's the test suite's tests
 */
export const prepareTestSuite = (testSuiteName, runTestSuiteCallback) => {
  if (Cypress.env('CYPRESS_RUNTIME_ENV') === 'osd') {
    runTestSuiteCallback();
  } else {
    loginMethods.forEach(({ name, method }) => {
      describe(`${testSuiteName} Test with ${name}`, () => {
        before(() => {
          cy.session(name, () => {
            cy.task('getNewAwsCredentials').then((awsCredentials) => {
              Cypress.env('AWS_CREDENTIALS', awsCredentials);
            });
            cy[method]();
          });
        });

        runTestSuiteCallback();
      });
    });
  }
};

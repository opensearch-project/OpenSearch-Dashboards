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

/**
 * Creates a workspace with a datasource
 * @param {string} datasourceName - The name of the datasource to get ID for
 * @param {string} workspaceName - The name of the workspace to create
 * @param {string[]} features - Array of features to enable (e.g., ['use-case-observability'])
 * @param {string} aliasName - The alias name for storing the workspace ID
 */
export const createWorkspaceWithDatasource = (
  datasourceName,
  workspaceName,
  features = ['use-case-observability'],
  aliasName = `${workspaceName}:WORKSPACE_ID`
) => {
  cy.osd.getDataSourceId(datasourceName);

  cy.get('@DATASOURCE_ID').then((datasourceId) => {
    cy.osd.createWorkspaceWithDataSourceId(datasourceId, workspaceName, features, aliasName);
    cy.wait(2000);
  });
};

/**
 * Creates a dataset with enhanced configuration including fields support
 * @param {string} datasourceName - The name of the datasource to get ID for
 * @param {string} workspaceName - The name of the workspace (used to get workspace ID from alias)
 * @param {string} datasetId - The ID for the dataset to create
 * @param {Object} datasetConfig - The dataset configuration object
 * @param {string} datasetConfig.title - The index pattern title (e.g., 'data_logs_small_time_1*')
 * @param {string} datasetConfig.signalType - The signal type (e.g., 'logs')
 * @param {string} [datasetConfig.timestamp] - The timestamp field name (optional for non-time-based datasets)
 * @param {Array} [datasetConfig.fields] - Array of field configurations for the dataset (optional)
 * @param {string} datasetAliasName - The alias name for storing the dataset ID
 */
export const createDatasetWithEndpoint = (
  datasourceName,
  workspaceName,
  datasetId,
  datasetConfig,
  datasetAliasName = `${datasetId}:DATASET_ID`
) => {
  cy.osd.getDataSourceId(datasourceName);

  cy.get('@DATASOURCE_ID').then((datasourceId) => {
    cy.get(`@${workspaceName}:WORKSPACE_ID`).then((workspaceId) => {
      cy.osd.createDatasetByEndpoint(
        datasetId,
        workspaceId,
        datasourceId,
        datasetConfig,
        datasetAliasName
      );
    });
  });
};

/**
 * Creates a workspace with datasource and dataset with index pattern in one operation
 * @param {string} datasourceName - The name of the datasource to get ID for
 * @param {string} workspaceName - The name of the workspace to create
 * @param {string} datasetId - The ID for the dataset to create
 * @param {string} indexPattern - The index pattern (e.g., 'data_logs_small_time_1*')
 * @param {string} timestampField - The timestamp field name (default: 'timestamp')
 * @param {string} signalType - The signal type (default: 'logs')
 * @param {string[]} features - Array of features to enable (default: ['use-case-observability'])
 * @param {string} workspaceAliasName - The alias name for storing the workspace ID
 * @param {string} datasetAliasName - The alias name for storing the dataset ID
 */
export const createWorkspaceAndDatasetUsingEndpoint = (
  datasourceName,
  workspaceName,
  datasetId,
  indexPattern,
  timestampField = 'timestamp',
  signalType = 'logs',
  features = ['use-case-observability'],
  workspaceAliasName = `${workspaceName}:WORKSPACE_ID`,
  datasetAliasName = `${datasetId}:DATASET_ID`
) => {
  cy.osd.getDataSourceId(datasourceName);

  cy.get('@DATASOURCE_ID').then((datasourceId) => {
    cy.osd.createWorkspaceWithDataSourceId(
      datasourceId,
      workspaceName,
      features,
      workspaceAliasName
    );
    cy.wait(2000);
    cy.get(`@${workspaceAliasName}`).then((workspaceId) => {
      cy.osd.createDatasetByEndpoint(
        datasetId,
        workspaceId,
        datasourceId,
        {
          title: indexPattern,
          signalType: signalType,
          timestamp: timestampField,
        },
        datasetAliasName
      );
    });
  });
};

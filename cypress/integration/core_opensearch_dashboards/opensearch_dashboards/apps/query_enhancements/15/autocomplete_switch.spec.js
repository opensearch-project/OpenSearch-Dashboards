/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  QueryLanguages,
} from '../../../../../../utils/constants';

import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/query_enhancements/shared';

import {
  generateAutocompleteTestConfiguration,
  generateAutocompleteTestConfigurations,
  LanguageConfigs,
  getDatasetName,
} from '../../../../../../utils/apps/query_enhancements/autocomplete';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
  createDatasetWithEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId1 = getRandomizedDatasetId();
const datasetId2 = getRandomizedDatasetId();

export const runAutocompleteTests = () => {
  describe('discover autocomplete tests', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId1,
        `${INDEX_WITH_TIME_1}*`,
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-search'] // features
      );

      createDatasetWithEndpoint(DATASOURCE_NAME, workspaceName, datasetId2, {
        title: `${INDEX_WITH_TIME_2}*`,
        signalType: 'logs',
        timestamp: 'timestamp',
      });
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'discover',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITH_TIME_2,
      ]);
    });

    generateAutocompleteTestConfigurations(generateAutocompleteTestConfiguration, {
      languageConfig: LanguageConfigs.SQL_PPL,
    }).forEach((config) => {
      describe(`${config.testName}`, () => {
        it('should update default query when switching index patterns and languages', () => {
          // Setup
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);

          // Get dataset names based on type
          const firstDataset = getDatasetName('data_logs_small_time_1', config.datasetType);
          const secondDataset = getDatasetName('data_logs_small_time_2', config.datasetType);

          // Verify initial default query
          cy.getElementByTestId('osdQueryEditor__multiLine').contains(firstDataset);

          // Switch to second index pattern
          cy.setDataset(secondDataset, DATASOURCE_NAME, config.datasetType);

          // Verify query updated for new index pattern
          cy.getElementByTestId('osdQueryEditor__multiLine').contains(secondDataset);

          // Switch language and verify index pattern maintained
          const switchLanguage =
            config.language === QueryLanguages.SQL.name
              ? QueryLanguages.PPL.name
              : QueryLanguages.SQL.name;
          cy.setQueryLanguage(switchLanguage);
          cy.getElementByTestId('osdQueryEditor__multiLine').contains(secondDataset);
        });
      });
    });
  });
};

prepareTestSuite('Autocomplete Switch', runAutocompleteTests);

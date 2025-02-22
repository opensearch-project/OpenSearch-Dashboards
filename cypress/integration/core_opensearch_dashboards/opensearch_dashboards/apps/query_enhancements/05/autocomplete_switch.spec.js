/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  QueryLanguages,
  PATHS,
  DATASOURCE_NAME,
  DatasetTypes,
} from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  getDefaultQuery,
} from '../../../../../../utils/apps/query_enhancements/shared';
import {
  generateAutocompleteTestConfiguration,
  generateAutocompleteTestConfigurations,
  LanguageConfigs,
  getDatasetName,
} from '../../../../../../utils/apps/query_enhancements/autocomplete';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

export const runAutocompleteTests = () => {
  describe('discover autocomplete tests', () => {
    beforeEach(() => {
      cy.osd.setupTestData(
        PATHS.SECONDARY_ENGINE,
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_2}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_2}.data.ndjson`,
        ]
      );
      cy.osd.addDataSource({
        name: DATASOURCE_NAME,
        url: PATHS.SECONDARY_ENGINE,
        authType: 'no_auth',
      });
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteAllOldWorkspaces();
      cy.visit('/app/home');
      cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspaceName);
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
      cy.osd.deleteIndex(INDEX_WITH_TIME_1);
      cy.osd.deleteIndex(INDEX_WITH_TIME_2);
    });

    generateAutocompleteTestConfigurations(generateAutocompleteTestConfiguration, {
      languageConfig: LanguageConfigs.SQL_PPL,
    }).forEach((config) => {
      describe(`${config.testName}`, () => {
        beforeEach(() => {
          if (config.datasetType === DatasetTypes.INDEX_PATTERN.name) {
            cy.createWorkspaceIndexPatterns({
              workspaceName: workspaceName,
              indexPattern: INDEX_WITH_TIME_1,
              timefieldName: 'timestamp',
              dataSource: DATASOURCE_NAME,
              isEnhancement: true,
            });
            cy.createWorkspaceIndexPatterns({
              workspaceName: workspaceName,
              indexPattern: INDEX_WITH_TIME_2,
              timefieldName: 'timestamp',
              dataSource: DATASOURCE_NAME,
              isEnhancement: true,
            });
          }
          cy.osd.navigateToWorkSpaceSpecificPage({
            workspaceName: workspaceName,
            page: 'discover',
            isEnhancement: true,
          });
        });

        it('should update default query when switching index patterns and languages', () => {
          // Setup
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);

          // Get dataset names based on type
          const firstDataset = getDatasetName('data_logs_small_time_1', config.datasetType);
          const secondDataset = getDatasetName('data_logs_small_time_2', config.datasetType);

          // Verify initial default query
          cy.getElementByTestId('osdQueryEditor__multiLine').contains(
            getDefaultQuery(firstDataset, config.language)
          );

          // Switch to second index pattern
          cy.setDataset(secondDataset, DATASOURCE_NAME, config.datasetType);

          // Verify query updated for new index pattern
          cy.getElementByTestId('osdQueryEditor__multiLine').contains(
            getDefaultQuery(secondDataset, config.language)
          );

          // Switch language and verify index pattern maintained
          const switchLanguage =
            config.language === QueryLanguages.SQL.name
              ? QueryLanguages.PPL.name
              : QueryLanguages.SQL.name;
          cy.setQueryLanguage(switchLanguage);
          cy.getElementByTestId('osdQueryEditor__multiLine').contains(
            getDefaultQuery(secondDataset, switchLanguage)
          );
        });
      });
    });
  });
};

prepareTestSuite('Autocomplete Switch', runAutocompleteTests);

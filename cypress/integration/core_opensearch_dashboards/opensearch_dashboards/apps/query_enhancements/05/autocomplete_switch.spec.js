/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  QueryLanguages,
  DATASOURCE_NAME,
} from '../../../../../../utils/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/query_enhancements/shared';
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
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITH_TIME_2,
      ]);
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

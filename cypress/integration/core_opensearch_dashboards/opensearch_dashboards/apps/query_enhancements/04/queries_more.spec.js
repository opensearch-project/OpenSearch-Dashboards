/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_WITH_TIME_1,
  INDEX_WITHOUT_TIME_1,
  PATHS,
  DATASOURCE_NAME,
  DatasetTypes,
} from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
  generateBaseConfiguration,
} from '../../../../../../utils/apps/query_enhancements/shared';
import { getDatasetName } from '../../../../../../utils/apps/query_enhancements/autocomplete';
import {
  generateQueryTestConfigurations,
  LanguageConfigs,
} from '../../../../../../utils/apps/query_enhancements/queries';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { getDocTableField } from '../../../../../../utils/apps/query_enhancements/doc_table';

const workspaceName = getRandomizedWorkspaceName();

export const runQueryTests = () => {
  describe('discover autocomplete tests', () => {
    beforeEach(() => {
      cy.osd.setupTestData(
        PATHS.SECONDARY_ENGINE,
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITHOUT_TIME_1}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITHOUT_TIME_1}.data.ndjson`,
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
      cy.osd.deleteIndex(INDEX_WITHOUT_TIME_1);
    });

    generateQueryTestConfigurations(generateBaseConfiguration, {
      languageConfig: LanguageConfigs.DQL_Lucene,
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
              indexPattern: INDEX_WITHOUT_TIME_1,
              timefieldName: '',
              dataSource: DATASOURCE_NAME,
              isEnhancement: true,
              indexPatternHasTimefield: false,
            });
          }
          cy.osd.navigateToWorkSpaceSpecificPage({
            workspaceName: workspaceName,
            page: 'discover',
            isEnhancement: true,
          });
        });

        it('should highlight filter and query field', () => {
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);
          setDatePickerDatesAndSearchIfRelevant(config.language);
          const query = `unique_category:Caching`;
          cy.setQueryEditor(query);
          cy.submitFilterFromDropDown('category', 'is', 'Database', true);
          getDocTableField(1, 0).within(() => {
            // Get all marks and verify their texts
            cy.get('mark').should(($marks) => {
              const texts = $marks.map((_, el) => el.textContent).get();
              expect(texts).to.include('Database');
              expect(texts).to.include('Caching');
            });
          });
          cy.verifyHitCount(500);

          // Get dataset names based on type
          const noTime = getDatasetName(INDEX_WITHOUT_TIME_1, config.datasetType);
          cy.setDataset(noTime, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);
          cy.setQueryEditor(query);
          cy.submitFilterFromDropDown('category', 'is', 'Database', true);
          getDocTableField(0, 0).within(() => {
            // Get all marks and verify their texts
            cy.get('mark').should(($marks) => {
              const texts = $marks.map((_, el) => el.textContent).get();
              expect(texts).to.include('Database');
              expect(texts).to.include('Caching');
            });
          });
          cy.verifyHitCount(500);
        });
      });
    });
  });
};

prepareTestSuite('Queries More', runQueryTests);

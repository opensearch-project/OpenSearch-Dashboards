/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  INDEX_WITHOUT_TIME_1,
  nonTimeBasedFieldsForDatasetCreation,
} from '../../../../../../utils/constants';

import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
  generateBaseConfiguration,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/query_enhancements/shared';

import { getDatasetName } from '../../../../../../utils/apps/query_enhancements/autocomplete';
import {
  generateQueryTestConfigurations,
  LanguageConfigs,
} from '../../../../../../utils/apps/query_enhancements/queries';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
  createDatasetWithEndpoint,
} from '../../../../../../utils/helpers';
import { getDocTableField } from '../../../../../../utils/apps/query_enhancements/doc_table';

const workspaceName = getRandomizedWorkspaceName();
const datasetId1 = getRandomizedDatasetId();
const datasetId2 = getRandomizedDatasetId();

export const runQueryTests = () => {
  describe('discover Queries tests', () => {
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
        title: `${INDEX_WITHOUT_TIME_1}*`,
        signalType: 'logs',
        fields: nonTimeBasedFieldsForDatasetCreation,
      });
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'data-explorer/discover',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITHOUT_TIME_1,
      ]);
    });

    generateQueryTestConfigurations(generateBaseConfiguration, {
      languageConfig: LanguageConfigs.DQL_Lucene,
    }).forEach((config) => {
      describe(`${config.testName}`, () => {
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

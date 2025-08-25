/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
} from '../../../../../../utils/constants';
import {
  generateAllTestConfigurations,
  generateBaseConfiguration,
  getRandomizedWorkspaceName,
  setDatePickerDatesIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { DatasetTypes } from '../../../../../../utils/apps/explore/constants';

const workspaceName = getRandomizedWorkspaceName();

const runAiEditorTests = () => {
  const generatedQuery = 'source=data_logs_small_time_* | where bytes_transferred > 9000';

  describe('AI Editor', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITH_TIME_2,
      ]);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITH_TIME_2,
      ]);
    });

    beforeEach(() => {
      // mock AI mode enablement
      cy.intercept('GET', '**/enhancements/assist/languages*', {
        statusCode: 200,
        body: {
          configuredLanguages: ['PPL'],
        },
      });
      // mock generated PPL
      cy.intercept('POST', '**/enhancements/assist/generate', {
        statusCode: 200,
        body: {
          query: generatedQuery,
        },
      });
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
    });

    generateAllTestConfigurations(generateBaseConfiguration).forEach((config) => {
      it(`should be able to query via AI mode for ${config.testName}`, () => {
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        setDatePickerDatesIfRelevant(config.language.name);
        cy.explore.setQueryEditor(' give me all errors');
        cy.getElementByTestId('exploreTabs').should('exist');
        cy.verifyHitCount('2,054');
        cy.getElementByTestId('exploreQueryPanelGeneratedQuery').contains(generatedQuery);

        // check to see if the "Edit query" button works
        cy.getElementByTestId('exploreQueryPanelGeneratedQueryEditButton').click();
        cy.getElementByTestId('exploreQueryPanelEditor').should('be.visible');
        cy.getElementByTestId('exploreQueryPanelEditor').should(
          'contain.text',
          'source=data_logs_small_time_*'
        );
      });

      it(`should be able to toggle between editor modes for ${config.testName}`, () => {
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        setDatePickerDatesIfRelevant(config.language.name);

        cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('PPL');

        // Test via keyboard clicks
        cy.explore.setQueryEditor(' ');
        cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('AI');
        cy.explore.setQueryEditor('{esc}');
        cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('PPL');

        // Test via toggle
        cy.getElementByTestId('queryPanelFooterLanguageToggle').click();
        cy.getElementByTestId('queryPanelFooterLanguageToggle-AI').click();
        cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('AI');
      });

      // filtering only works for indexed fields
      if (config.datasetType === DatasetTypes.INDEX_PATTERN.name) {
        it(`should be able to add a filter in AI mode for ${config.testName}`, () => {
          cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          setDatePickerDatesIfRelevant(config.language.name);
          // fire query so that we have data to add filter on
          cy.explore.updateTopNav({ log: false });
          cy.getElementByTestId('exploreTabs').should('exist');

          cy.explore.setQueryEditor(' ');
          cy.getElementByTestId('field-category-showDetails').click({ force: true });
          cy.getElementByTestId('plus-category-Network').click();
          cy.getElementByTestId('exploreQueryPanelEditor').should('contain.text', 'category');
          cy.getElementByTestId('exploreQueryPanelEditor').should('contain.text', 'is');
          cy.getElementByTestId('exploreQueryPanelEditor').should('contain.text', "'Network'");
        });
      }
    });
  });
};

prepareTestSuite('AI Editor', runAiEditorTests);

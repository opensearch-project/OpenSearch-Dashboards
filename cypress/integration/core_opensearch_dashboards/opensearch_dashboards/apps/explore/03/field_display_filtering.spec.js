/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME, INDEX_WITH_TIME_1 } from '../../../../../../utils/apps/constants';
import { generateFieldDisplayFilteringTestConfiguration } from '../../../../../../utils/apps/explore/field_display_filtering.js';
import { BASE_PATH } from '../../../../../../utils/constants';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import { verifyMonacoEditorContent } from '../../../../../../utils/apps/explore/autocomplete';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { QueryLanguages } from '../../../../../../utils/apps/explore/constants';

const workspace = getRandomizedWorkspaceName();

const fieldDisplayFilteringTestSuite = () => {
  // TODO: Rewrite field filtering tests since we've changed the feature
  describe('filter for value spec', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspace, [INDEX_WITH_TIME_1]);
      cy.explore.createWorkspaceDataSets({
        workspaceName: workspace,
        indexPattern: INDEX_WITH_TIME_1,
        timefieldName: 'timestamp',
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        url: BASE_PATH,
        workspaceName: workspace,
        page: 'explore/logs',
        isEnhancement: true,
      });
      cy.getElementByTestId('discoverNewButton').click();
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspace, [INDEX_WITH_TIME_1]);
    });

    generateAllTestConfigurations(generateFieldDisplayFilteringTestConfiguration, {
      indexPattern: `${INDEX_WITH_TIME_1}*`,
      datasetTypes: {
        INDEX_PATTERN: {
          name: 'INDEX_PATTERN',
          supportedLanguages: [QueryLanguages.PPL],
        },
      }, // Currently only index patterns support this filtering functionality
    }).forEach((config) => {
      it(`filter for action in table field for ${config.testName}`, () => {
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        setDatePickerDatesAndSearchIfRelevant(config.language);
        cy.wait(2000);

        cy.getElementByTestId('docTable').get('tbody tr').should('have.length.above', 3); // To ensure it waits until a full table is loaded into the DOM, instead of a bug where table only has 1 hit.

        cy.getElementByTestId('field-category-showDetails').click();
        cy.getElementByTestId('plus-category-Network').click();

        verifyMonacoEditorContent("| WHERE `category` = 'Network' ");
      });

      it(`filter out action in table field for ${config.testName}`, () => {
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        setDatePickerDatesAndSearchIfRelevant(config.language);
        cy.wait(2000);

        cy.getElementByTestId('docTable').get('tbody tr').should('have.length.above', 3); // To ensure it waits until a full table is loaded into the DOM, instead of a bug where table only has 1 hit.

        cy.getElementByTestId('field-category-showDetails').click();
        cy.getElementByTestId('minus-category-Network').click();

        verifyMonacoEditorContent("| WHERE `category` != 'Network' ");
      });

      it(`filter for actions in expanded table for ${config.testName}`, () => {
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        setDatePickerDatesAndSearchIfRelevant(config.language);
        cy.wait(2000);

        cy.getElementByTestId('docTable').get('tbody tr').should('have.length.above', 3); // To ensure it waits until a full table is loaded into the DOM, instead of a bug where table only has 1 hit.

        cy.get('tbody tr')
          .first()
          .find('[data-test-subj="docTableExpandToggleColumn"] button')
          .click();

        cy.wait(2000);

        cy.getElementByTestId('tableDocViewRow-category').within(() => {
          cy.getElementByTestId('addInclusiveFilterButton').click();
        });

        verifyMonacoEditorContent("| WHERE `category` = 'Network' ");
      });

      it(`filter out actions in expanded table for ${config.testName}`, () => {
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        setDatePickerDatesAndSearchIfRelevant(config.language);
        cy.wait(2000);

        cy.getElementByTestId('docTable').get('tbody tr').should('have.length.above', 3); // To ensure it waits until a full table is loaded into the DOM, instead of a bug where table only has 1 hit.

        cy.get('tbody tr')
          .first()
          .find('[data-test-subj="docTableExpandToggleColumn"] button')
          .click();

        cy.wait(2000);

        cy.getElementByTestId('tableDocViewRow-category').within(() => {
          cy.getElementByTestId('removeInclusiveFilterButton').click();
        });

        verifyMonacoEditorContent("| WHERE `category` != 'Network' ");
      });
    });
  });
};

prepareTestSuite('Field Display Filtering', fieldDisplayFilteringTestSuite);

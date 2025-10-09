/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

export const runSavedSearchTests = () => {
  describe('saved search in dashboards', () => {
    const SAVED_SEARCH_NAME = `TEST_${Date.now()}`;
    let totalHit = 0;
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);
      cy.explore.createWorkspaceDataSets({
        workspaceName: workspaceName,
        indexPattern: INDEX_WITH_TIME_1,
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });

      // Create a saved search
      cy.explore.clearQueryEditor();
      cy.wait(10000);

      const datasetName = `${INDEX_WITH_TIME_1}*`;
      cy.explore.setDataset(datasetName, DATASOURCE_NAME, 'INDEX_PATTERN');
      const query = `source=${datasetName}`;
      cy.explore.setQueryEditor(query);
      cy.explore.setTopNavDate(START_TIME, END_TIME, false);

      // Run the query
      cy.getElementByTestId('exploreQueryExecutionButton').click();
      cy.osd.waitForLoader(true);
      cy.wait(1000);
      cy.getElementByTestId('discoverTable').should('be.visible');
      cy.getElementByTestId('discoverQueryHits')
        .invoke('text')
        .then((text) => {
          totalHit = parseInt(text.replaceAll(',', ''));
        });

      cy.getElementByTestId('discoverSaveButton').click();
      cy.getElementByTestId('savedObjectTitle')
        .should('be.visible')
        .type(SAVED_SEARCH_NAME, { delay: 40, force: true });
      cy.getElementByTestId('confirmSaveSavedObjectButton').click();
      cy.getElementByTestId('savedExploreSuccess').should('be.visible');
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    it('Load a saved search to dashboard correctly', () => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'dashboards',
        isEnhancement: true,
      });
      // Create a new dashboard
      cy.getElementByTestId('newItemButton').click();

      // Find the saved search
      cy.getElementByTestId('dashboardAddPanelButton').click();
      cy.getElementByTestId('dashboardAddPanelFromLibrary').click();
      cy.getElementByTestId('savedObjectFinderSearchInput').type(SAVED_SEARCH_NAME, {
        delay: 40,
        force: true,
      });

      // Add the saved search to the dashboard
      cy.getElementByTestId('savedObjectFinderItemList')
        .find('li')
        .first()
        .should('contain.text', SAVED_SEARCH_NAME)
        .click();
      cy.get('body').click(0, 0);

      // verify that there are results
      cy.getElementByTestId('docTableField').should('be.visible');
      cy.getElementByTestId('osdDocTablePagination').should('contain.text', `of ${totalHit}`);

      // Changing the time range should update the number of results
      cy.osd.setTopNavDate(START_TIME, 'Oct 1, 2022 @ 00:00:00.000', false);
      cy.getElementByTestId('querySubmitButton').click();
      cy.osd.waitForLoader(true);
      cy.getElementByTestId('osdDocTablePagination').should('not.contain.text', `of ${totalHit}`);
    });
  });
};

prepareTestSuite('Saved Search in Dashboards', runSavedSearchTests);

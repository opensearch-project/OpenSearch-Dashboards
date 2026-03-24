/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DatasetTypes,
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  QueryLanguages,
  START_TIME,
} from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/query_enhancements/shared';
import {
  postRequestSaveSearch,
  generateSavedTestConfiguration,
  getExpectedHitCount,
  loadSavedSearchFromDashboards,
  navigateToDashboardAndOpenSavedSearchPanel,
} from '../../../../../../utils/apps/query_enhancements/saved';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

export const runSavedSearchTests = () => {
  // TODO: Since the top nav has been changed, this needs to be updated with the correct add to dashboards flow.
  describe.skip('saved search in dashboards', () => {
    // TODO: Currently we cannot convert this into a "before" and "after" due to us grabbing several aliases that are required by postRequestSaveSearch()
    beforeEach(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        INDEX_PATTERN_WITH_TIME,
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-search'] // features
      );

      // cy.osd.grabDataSourceId(workspaceName, DATASOURCE_NAME);
    });

    afterEach(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    it('Load a saved search', () => {
      const config = generateSavedTestConfiguration(
        INDEX_PATTERN_WITH_TIME,
        DatasetTypes.INDEX_PATTERN.name,
        QueryLanguages.DQL
      );
      // using a POST request to create a saved search to load
      postRequestSaveSearch(config);

      loadSavedSearchFromDashboards(config, workspaceName);

      // verify that there are results
      cy.getElementByTestId('docTableField').should('be.visible');

      const expectedHitCount = getExpectedHitCount(config.datasetType, config.language);
      cy.getElementByTestId('osdDocTablePagination').contains(new RegExp(`of ${expectedHitCount}`));
      // verify that the proper fields are loaded as well as sorting is working as expected
      config.sampleTableData.forEach(([index, value]) => {
        cy.getElementByTestId('osdDocTableCellDataField').eq(index).contains(value);
      });
    });

    it('Changing the time range updates the saved search elements in dashboards', () => {
      const config = generateSavedTestConfiguration(
        INDEX_PATTERN_WITH_TIME,
        DatasetTypes.INDEX_PATTERN.name,
        QueryLanguages.DQL
      );
      // using a POST request to create a saved search to load
      postRequestSaveSearch(config);

      loadSavedSearchFromDashboards(config, workspaceName);

      // verify that there are results
      const expectedHitCount = getExpectedHitCount(config.datasetType, config.language);
      cy.getElementByTestId('osdDocTablePagination').contains(new RegExp(`of ${expectedHitCount}`));

      // set a date where there should different number of results
      setDatePickerDatesAndSearchIfRelevant(
        config.language,
        START_TIME,
        'Oct 1, 2022 @ 00:00:00.000'
      );
      cy.getElementByTestId('osdDocTablePagination').contains(/of 11/);
    });

    it('Show valid saved searches', () => {
      const dqlConfig = generateSavedTestConfiguration(
        INDEX_PATTERN_WITH_TIME,
        DatasetTypes.INDEX_PATTERN.name,
        QueryLanguages.DQL
      );
      const luceneConfig = generateSavedTestConfiguration(
        INDEX_PATTERN_WITH_TIME,
        DatasetTypes.INDEX_PATTERN.name,
        QueryLanguages.Lucene
      );
      const sqlConfig = generateSavedTestConfiguration(
        INDEX_PATTERN_WITH_TIME,
        DatasetTypes.INDEX_PATTERN.name,
        QueryLanguages.SQL
      );
      const pplConfig = generateSavedTestConfiguration(
        INDEX_PATTERN_WITH_TIME,
        DatasetTypes.INDEX_PATTERN.name,
        QueryLanguages.PPL
      );
      // using a POST request to create a saved search to load
      postRequestSaveSearch(dqlConfig);
      postRequestSaveSearch(luceneConfig);
      postRequestSaveSearch(sqlConfig);
      postRequestSaveSearch(pplConfig);

      navigateToDashboardAndOpenSavedSearchPanel(workspaceName);
      cy.getElementByTestId(`savedObjectTitle${dqlConfig.saveName}`).should('exist');
      cy.getElementByTestId(`savedObjectTitle${luceneConfig.saveName}`).should('exist');
      cy.getElementByTestId(`savedObjectTitle${sqlConfig.saveName}`).should('not.exist');
      cy.getElementByTestId(`savedObjectTitle${pplConfig.saveName}`).should('not.exist');
    });
  });
};

prepareTestSuite('Saved Search in Dashboards', runSavedSearchTests);

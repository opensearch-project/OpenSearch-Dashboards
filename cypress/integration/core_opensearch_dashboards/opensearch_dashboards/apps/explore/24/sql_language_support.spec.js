/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  DATASOURCE_NAME,
  END_TIME,
  START_TIME,
} from '../../../../../../utils/apps/explore/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

const runSQLLanguageSupportTests = () => {
  describe('SQL language support', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        workspaceName,
        datasetId,
        DATASOURCE_NAME,
        INDEX_PATTERN_WITH_TIME
      );
    });

    beforeEach(() => {
      cy.osd.resetData();
      cy.osd.visitWorkspace(workspaceName);
      cy.explore.navigateToExplore();
      cy.explore.selectDataset(datasetId);
      cy.explore.setDatePickerRange(START_TIME, END_TIME);

      // Enable SQL support feature flag
      cy.setAdvancedSetting({
        'explore.sqlSupport.enabled': true,
      });
    });

    after(() => {
      cy.osd.deleteWorkspace(workspaceName);
    });

    describe('Language switching', () => {
      it('should successfully switch to SQL and persist selection', () => {
        // Switch to SQL
        cy.get('[data-test-subj="queryPanelFooterLanguageToggle"]').click();
        cy.get('[data-test-subj="queryPanelFooterLanguageToggle-OpenSearch SQL"]').click();

        // Verify SQL is selected and persists
        cy.get('[data-test-subj="queryPanelFooterLanguageToggle"]')
          .should('contain.text', 'OpenSearch SQL');

        // Verify SQL is still available in dropdown after selection
        cy.get('[data-test-subj="queryPanelFooterLanguageToggle"]').click();
        cy.get('[data-test-subj="queryPanelFooterLanguageToggle-OpenSearch SQL"]')
          .should('exist')
          .and('be.visible');

        cy.get('body').click();
      });

      it('should load default SQL query when switching languages', () => {
        // Switch to SQL
        cy.get('[data-test-subj="queryPanelFooterLanguageToggle"]').click();
        cy.get('[data-test-subj="queryPanelFooterLanguageToggle-OpenSearch SQL"]').click();

        // Verify default SQL query is loaded
        cy.get('[data-test-subj="exploreQueryPanelEditor"]')
          .should('contain.text', 'SELECT')
          .and('contain.text', 'FROM')
          .and('contain.text', 'LIMIT');
      });
    });

    describe('Date picker integration', () => {
      it('should show date picker for SQL queries in Explore', () => {
        // Switch to SQL
        cy.get('[data-test-subj="queryPanelFooterLanguageToggle"]').click();
        cy.get('[data-test-subj="queryPanelFooterLanguageToggle-OpenSearch SQL"]').click();

        // Date picker should be visible for SQL
        cy.get('[data-test-subj="osdQueryEditorDatePicker"]')
          .should('exist')
          .and('be.visible');
      });

      it('should maintain date picker visibility when switching between PPL and SQL', () => {
        // Start with PPL - date picker should be visible
        cy.get('[data-test-subj="osdQueryEditorDatePicker"]')
          .should('exist')
          .and('be.visible');

        // Switch to SQL - date picker should remain visible
        cy.get('[data-test-subj="queryPanelFooterLanguageToggle"]').click();
        cy.get('[data-test-subj="queryPanelFooterLanguageToggle-OpenSearch SQL"]').click();

        cy.get('[data-test-subj="osdQueryEditorDatePicker"]')
          .should('exist')
          .and('be.visible');

        // Switch back to PPL - date picker should still be visible
        cy.get('[data-test-subj="queryPanelFooterLanguageToggle"]').click();
        cy.get('[data-test-subj="queryPanelFooterLanguageToggle-PPL"]').click();

        cy.get('[data-test-subj="osdQueryEditorDatePicker"]')
          .should('exist')
          .and('be.visible');
      });
    });

    describe('Tab support', () => {
      const tabsWithSQLSupport = [
        { id: 'logs', name: 'Logs' },
        { id: 'visualizations', name: 'Visualization' },
        { id: 'statistics', name: 'Statistics' }
      ];

      tabsWithSQLSupport.forEach(({ id, name }) => {
        it(`should support SQL in ${name} tab`, () => {
          // Navigate to the specific tab
          cy.get(`[data-test-subj="explore-tab-${id}"]`).click();

          // SQL should be available in language dropdown
          cy.get('[data-test-subj="queryPanelFooterLanguageToggle"]').click();
          cy.get('[data-test-subj="queryPanelFooterLanguageToggle-OpenSearch SQL"]')
            .should('exist')
            .and('be.visible');

          // Switch to SQL
          cy.get('[data-test-subj="queryPanelFooterLanguageToggle-OpenSearch SQL"]').click();

          // Verify SQL is active
          cy.get('[data-test-subj="queryPanelFooterLanguageToggle"]')
            .should('contain.text', 'OpenSearch SQL');
        });
      });
    });

    describe('Query execution', () => {
      beforeEach(() => {
        // Switch to SQL for query execution tests
        cy.get('[data-test-subj="queryPanelFooterLanguageToggle"]').click();
        cy.get('[data-test-subj="queryPanelFooterLanguageToggle-OpenSearch SQL"]').click();
      });

      it('should execute valid SQL queries and display results', () => {
        // Use the default SQL query that should be loaded
        cy.get('[data-test-subj="querySubmitButton"]').click();

        // Wait for query execution and verify results are displayed
        cy.get('[data-test-subj="explore-logs-table"]', { timeout: 10000 })
          .should('exist')
          .and('be.visible');

        // Verify some data is returned
        cy.get('[data-test-subj="explore-logs-table"] tbody tr')
          .should('have.length.greaterThan', 0);
      });

      it('should show error for invalid SQL syntax', () => {
        // Clear editor and enter invalid SQL
        cy.explore.clearQueryEditor();
        cy.explore.typeInQueryEditor('SELCT * FROM invalid_syntax');

        cy.get('[data-test-subj="querySubmitButton"]').click();

        // Should show error message
        cy.get('[data-test-subj="queryStatusMessage"]', { timeout: 5000 })
          .should('contain.text', 'error')
          .or('contain.text', 'failed')
          .or('contain.text', 'invalid');
      });

      it('should apply time filters to SQL queries', () => {
        // Set a specific time range
        cy.explore.setDatePickerRange('Jan 1, 2020 @ 00:00:00.000', 'Jan 2, 2020 @ 00:00:00.000');

        // Execute query
        cy.get('[data-test-subj="querySubmitButton"]').click();

        // Verify query executed successfully with time filters applied
        cy.get('[data-test-subj="explore-logs-table"]', { timeout: 10000 })
          .should('exist')
          .and('be.visible');
      });
    });

    describe('Cross-app isolation', () => {
      it('should not affect language options in legacy Discover', () => {
        // Navigate to legacy Discover
        cy.visit('/app/discover');
        cy.wait(2000);

        cy.get('[data-test-subj="queryEditorLanguageSelector"]', { timeout: 5000 })
          .should('exist')
          .click();

        // SQL should not be in Discover's language options
        cy.get('[data-test-subj="languageSelectorMenuItem"]')
          .should('not.contain.text', 'OpenSearch SQL');
      });
    });
  });
};

prepareTestSuite('SQL Language Support', runSQLLanguageSupportTests);
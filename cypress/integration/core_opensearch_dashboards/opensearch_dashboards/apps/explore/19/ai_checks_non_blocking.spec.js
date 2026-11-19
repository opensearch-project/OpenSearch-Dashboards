/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME, INDEX_PATTERN_WITH_TIME } from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

// The two AI availability checks answer far later than the app is willing to wait.
const HANG_MS = 60000;
const hangAiAvailabilityChecks = () => {
  cy.intercept('GET', '**/enhancements/assist/languages*', {
    statusCode: 200,
    body: { configuredLanguages: ['PPL'] },
    delay: HANG_MS,
  });
  cy.intercept('GET', '**/assistant/agent_config/_exists*', {
    statusCode: 200,
    body: { exists: true },
    delay: HANG_MS,
  });
};

const aiChecksNonBlockingTests = () => {
  describe('AI availability checks that never answer', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        INDEX_PATTERN_WITH_TIME, // Uses 'data_logs_small_time_*'
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    beforeEach(() => {
      hangAiAvailabilityChecks();
      cy.intercept('POST', '**/api/enhancements/search/*').as('search');
    });

    it('renders the page and runs the query, without offering AI mode', () => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
      cy.explore.setDataset(INDEX_PATTERN_WITH_TIME, DATASOURCE_NAME, 'INDEX_PATTERN');
      setDatePickerDatesAndSearchIfRelevant('PPL');

      cy.getElementByTestId('exploreTabs').should('exist');
      cy.getElementByTestId('discoverQueryHits').should('be.visible');

      // Pressing space must not switch to AI mode while the checks are pending.
      cy.explore.setQueryEditor(' ', { submit: false });
      cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('PPL');
      cy.getElementByTestId('queryPanelFooterLanguageToggle').should('not.contain', 'AI');
    });

    it('runs the query right after the dataset changes', () => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
      cy.explore.setDataset(INDEX_PATTERN_WITH_TIME, DATASOURCE_NAME, 'INDEX_PATTERN');
      setDatePickerDatesAndSearchIfRelevant('PPL');
      cy.getElementByTestId('discoverQueryHits').should('be.visible');

      cy.get('@search.all').then((requests) => {
        const searchesBefore = requests.length;

        // The time range carries over, so the only thing that can send the new dataset's query
        // is the dataset change itself, while the checks are still pending.
        cy.explore.setDataset('data_logs_small_time_1', DATASOURCE_NAME, 'INDEXES');

        cy.get('@search.all').should('have.length.greaterThan', searchesBefore);
        cy.getElementByTestId('discoverQueryHits').should('be.visible');
      });
    });
  });
};

prepareTestSuite('AI availability checks that never answer', aiChecksNonBlockingTests);

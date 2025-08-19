/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';

describe('Results Summary', () => {
  let testResources = {};
  const generatedQuery = 'source=data_logs_small_time_* | stats count()';
  const generatedSummary = 'The sample data shows a single record';

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
    });
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  beforeEach(() => {
    // Mock AI capabilities
    cy.intercept('POST', '**/api/core/capabilities', (req) => {
      req.continue((res) => {
        res.body = {
          ...res.body,
          assistant: { enabled: true },
        };
      });
    });

    cy.intercept('GET', '**/enhancements/assist/languages*', {
      statusCode: 200,
      body: { configuredLanguages: ['PPL'] },
    });

    cy.intercept('POST', '**/enhancements/assist/generate', {
      statusCode: 200,
      body: { query: generatedQuery },
    });

    cy.intercept('GET', '**/assistant/agent_config/_exists*', {
      statusCode: 200,
      body: { exists: true },
    });

    cy.intercept('POST', '**/assistant/data2summary*', {
      statusCode: 200,
      body: generatedSummary,
    });

    cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
    cy.osd.waitForLoader(true);
    cy.core.waitForDatasetsToLoad();

    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);
  });

  it('should generate AI summary', () => {
    // Enter AI mode with space
    cy.explore.setQueryEditor(' How many logs are there?');

    // Switch to AI Summary view
    cy.get('[data-text="AI Summary"]').click({ force: true });
    cy.contains(generatedSummary).should('be.visible');
  });

  it('should copy summary to clipboard', () => {
    cy.explore.setQueryEditor(' How many logs are there?');
    cy.get('[data-text="AI Summary"]').click({ force: true });
    cy.contains(generatedSummary).should('be.visible');

    // Spy on clipboard
    cy.window().then((win) => {
      cy.spy(win.document, 'execCommand').as('copyCommand');
    });

    cy.get('[data-test-subj="exploreResultsSummary_summary_buttons_copy"]').click();
    cy.get('@copyCommand').should('be.calledWith', 'copy');
  });

  it('should handle feedback buttons correctly', () => {
    cy.explore.setQueryEditor(' How many logs are there?');
    cy.get('[data-text="AI Summary"]').click({ force: true });
    cy.contains(generatedSummary).should('be.visible');

    // Click thumbs up
    cy.get('[data-test-subj="exploreResultsSummary_summary_buttons_thumbup"]').click();
    cy.get('[data-test-subj="exploreResultsSummary_summary_buttons_thumbdown"]').should(
      'not.exist'
    );

    // Refresh and try thumbs down
    cy.reload();
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);
    cy.explore.setQueryEditor(' How many logs are there?');
    cy.get('[data-text="AI Summary"]').click({ force: true });

    cy.get('[data-test-subj="exploreResultsSummary_summary_buttons_thumbdown"]').click();
    cy.get('[data-test-subj="exploreResultsSummary_summary_buttons_thumbup"]').should('not.exist');
  });

  it('should persist view selection', () => {
    cy.explore.setQueryEditor(' How many logs are there?');

    // Should default to AI Summary
    cy.get('.euiButtonGroupButton-isSelected').should('contain', 'AI Summary');
    cy.contains(generatedSummary).should('be.visible');

    // Switch to Histogram
    cy.get('[data-text="Histogram"]').click({ force: true });
    cy.get('.euiButtonGroupButton-isSelected').should('contain', 'Histogram');
  });
});

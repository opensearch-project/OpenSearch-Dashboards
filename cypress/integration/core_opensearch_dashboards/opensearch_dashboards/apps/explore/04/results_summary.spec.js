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
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const resultsSummaryTests = () => {
  const generatedQuery = 'source=data_logs_small_time_* | stats count()';
  const generatedSummary = 'The sample data shows a single record';

  describe('Results Summary', () => {
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
      // mock assistant capabilities
      cy.intercept('POST', '**/api/core/capabilities', (req) => {
        req.continue((res) => {
          res.body = {
            ...res.body,
            assistant: { enabled: true },
          };
        });
      });
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
      // mock agent exists
      cy.intercept('GET', '**/assistant/agent_config/_exists*', {
        statusCode: 200,
        body: { exists: true },
      });
      // mock results summary
      cy.intercept('POST', '**/assistant/data2summary*', {
        statusCode: 200,
        body: generatedSummary,
      });

      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
      // set dataset
      cy.explore.setDataset('data_logs_small_time_*', DATASOURCE_NAME, 'INDEX_PATTERN');
      setDatePickerDatesAndSearchIfRelevant('PPL');
    });

    it(`should be able to generate summary`, () => {
      // Press space to enter AI mode and enter NL query
      cy.explore.setQueryEditor(' How many logs are there?');
      // Switch view as
      cy.get('[data-text="AI Summary"]').should('exist').click({ force: true });
      cy.contains(generatedSummary).should('be.visible');
    });

    it(`should be able to read clipboard`, () => {
      // Press space to enter AI mode and enter NL query
      cy.explore.setQueryEditor(' How many logs are there?');
      // Should presist the state of view as
      cy.get('.euiButtonGroupButton-isSelected').should('contain', 'AI Summary');
      cy.contains(generatedSummary).should('be.visible');

      // Click copy button
      cy.window().then((win) => {
        cy.spy(win.document, 'execCommand').as('copyCommand');
      });
      cy.get('[data-test-subj="exploreResultsSummary_summary_buttons_copy"]').click();
      // Verify the text copy is triggered
      cy.get('@copyCommand').should('be.calledWith', 'copy');

      cy.get('[data-text="Histogram"]').should('exist').click({ force: true });
    });

    it(`should hide thumbs up when thumbs down is clicked`, () => {
      // Press space to enter AI mode and enter NL query
      cy.explore.setQueryEditor(' How many logs are there?');
      cy.get('.euiButtonGroupButton-isSelected').should('contain', 'Histogram');

      // Click back to AI summary
      cy.get('[data-text="AI Summary"]').should('exist').click({ force: true });
      cy.contains(generatedSummary).should('be.visible');

      // Click on a feedback button results in another button is not visible
      cy.get('[data-test-subj="exploreResultsSummary_summary_buttons_thumbdown"]').click();
      cy.get('[data-test-subj="exploreResultsSummary_summary_buttons_thumbup"]').should(
        'not.exist'
      );
    });

    it(`should hide thumbs down when thumbs up is clicked`, () => {
      // Press space to enter AI mode and enter NL query
      cy.explore.setQueryEditor(' How many logs are there?');
      cy.contains(generatedSummary).should('be.visible');

      // Click on a feedback button results in another button is not visible
      cy.get('[data-test-subj="exploreResultsSummary_summary_buttons_thumbup"]').click();
      cy.get('[data-test-subj="exploreResultsSummary_summary_buttons_thumbdown"]').should(
        'not.exist'
      );
    });
  });
};

prepareTestSuite('Results Summary', resultsSummaryTests);

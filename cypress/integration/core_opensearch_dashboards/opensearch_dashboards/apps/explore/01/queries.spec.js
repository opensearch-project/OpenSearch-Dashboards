/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  END_TIME,
  INDEX_PATTERN_WITH_TIME,
  INVALID_INDEX,
  START_TIME,
} from '../../../../../../utils/apps/explore/constants';
import { verifyMonacoEditorContent } from '../../../../../../utils/apps/explore/shared';

describe('Queries', { scrollBehavior: false }, () => {
  let testResources = {};
  const pattern = INDEX_PATTERN_WITH_TIME;

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.window().then((win) => {
        win.localStorage.setItem('hasSeenInfoBox_PPL', true);
        cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
        cy.osd.waitForLoader(true);
      });
    });
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  it('should execute empty PPL query', () => {
    cy.explore.setTopNavDate(START_TIME, END_TIME);
    cy.getElementByTestId('exploreTabs').should('exist');
    cy.verifyHitCount('10,000');
    verifyMonacoEditorContent('');

    // Query should persist across refresh
    cy.reload();
    cy.getElementByTestId('exploreTabs').should('exist');
    cy.verifyHitCount('10,000');
    verifyMonacoEditorContent('');

    // Test error message with invalid index
    const invalidQuery = `source = ${INVALID_INDEX}`;
    cy.explore.setQueryEditor(invalidQuery);
  });

  it('should execute PPL query not starting with source', () => {
    cy.explore.setTopNavDate(START_TIME, END_TIME);
    // Executing a query without source = part
    const queryWithoutSource =
      'category = "Network" and bytes_transferred > 5000 | sort bytes_transferred';
    cy.explore.setQueryEditor(queryWithoutSource);
    cy.verifyHitCount('1,263');
    verifyMonacoEditorContent(queryWithoutSource);
  });

  it('should execute PPL query starting with search command', () => {
    cy.explore.setTopNavDate(START_TIME, END_TIME);
    const queryWithSearch = `search source = ${pattern} category = "Network" and bytes_transferred > 5000 | sort bytes_transferred`;
    cy.explore.setQueryEditor(queryWithSearch);
    cy.verifyHitCount('1,263');
    verifyMonacoEditorContent(queryWithSearch);
  });
});

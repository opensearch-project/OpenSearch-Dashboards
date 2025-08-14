/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_WITH_TIME_1,
  START_TIME,
  END_TIME,
  INVALID_INDEX,
} from '../../../../../../utils/apps/constants';
import { verifyDiscoverPageState } from '../../../../../../utils/apps/explore/saved';

describe('Query Enhancement Queries', { scrollBehavior: false }, () => {
  const index = INDEX_WITH_TIME_1;

  before(() => {
    cy.core.setupTestResources({
      index,
    });

    cy.get('@WORKSPACE_ID').then((workspaceId) => {
      cy.core.buildDatasetQuery({ index }).then((query) => {
        cy.visit(`/app/opensearch/w/${workspaceId}/explore/logs?${query}`);
        cy.osd.waitForLoader(true);
      });
    });
  });

  beforeEach(() => {
    cy.getElementByTestId('discoverNewButton').click();
    cy.osd.waitForLoader(true);
  });

  after(() => {
    cy.core.cleanupTestResources({ index });
  });

  it('should run with empty PPL query', () => {
    cy.explore.clearQueryEditor();
    cy.explore.setTopNavDate(START_TIME, END_TIME);
    cy.getElementByTestId('queryPanelFooterRunQueryButton').click();
    cy.osd.waitForLoader(true);

    // Verify the state after query execution
    verifyDiscoverPageState({
      dataset: index,
      queryString: '',
      language: 'PPL',
      hitCount: '10,000',
    });
    cy.getElementByTestId(`discoverQueryElapsedMs`).should('be.visible');
    cy.osd.verifyResultsCount(10000);

    // Query should persist across refresh
    cy.reload();
    cy.osd.waitForLoader(true);
    cy.getElementByTestId(`discoverQueryElapsedMs`).should('be.visible');

    // Verify the state again after reload
    verifyDiscoverPageState({
      dataset: index,
      queryString: '',
      language: 'PPL',
      hitCount: '10,000',
    });
  });

  it('should run PPL query not starting with source', () => {
    cy.explore.clearQueryEditor();
    cy.explore.setTopNavDate(START_TIME, END_TIME);

    // Executing a query without source = part
    const queryWithoutSource =
      'category = "Network" and bytes_transferred > 5000 | sort bytes_transferred';
    cy.explore.setQueryEditor(queryWithoutSource);
    cy.getElementByTestId('queryPanelFooterRunQueryButton').click();
    cy.osd.waitForLoader(true);

    verifyDiscoverPageState({
      dataset: index,
      queryString: queryWithoutSource,
      language: 'PPL',
      hitCount: '1,263',
    });
  });

  it('should run PPL query starting with search command', () => {
    cy.explore.clearQueryEditor();
    cy.explore.setTopNavDate(START_TIME, END_TIME);

    // Executing a query with search command
    const queryWithSearch = `search source = ${index} category = "Network" and bytes_transferred > 5000 | sort bytes_transferred`;
    cy.explore.setQueryEditor(queryWithSearch);
    cy.getElementByTestId('queryPanelFooterRunQueryButton').click();
    cy.osd.waitForLoader(true);

    verifyDiscoverPageState({
      dataset: index,
      queryString: queryWithSearch,
      language: 'PPL',
      hitCount: '1,263',
    });
  });

  it('should handle invalid index errors', () => {
    cy.explore.clearQueryEditor();
    cy.explore.setTopNavDate(START_TIME, END_TIME);

    // Test with invalid index
    const invalidQuery = `source = ${INVALID_INDEX}`;
    cy.explore.setQueryEditor(invalidQuery);
    cy.getElementByTestId('queryPanelFooterRunQueryButton').click();
    cy.osd.waitForLoader(true);

    // We're not checking for specific error message as noted in the plan
    cy.getElementByTestId('queryPanelFooterErrorButton').should('be.visible');
  });
});

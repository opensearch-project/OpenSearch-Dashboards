/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';
import { verifyMonacoEditorContent } from '../../../../../../utils/apps/explore/shared';

describe('Field Display Filtering', () => {
  let testResources = {};

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
      cy.osd.waitForLoader(true);
    });
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  beforeEach(() => {
    cy.getElementByTestId('discoverNewButton').click();
    cy.osd.waitForLoader(true);
    cy.core.waitForDatasetsToLoad();
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);
    cy.wait(2000);
  });

  it('should filter for value in table field', () => {
    cy.getElementByTestId('docTable').get('tbody tr').should('have.length.above', 3);

    cy.getElementByTestId('field-category-showDetails').click();
    cy.getElementByTestId('plus-category-Network').click();

    verifyMonacoEditorContent("| WHERE `category` = 'Network' ");
  });

  it('should filter out value in table field', () => {
    cy.getElementByTestId('docTable').get('tbody tr').should('have.length.above', 3);

    cy.getElementByTestId('field-category-showDetails').click();
    cy.getElementByTestId('minus-category-Network').click();

    verifyMonacoEditorContent("| WHERE `category` != 'Network' ");
  });

  it('should filter for value in expanded doc', () => {
    cy.getElementByTestId('docTable').get('tbody tr').should('have.length.above', 3);

    cy.get('tbody tr').first().find('[data-test-subj="docTableExpandToggleColumn"] button').click();

    cy.wait(2000);

    cy.getElementByTestId('tableDocViewRow-category').within(() => {
      cy.getElementByTestId('addInclusiveFilterButton').click();
    });

    verifyMonacoEditorContent("| WHERE `category` = 'Network' ");
  });

  it('should filter out value in expanded doc', () => {
    cy.getElementByTestId('docTable').get('tbody tr').should('have.length.above', 3);

    cy.get('tbody tr').first().find('[data-test-subj="docTableExpandToggleColumn"] button').click();

    cy.wait(2000);

    cy.getElementByTestId('tableDocViewRow-category').within(() => {
      cy.getElementByTestId('removeInclusiveFilterButton').click();
    });

    verifyMonacoEditorContent("| WHERE `category` != 'Network' ");
  });
});

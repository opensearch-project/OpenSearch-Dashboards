/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { DataExplorerPage } from '../../../../../utils/dashboards/data_explorer/data_explorer_page.po.js';
import {
  DATASOURCE_NAME,
  INDEX_NAME,
  INDEX_PATTERN_NAME,
  SEARCH_ABSOLUTE_START_DATE,
  SEARCH_ABSOLUTE_END_DATE,
} from './constants.js';

const miscUtils = new MiscUtils(cy);

function selectDataSet(datasetType, language) {
  switch (datasetType) {
    case 'index':
      DataExplorerPage.selectIndexDataset(DATASOURCE_NAME, INDEX_NAME, language);
      break;
    case 'index_pattern':
      DataExplorerPage.selectIndexPatternDataset(INDEX_PATTERN_NAME, language);
      if (language !== 'OpenSearch SQL') {
        cy.setSearchAbsoluteDateRange(SEARCH_ABSOLUTE_START_DATE, SEARCH_ABSOLUTE_END_DATE);
      }
      break;
  }
}

function checkTableFieldFilterActions(datasetType, language, isEnabled) {
  selectDataSet(datasetType, language);

  DataExplorerPage.getDiscoverQueryHits().should('not.exist'); // To ensure it waits until a full table is loaded into the DOM, instead of a bug where table only has 1 hit.

  DataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(isEnabled);

  if (isEnabled) {
    DataExplorerPage.checkDocTableFirstFieldFilterForButtonFiltersCorrectField();
    DataExplorerPage.checkDocTableFirstFieldFilterOutButtonFiltersCorrectField();
  }
}

function checkExpandedTableFilterActions(datasetType, language, isEnabled) {
  selectDataSet(datasetType, language);

  DataExplorerPage.getDiscoverQueryHits().should('not.exist'); // To ensure it waits until a full table is loaded into the DOM, instead of a bug where table only has 1 hit.
  DataExplorerPage.toggleDocTableRow(0);
  DataExplorerPage.checkDocTableFirstExpandedFieldFirstRowFilterForFilterOutExistsFilterButtons(
    isEnabled
  );
  DataExplorerPage.checkDocTableFirstExpandedFieldFirstRowToggleColumnButtonHasIntendedBehavior();

  if (isEnabled) {
    DataExplorerPage.checkDocTableFirstExpandedFieldFirstRowFilterForButtonFiltersCorrectField();
    DataExplorerPage.checkDocTableFirstExpandedFieldFirstRowFilterOutButtonFiltersCorrectField();
    DataExplorerPage.checkDocTableFirstExpandedFieldFirstRowExistsFilterButtonFiltersCorrectField();
  }
}

describe('filter for value spec', () => {
  beforeEach(() => {
    cy.localLogin(Cypress.env('username'), Cypress.env('password'));
    miscUtils.visitPage('app/data-explorer/discover');
    cy.getNewSearchButton().click();
  });
  describe('filter actions in table field', () => {
    describe('index pattern dataset', () => {
      // filter actions should exist for DQL
      it('DQL', () => {
        checkTableFieldFilterActions('index_pattern', 'DQL', true);
      });
      // filter actions should exist for Lucene
      it('Lucene', () => {
        checkTableFieldFilterActions('index_pattern', 'Lucene', true);
      });
      // filter actions should not exist for SQL
      it('SQL', () => {
        checkTableFieldFilterActions('index_pattern', 'OpenSearch SQL', false);
      });
      // filter actions should not exist for PPL
      it('PPL', () => {
        checkTableFieldFilterActions('index_pattern', 'PPL', false);
      });
    });
    describe('index dataset', () => {
      // filter actions should not exist for SQL
      it('SQL', () => {
        checkTableFieldFilterActions('index', 'OpenSearch SQL', false);
      });
      // filter actions should not exist for PPL
      it('PPL', () => {
        checkTableFieldFilterActions('index', 'PPL', false);
      });
    });
  });

  describe('filter actions in expanded table', () => {
    describe('index pattern dataset', () => {
      // filter actions should exist for DQL
      it('DQL', () => {
        checkExpandedTableFilterActions('index_pattern', 'DQL', true);
      });
      // filter actions should exist for Lucene
      it('Lucene', () => {
        checkExpandedTableFilterActions('index_pattern', 'Lucene', true);
      });
      // filter actions should not exist for SQL
      it('SQL', () => {
        checkExpandedTableFilterActions('index_pattern', 'OpenSearch SQL', false);
      });
      // filter actions should not exist for PPL
      it('PPL', () => {
        checkExpandedTableFilterActions('index_pattern', 'PPL', false);
      });
    });
    describe('index dataset', () => {
      // filter actions should not exist for SQL
      it('SQL', () => {
        checkExpandedTableFilterActions('index', 'OpenSearch SQL', false);
      });
      // filter actions should not exist for PPL
      it('PPL', () => {
        checkExpandedTableFilterActions('index', 'OpenSearch SQL', false);
      });
    });
  });
});

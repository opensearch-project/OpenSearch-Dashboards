/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { DataExplorerPage } from '../../utils/dashboards/data_explorer/data_explorer_page.po';
import {
  INDEX_CLUSTER_NAME,
  INDEX_NAME,
  INDEX_PATTERN_NAME,
  SEARCH_ABSOLUTE_START_DATE,
  SEARCH_ABSOLUTE_END_DATE,
} from '../constants.js';

const miscUtils = new MiscUtils(cy);

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
        DataExplorerPage.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
        cy.setSearchAbsoluteDateRange(SEARCH_ABSOLUTE_START_DATE, SEARCH_ABSOLUTE_END_DATE);
        DataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(true);
        DataExplorerPage.checkDocTableFirstFieldFilterForButtonFiltersCorrectField();
        DataExplorerPage.checkDocTableFirstFieldFilterOutButtonFiltersCorrectField();
      });
      // filter actions should exist for Lucene
      it('Lucene', () => {
        DataExplorerPage.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'Lucene');
        cy.setSearchAbsoluteDateRange(SEARCH_ABSOLUTE_START_DATE, SEARCH_ABSOLUTE_END_DATE);
        DataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(true);
        DataExplorerPage.checkDocTableFirstFieldFilterForButtonFiltersCorrectField();
        DataExplorerPage.checkDocTableFirstFieldFilterOutButtonFiltersCorrectField();
      });
      // filter actions should not exist for SQL
      it('SQL', () => {
        DataExplorerPage.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'OpenSearch SQL');
        DataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
      // filter actions should not exist for PPL
      it('PPL', () => {
        DataExplorerPage.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'PPL');
        cy.setSearchAbsoluteDateRange(SEARCH_ABSOLUTE_START_DATE, SEARCH_ABSOLUTE_END_DATE);
        DataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
    });
    describe('index dataset', () => {
      // filter actions should not exist for SQL
      it('SQL', () => {
        DataExplorerPage.selectIndexDataset(INDEX_CLUSTER_NAME, INDEX_NAME, 'OpenSearch SQL');
        DataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
      // filter actions should not exist for PPL
      it('PPL', () => {
        DataExplorerPage.selectIndexDataset(INDEX_CLUSTER_NAME, INDEX_NAME, 'PPL');
        DataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
    });
  });

  describe('filter actions in expanded table', () => {
    describe('index pattern dataset', () => {
      // filter actions should exist for DQL
      it('DQL', () => {
        DataExplorerPage.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
        cy.setSearchAbsoluteDateRange(SEARCH_ABSOLUTE_START_DATE, SEARCH_ABSOLUTE_END_DATE);
        DataExplorerPage.checkDocTableFirstExpandedFieldFirstRowFilterForAndOutButtons(true);
        DataExplorerPage.checkDocTableFirstExpandedFieldFirstRowFilterForButtonFiltersCorrectField();
        DataExplorerPage.checkDocTableFirstExpandedFieldFirstRowFilterOutButtonFiltersCorrectField();
      });
      // filter actions should exist for Lucene
      it('Lucene', () => {});
      // filter actions should not exist for SQL
      it('SQL', () => {
        DataExplorerPage.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
        cy.setSearchAbsoluteDateRange(SEARCH_ABSOLUTE_START_DATE, SEARCH_ABSOLUTE_END_DATE);
        DataExplorerPage.checkDocTableFirstExpandedFieldFirstRowFilterForAndOutButtons(false);
      });
      // filter actions should not exist for PPL
      it('PPL', () => {
        DataExplorerPage.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
        cy.setSearchAbsoluteDateRange(SEARCH_ABSOLUTE_START_DATE, SEARCH_ABSOLUTE_END_DATE);
        DataExplorerPage.checkDocTableFirstExpandedFieldFirstRowFilterForAndOutButtons(false);
      });
    });
    describe('index dataset', () => {
      // filter actions should not exist for SQL
      it('SQL', () => {});
      // filter actions should not exist for PPL
      it('PPL', () => {});
    });
  });
});

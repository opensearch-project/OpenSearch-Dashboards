/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { DataExplorerPage } from '../../utils/dashboards/data_explorer/data_explorer_page.po';

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
        DataExplorerPage.selectIndexPatternDataset('DQL');
        DataExplorerPage.setSearchRelativeDateRange('15', 'Years ago');
        DataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(true);
        DataExplorerPage.checkDocTableFirstFieldFilterForButtonFiltersCorrectField();
        DataExplorerPage.checkDocTableFirstFieldFilterOutButtonFiltersCorrectField();
      });
      // filter actions should exist for Lucene
      it('Lucene', () => {
        DataExplorerPage.selectIndexPatternDataset('Lucene');
        DataExplorerPage.setSearchRelativeDateRange('15', 'Years ago');
        DataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(true);
        DataExplorerPage.checkDocTableFirstFieldFilterForButtonFiltersCorrectField();
        DataExplorerPage.checkDocTableFirstFieldFilterOutButtonFiltersCorrectField();
      });
      // filter actions should not exist for SQL
      it('SQL', () => {
        DataExplorerPage.selectIndexPatternDataset('OpenSearch SQL');
        DataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
      // filter actions should not exist for PPL
      it('PPL', () => {
        DataExplorerPage.selectIndexPatternDataset('PPL');
        DataExplorerPage.setSearchRelativeDateRange('15', 'Years ago');
        DataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
    });
    describe('index dataset', () => {
      // filter actions should not exist for SQL
      it('SQL', () => {
        DataExplorerPage.selectIndexDataset('OpenSearch SQL');
        DataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
      // filter actions should not exist for PPL
      it('PPL', () => {
        DataExplorerPage.selectIndexDataset('PPL');
        DataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
    });
  });
});

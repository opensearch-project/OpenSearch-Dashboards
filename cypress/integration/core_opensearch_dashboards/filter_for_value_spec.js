/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { DataExplorerPage } from '../../utils/data_explorer_page/data_explorer_page';

const miscUtils = new MiscUtils(cy);
const dataExplorerPage = new DataExplorerPage(cy);

describe('filter for value spec', () => {
  beforeEach(() => {
    cy.localLogin(Cypress.env('username'), Cypress.env('password'));
    miscUtils.visitPage('app/data-explorer/discover');
    dataExplorerPage.clickNewSearchButton();
  });
  describe('filter actions in table field', () => {
    describe('index pattern dataset', () => {
      // filter actions should not exist for DQL
      it.only('DQL', () => {
        dataExplorerPage.selectIndexPatternDataset('DQL');
        dataExplorerPage.setSearchDateRange('15', 'Years ago');
        dataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(true);
        dataExplorerPage.checkDocTableFirstFieldFilterForButtonFiltersCorrectField();
      });
      // filter actions should not exist for PPL
      it('Lucene', () => {
        dataExplorerPage.selectIndexPatternDataset('Lucene');
        dataExplorerPage.setSearchDateRange('15', 'Years ago');
        dataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(true);
      });
      // filter actions should not exist for SQL
      it('SQL', () => {
        dataExplorerPage.selectIndexPatternDataset('OpenSearch SQL');
        dataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
      // filter actions should not exist for PPL
      it('PPL', () => {
        dataExplorerPage.selectIndexPatternDataset('PPL');
        dataExplorerPage.setSearchDateRange('15', 'Years ago');
        dataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
    });
    describe('index dataset', () => {
      // filter actions should not exist for SQL
      it('SQL', () => {
        dataExplorerPage.selectIndexDataset('OpenSearch SQL');
        dataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
      // filter actions should not exist for PPL
      it('PPL', () => {
        dataExplorerPage.selectIndexDataset('PPL');
        dataExplorerPage.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
    });
  });
});

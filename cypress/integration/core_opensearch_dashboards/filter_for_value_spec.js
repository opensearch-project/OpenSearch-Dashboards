/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

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
        cy.selectIndexPatternDataset('DQL');
        cy.setSearchRelativeDateRange('15', 'Years ago');
        cy.checkDocTableFirstFieldFilterForAndOutButton(true);
        cy.checkDocTableFirstFieldFilterForButtonFiltersCorrectField();
        cy.checkDocTableFirstFieldFilterOutButtonFiltersCorrectField();
      });
      // filter actions should exist for Lucene
      it('Lucene', () => {
        cy.selectIndexPatternDataset('Lucene');
        cy.setSearchRelativeDateRange('15', 'Years ago');
        cy.checkDocTableFirstFieldFilterForAndOutButton(true);
        cy.checkDocTableFirstFieldFilterForButtonFiltersCorrectField();
        cy.checkDocTableFirstFieldFilterOutButtonFiltersCorrectField();
      });
      // filter actions should not exist for SQL
      it('SQL', () => {
        cy.selectIndexPatternDataset('OpenSearch SQL');
        cy.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
      // filter actions should not exist for PPL
      it('PPL', () => {
        cy.selectIndexPatternDataset('PPL');
        cy.setSearchRelativeDateRange('15', 'Years ago');
        cy.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
    });
    describe('index dataset', () => {
      // filter actions should not exist for SQL
      it('SQL', () => {
        cy.selectIndexDataset('OpenSearch SQL');
        cy.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
      // filter actions should not exist for PPL
      it('PPL', () => {
        cy.selectIndexDataset('PPL');
        cy.checkDocTableFirstFieldFilterForAndOutButton(false);
      });
    });
  });
});

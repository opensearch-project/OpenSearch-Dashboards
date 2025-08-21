/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  setDatePickerDatesAndSearchIfRelevant,
  getDefaultQuery,
} from '../../../../../../utils/apps/query_enhancements/shared';
import { verifyDiscoverPageState } from '../../../../../../utils/apps/query_enhancements/saved';
import { DEFAULT_OPTIONS } from '../../../../../../utils/commands.core';

describe('Dataset Selector', { scrollBehavior: false }, () => {
  let testResources = {};

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.window().then((win) => {
        win.localStorage.setItem('hasSeenInfoBox_PPL', true);
        win.localStorage.setItem('hasSeenInfoBox_SQL', true);

        cy.visit(`/w/${testResources.workspaceId}/app/discover#`);
        cy.osd.waitForLoader(true);
      });
    });
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  describe(`Index Patterns`, () => {
    describe('DQL', () => {
      const type = 'Index Patterns';
      const dataSource = DEFAULT_OPTIONS.dataSource.title;
      const dataset = `${dataSource}::${DEFAULT_OPTIONS.dataset.title}`;
      const language = 'DQL';
      const hitCount = '20,000';

      it('select and load with using the advanced dataset selector', () => {
        cy.coreQe.selectDatasetAdvanced(type, [dataset], language);
        const queryString = getDefaultQuery(dataset, language);
        setDatePickerDatesAndSearchIfRelevant(language);

        verifyDiscoverPageState({
          dataset,
          queryString,
          language,
          hitCount,
        });

        cy.getElementByTestId('docTableHeaderField').contains('Time');
      });

      it('select and cancel using the advanced dataset selector', () => {
        const queryString = getDefaultQuery(dataset, language);
        if (queryString !== '') {
          cy.setQueryEditor(queryString);
        }
        verifyDiscoverPageState({
          dataset,
          queryString,
          language,
          hitCount,
        });
        cy.coreQe.selectDatasetAdvanced(type, [dataSource], language, { shouldSubmit: false });

        verifyDiscoverPageState({
          dataset,
          queryString,
          language,
          hitCount,
        });
      });
    });

    describe('Lucene', () => {
      const type = 'Index Patterns';
      const dataSource = DEFAULT_OPTIONS.dataSource.title;
      const dataset = `${dataSource}::${DEFAULT_OPTIONS.dataset.title}`;
      const language = 'Lucene';
      const hitCount = '20,000';

      it('select and load with using the advanced dataset selector', () => {
        cy.coreQe.selectDatasetAdvanced(type, [dataset], language);
        const queryString = getDefaultQuery(dataset, language);
        setDatePickerDatesAndSearchIfRelevant(language);

        verifyDiscoverPageState({
          dataset,
          queryString,
          language,
          hitCount,
        });

        cy.getElementByTestId('docTableHeaderField').contains('Time');
      });

      it('select and cancel using the advanced dataset selector', () => {
        const queryString = getDefaultQuery(dataset, language);
        if (queryString !== '') {
          cy.setQueryEditor(queryString);
        }
        verifyDiscoverPageState({
          dataset,
          queryString,
          language,
          hitCount,
        });
        cy.coreQe.selectDatasetAdvanced(type, [dataSource], language, { shouldSubmit: false });

        verifyDiscoverPageState({
          dataset,
          queryString,
          language,
          hitCount,
        });
      });
    });

    describe('PPL', () => {
      const type = 'Index Patterns';
      const dataSource = DEFAULT_OPTIONS.dataSource.title;
      const dataset = `${dataSource}::${DEFAULT_OPTIONS.dataset.title}`;
      const language = 'PPL';
      const hitCount = '20,000';

      it('select and load with using the advanced dataset selector', () => {
        cy.coreQe.selectDatasetAdvanced(type, [dataset], language);
        const queryString = getDefaultQuery(dataset, language);
        setDatePickerDatesAndSearchIfRelevant(language);

        verifyDiscoverPageState({
          dataset,
          queryString,
          language,
          hitCount,
        });

        cy.getElementByTestId('docTableHeaderField').contains('Time');
      });

      it('select and cancel using the advanced dataset selector', () => {
        const queryString = getDefaultQuery(dataset, language);
        if (queryString !== '') {
          cy.setQueryEditor(queryString);
        }
        verifyDiscoverPageState({
          dataset,
          queryString,
          language,
          hitCount,
        });
        cy.coreQe.selectDatasetAdvanced(type, [dataSource], language, { shouldSubmit: false });

        verifyDiscoverPageState({
          dataset,
          queryString,
          language,
          hitCount,
        });
      });
    });

    describe('SQL', () => {
      const type = 'Index Patterns';
      const dataSource = DEFAULT_OPTIONS.dataSource.title;
      const dataset = `${dataSource}::${DEFAULT_OPTIONS.dataset.title}`;
      const language = 'SQL';
      const hitCount = '20,000';

      it('select and load with using the advanced dataset selector', () => {
        cy.coreQe.selectDatasetAdvanced(type, [dataset], language);
        const queryString = getDefaultQuery(dataset, language);

        verifyDiscoverPageState({
          dataset,
          queryString,
          language,
          hitCount,
        });
      });

      it('select and cancel using the advanced dataset selector', () => {
        const queryString = getDefaultQuery(dataset, language);
        if (queryString !== '') {
          cy.setQueryEditor(queryString);
        }
        verifyDiscoverPageState({
          dataset,
          queryString,
          language,
          hitCount,
        });
        cy.coreQe.selectDatasetAdvanced(type, [dataSource], language, { shouldSubmit: false });

        verifyDiscoverPageState({
          dataset,
          queryString,
          language,
          hitCount,
        });
      });
    });
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_PATTERN_WITH_NO_TIME,
  INDEX_WITHOUT_TIME_1,
  START_TIME,
  END_TIME,
  RESOURCES,
} from '../../../../../../utils/apps/explore/constants';
import { verifyMonacoEditorContent } from '../../../../../../utils/apps/explore/shared';
import { DEFAULT_OPTIONS } from '../../../../../../utils/commands.core';
import { PATHS } from '../../../../../../utils/constants';

describe('Dataset Select', () => {
  let testResources = {};

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.core
        .setupTestData(
          PATHS.ENGINE,
          `query_enhancements/data_logs_1/${INDEX_WITHOUT_TIME_1}.data.ndjson`,
          INDEX_WITHOUT_TIME_1
        )
        .then(() => {
          const dataset = {
            ...DEFAULT_OPTIONS.dataset,
            ...{
              title: INDEX_PATTERN_WITH_NO_TIME,
              timeFieldName: undefined,
            },
          };
          cy.core
            .createDataset(resources.workspaceId, resources.dataSourceId, {
              dataset,
            })
            .then((datasetId) => {
              testResources.noTimeDatasetId = datasetId;
              cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
              cy.osd.waitForLoader(true);
              cy.core.waitForDatasetsToLoad();
              cy.wait(5000);
            });
        });
    });
  });

  after(() => {
    cy.core.deleteDataset(testResources.noTimeDatasetId);
    cy.core.deleteDataset(testResources.traceDatasetId);
    cy.core.cleanupTestResources(testResources);
  });

  it('should select index pattern without timefield for PPL', () => {
    cy.core.selectDataset(INDEX_PATTERN_WITH_NO_TIME);
    cy.osd.waitForLoader(true);
    cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('PPL');
    verifyMonacoEditorContent('');
    cy.getElementByTestId('docTableHeaderField').should('not.contain', 'Time');
  });

  it('should select index pattern with timefield for PPL', () => {
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.osd.waitForLoader(true);
    cy.getElementByTestId('queryPanelFooterLanguageToggle').contains('PPL');
    verifyMonacoEditorContent('');

    cy.explore.setTopNavDate(START_TIME, END_TIME);
    cy.osd.waitForLoader(true);
    cy.getElementByTestId('docTableHeaderField').contains('Time');
    cy.verifyHitCount('10,000');
  });

  it('should be able to search datasets', () => {
    cy.getElementByTestId('datasetSelectButton').click({ force: true });
    cy.getElementByTestId('datasetSelectSelectable')
      .get('[placeholder="Search"]')
      .clear()
      .type(INDEX_PATTERN_WITH_NO_TIME);
    cy.getElementByTestId('datasetSelectSelectable')
      .should('be.visible')
      .getElementByTestId(`datasetSelectOption-${INDEX_PATTERN_WITH_NO_TIME}`)
      .should('be.visible');
    cy.getElementByTestId('datasetSelectSelectable')
      .should('be.visible')
      .getElementByTestId(`datasetSelectOption-${INDEX_PATTERN_WITH_TIME}`)
      .should('not.exist');
    cy.getElementByTestId('datasetSelectSelectable').get('[placeholder="Search"]').clear();
    cy.getElementByTestId('datasetSelectSelectable')
      .should('be.visible')
      .getElementByTestId(`datasetSelectOption-${INDEX_PATTERN_WITH_NO_TIME}`)
      .should('be.visible');
    cy.getElementByTestId('datasetSelectSelectable')
      .should('be.visible')
      .getElementByTestId(`datasetSelectOption-${INDEX_PATTERN_WITH_TIME}`)
      .should('be.visible');
  });

  it('should refresh the options if new datasets of any signal type are added', () => {
    const dataset = {
      ...DEFAULT_OPTIONS.dataset,
      ...RESOURCES.DATASETS.OTEL_V1_APM_SPAN,
    };

    cy.core
      .createDataset(testResources.workspaceId, testResources.dataSourceId, {
        dataset,
      })
      .then((datasetId) => {
        testResources.traceDatasetId = datasetId;
        cy.reload();
        cy.osd.waitForLoader(true);
        cy.core.waitForDatasetsToLoad();
        cy.wait(5000);

        cy.getElementByTestId('datasetSelectSelectable')
          .get('[placeholder="Search"]')
          .clear()
          .type(dataset.title);
        cy.getElementByTestId('datasetSelectSelectable')
          .should('be.visible')
          .getElementByTestId(`datasetSelectOption-${dataset.title}`)
          .should('be.visible');
      });
  });
});

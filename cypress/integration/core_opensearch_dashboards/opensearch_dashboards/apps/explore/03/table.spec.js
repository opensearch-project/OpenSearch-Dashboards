/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  INDEX_PATTERN_WITH_TIME_1,
} from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
  generateAllTestConfigurations,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetWithTimeId = getRandomizedDatasetId();

const generateTableTestConfiguration = (dataset, datasetType, language) => {
  const baseConfig = {
    dataset,
    datasetType,
    language: language.name,
    testName: `${language.name}-${datasetType}`,
  };

  return {
    ...baseConfig,
  };
};

export const runTableTests = () => {
  describe('discover table tests', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      // Create workspace and first dataset using our new helper function
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetWithTimeId,
        `${INDEX_WITH_TIME_1}*`, // Uses index pattern with time
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
    });

    afterEach(() => {
      cy.window().then((win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    generateAllTestConfigurations(generateTableTestConfiguration, {
      indexPattern: INDEX_PATTERN_WITH_TIME_1,
      index: INDEX_WITH_TIME_1,
    }).forEach((config) => {
      describe(`${config.testName}`, () => {
        it(`should allow expand multiple documents for ${config.testName}`, () => {
          // Setup
          cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

          setDatePickerDatesAndSearchIfRelevant(config.language);

          // expanding a document in the table
          cy.get('[data-test-subj="docTableExpandToggleColumn"]')
            .find('[type="button"]')
            .eq(2)
            .click();

          // expanding a document in the table
          cy.get('[data-test-subj="docTableExpandToggleColumn"]')
            .find('[type="button"]')
            .eq(3)
            .click();

          // checking the number of exapnded documents visible on screen
          cy.get('[data-test-subj="tableDocViewRow-_index"]').should('have.length', 2);

          cy.get('[data-test-subj="tableDocViewRow-_index"]').should('have.length', 2);
        });
      });
    });
  });
};

prepareTestSuite('Table', runTableTests);

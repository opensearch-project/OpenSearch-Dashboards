/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  WORKSPACE_NAME,
  DATASOURCE_NAME,
  INDEX_NAME,
  INDEX_PATTERN_NAME,
  START_TIME,
  END_TIME,
  DATASET_CONFIGS,
} from '../../../../../utils/apps/constants';
import * as fieldFiltering from '../../../../../integration/core-opensearch-dashboards/opensearch-dashboards/apps/query_enhancements/utils/field_display_filtering.js';
import { SECONDARY_ENGINE, BASE_PATH } from '../../../../../utils/constants';
import { NEW_SEARCH_BUTTON } from '../../../../../utils/dashboards/data_explorer/elements.js';

const randomString = Math.random().toString(36).substring(7);
const workspace = `${WORKSPACE_NAME}-${randomString}`;

describe('filter for value spec', () => {
  before(() => {
    // Load test data
    cy.setupTestData(
      SECONDARY_ENGINE.url,
      ['cypress/fixtures/query_enhancements/data-logs-1/data_logs_small_time_1.mapping.json'],
      ['cypress/fixtures/query_enhancements/data-logs-1/data_logs_small_time_1.data.ndjson']
    );

    // Add data source
    cy.addDataSource({
      name: `${DATASOURCE_NAME}`,
      url: `${SECONDARY_ENGINE.url}`,
      authType: 'no_auth',
    });
    // Create workspace
    cy.deleteWorkspaceByName(`${workspace}`);
    cy.visit('/app/home');
    cy.createInitialWorkspaceWithDataSource(`${DATASOURCE_NAME}`, `${workspace}`);
    cy.wait(2000);
    cy.createWorkspaceIndexPatterns({
      url: `${BASE_PATH}`,
      workspaceName: `${workspace}`,
      indexPattern: INDEX_NAME,
      timefieldName: 'timestamp',
      indexPatternHasTimefield: true,
      dataSource: DATASOURCE_NAME,
      isEnhancement: true,
    });
  });

  beforeEach(() => {
    cy.navigateToWorkSpaceSpecificPage({
      url: BASE_PATH,
      workspaceName: `${workspace}`,
      page: 'discover',
      isEnhancement: true,
    });
    cy.getElementByTestId(NEW_SEARCH_BUTTON).click();
  });

  after(() => {
    cy.deleteWorkspaceByName(`${workspace}`);
    cy.deleteDataSourceByName(`${DATASOURCE_NAME}`);
    // TODO: Modify deleteIndex to handle an array of index and remove hard code
    cy.deleteIndex(INDEX_PATTERN_NAME);
  });
});

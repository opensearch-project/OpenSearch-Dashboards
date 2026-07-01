/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_WITH_TIME_1, DATASOURCE_NAME } from '../../../../../utils/apps/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();
const dashboardName = 'Test Create Panel Dashboard';
const visTitle = 'Test Metric Vis';

export const runDashboardCreatePanelTests = () => {
  describe('Dashboard create panel', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        `${INDEX_WITH_TIME_1}*`,
        'timestamp',
        'logs',
        ['use-case-observability']
      );

      // Create a saved visualization via API within the workspace
      cy.get(`@${workspaceName}:WORKSPACE_ID`).then((workspaceId) => {
        cy.request({
          method: 'POST',
          url: `/w/${workspaceId}/api/saved_objects/visualization`,
          headers: { 'osd-xsrf': 'true' },
          body: {
            attributes: {
              title: visTitle,
              visState: JSON.stringify({
                title: visTitle,
                type: 'metric',
                params: { fontSize: 60 },
                aggs: [{ id: '1', enabled: true, type: 'count', schema: 'metric', params: {} }],
              }),
              uiStateJSON: '{}',
              description: '',
              kibanaSavedObjectMeta: {
                searchSourceJSON: JSON.stringify({
                  index: datasetId,
                  query: { query: '', language: 'kuery' },
                  filter: [],
                }),
              },
            },
          },
        }).then((resp) => {
          expect(resp.status).to.eq(200);
        });
      });
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'dashboards',
        isEnhancement: true,
      });
    });

    afterEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'dashboards',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    it('should create a new dashboard, add a visualization panel, and verify it renders', () => {
      // Intercept save API to verify server-side persistence
      cy.intercept('POST', '**/api/saved_objects/**').as('saveDashboard');

      cy.getElementByTestId('dashboardLandingPage').should('be.visible');

      // Create new dashboard
      cy.getElementByTestId('newItemButton').click();

      // Add panel from library
      cy.getElementByTestId('dashboardAddPanelButton').click();
      cy.getElementByTestId('dashboardAddPanelFromLibrary').click();

      // Search for the saved visualization and verify it appears in results
      cy.getElementByTestId('savedObjectFinderSearchInput').type(visTitle);
      cy.getElementByTestId('savedObjectFinderItemList')
        .find('li')
        .first()
        .should('contain.text', visTitle)
        .click();

      // Close the add panel flyout
      cy.get('body').type('{esc}');

      // Verify panel was added
      cy.getElementByTestId('dashboardPanel').should('have.length', 1);
      cy.getElementByTestId('embeddablePanel').should('be.visible');

      // Save the dashboard
      cy.getElementByTestId('dashboardSaveMenuItem').click();
      cy.getElementByTestId('savedObjectSaveModal').should('be.visible');
      cy.getElementByTestId('savedObjectTitle').clear().type(dashboardName);
      cy.getElementByTestId('savedObjectTitle').should('have.value', dashboardName);
      cy.getElementByTestId('confirmSaveSavedObjectButton').click();

      // Verify save API returned success
      cy.wait('@saveDashboard').its('response.statusCode').should('eq', 200);

      // Verify save success toast includes dashboard name
      cy.getElementByTestId('saveDashboardSuccess').should('be.visible');
      cy.getElementByTestId('saveDashboardSuccess').invoke('text').should('include', dashboardName);
    });
  });
};

prepareTestSuite('Dashboard create panel', runDashboardCreatePanelTests);

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PROMETHEUS_CLUSTER } from '../../../../../../utils/apps/explore/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const typeInQueryEditor = (query, options = {}) => {
  const { parseSpecialCharSequences = true } = options;

  cy.getElementByTestId('exploreQueryPanelEditor')
    .find('.react-monaco-editor-container')
    .should('be.visible')
    .click({ force: true });
  cy.get('.inputarea').first().should('be.visible').and('have.prop', 'ownerDocument');
  cy.wait(100);
  cy.get('.inputarea')
    .first()
    .focus()
    .type('{ctrl}a', { force: true })
    .type('{backspace}', { force: true })
    .type('{meta}a', { force: true })
    .type('{backspace}', { force: true });

  cy.get('.inputarea').first().type(query, {
    force: true,
    delay: 50,
    parseSpecialCharSequences,
  });
};

const executeQuery = () => {
  cy.getElementByTestId('exploreQueryExecutionButton').should('be.visible').click({ force: true });
};

const waitForPrometheusReady = (prometheusUrl, retries = 10, delay = 3000) => {
  const checkReady = (attempt) => {
    cy.request({
      method: 'GET',
      url: `${prometheusUrl}/api/v1/query`,
      qs: { query: 'prometheus_build_info' },
      failOnStatusCode: false,
    }).then((resp) => {
      if (resp.status === 200 && resp.body?.data?.result?.length > 0) {
        cy.log('Prometheus is ready and has metrics available');
      } else if (attempt < retries) {
        cy.log(`Waiting for Prometheus to be ready (attempt ${attempt + 1}/${retries})...`);
        cy.wait(delay).then(() => checkReady(attempt + 1));
      } else {
        cy.log('Warning: Prometheus may not be fully ready, proceeding anyway');
      }
    });
  };

  checkReady(0);
};

const setupPrometheusConnection = (connectionName, prometheusUrl) => {
  const endpoint = Cypress.env('endpoint') || '';

  return cy
    .request({
      method: 'POST',
      url: `${endpoint}/api/directquery/dataconnections`,
      headers: {
        'osd-xsrf': true,
        'content-type': 'application/json',
      },
      body: {
        name: connectionName,
        allowedRoles: [],
        connector: 'prometheus',
        properties: {
          'prometheus.uri': prometheusUrl,
        },
      },
      failOnStatusCode: false,
    })
    .then((resp) => {
      if (resp.status === 200 || resp.status === 409) {
        cy.log(`Prometheus data connection created or already exists`);
      } else {
        cy.log(`Create data connection response: ${JSON.stringify(resp.body)}`);
      }
    });
};

const getPrometheusConnectionId = (connectionName) => {
  const endpoint = Cypress.env('endpoint') || '';

  return cy
    .request({
      method: 'GET',
      url: `${endpoint}/api/saved_objects/_find`,
      headers: { 'osd-xsrf': true },
      qs: { per_page: 10000, type: 'data-connection' },
    })
    .then((resp) => {
      const connection = resp.body?.saved_objects?.find(
        (savedObject) => savedObject.attributes.connectionId === connectionName
      );
      expect(connection).to.exist;
      return connection.id;
    });
};

const createPrometheusWorkspace = (workspaceName, dataConnectionId) => {
  const endpoint = Cypress.env('endpoint') || '';

  return cy
    .request({
      method: 'POST',
      url: `${endpoint}/api/workspaces`,
      headers: { 'osd-xsrf': true },
      body: {
        attributes: {
          name: workspaceName,
          features: ['use-case-observability'],
          description: 'Prometheus integration test workspace',
        },
        settings: {
          dataSources: [],
          dataConnections: [dataConnectionId],
          permissions: {
            library_write: { users: ['%me%'] },
            write: { users: ['%me%'] },
          },
        },
      },
    })
    .then((resp) => {
      if (resp?.body?.success) {
        return resp.body.result.id;
      } else {
        throw new Error(`Create workspace ${workspaceName} failed: ${JSON.stringify(resp)}`);
      }
    });
};

const prometheusDatasetTestSuite = () => {
  let workspaceId = '';
  const prometheusConfig = PROMETHEUS_CLUSTER;
  const definedPrometheusVariables = !prometheusConfig.url;

  (definedPrometheusVariables ? describe.skip : describe)(
    'Prometheus Dataset',
    { defaultCommandTimeout: 600000 },
    () => {
      before(() => {
        setupPrometheusConnection(prometheusConfig.name, prometheusConfig.url);
        waitForPrometheusReady(prometheusConfig.url);
        getPrometheusConnectionId(prometheusConfig.name)
          .then((id) => createPrometheusWorkspace(workspaceName, id))
          .then((id) => {
            workspaceId = id;
          });
      });

      after(() => {
        if (workspaceId) {
          cy.deleteWorkspaceByName(workspaceName);
        }
      });

      describe('Prometheus Connection and Query', () => {
        beforeEach(() => {
          cy.visit(`/w/${workspaceId}/app/explore/metrics`);
        });

        it('should have Prometheus dataset pre-selected and verify PromQL language', function () {
          cy.getElementByTestId('datasetSelectButton')
            .should('be.visible')
            .should('contain.text', prometheusConfig.name);

          cy.get('body').should('contain.text', 'PROMQL');
          cy.getElementByTestId('exploreQueryPanelEditor').should('be.visible');
        });

        it('should validate autocomplete suggestions for PromQL metrics', function () {
          cy.getElementByTestId('exploreQueryPanelEditor')
            .find('.react-monaco-editor-container')
            .should('be.visible')
            .click({ force: true });

          cy.get('.inputarea').first().should('be.visible').focus();
          cy.get('.inputarea').first().type('prom', { force: true, delay: 100 });
          cy.get('.suggest-widget').should('be.visible');

          cy.get('.suggest-widget').within(() => {
            cy.get('.monaco-list-row').should('have.length.at.least', 1);
            cy.get('.monaco-list-row').should('contain.text', 'prometheus');
          });

          cy.get('.inputarea').first().type('{downarrow}{enter}', { force: true });

          cy.getElementByTestId('exploreQueryPanelEditor')
            .find('.view-lines')
            .should('contain.text', 'prometheus');
        });

        it('should validate Table tab displays data grid with columns', function () {
          typeInQueryEditor('prometheus_build_info');
          executeQuery();

          cy.get('[role="tab"]').contains('Table').click();
          cy.get('[role="grid"]').should('be.visible');
          cy.get('[role="columnheader"]').should('have.length.at.least', 1);
          cy.get('[role="gridcell"]').should('contain.text', 'prometheus_build_info');
        });

        it('should validate Raw tab displays metrics in table format', function () {
          typeInQueryEditor('prometheus_build_info');
          executeQuery();

          cy.get('[role="tab"]').contains('Raw').click();

          cy.get('table').should('be.visible');

          cy.get('body').should('contain.text', 'prometheus_build_info');
          cy.get('body').should('contain.text', 'prometheus');

          cy.get('body').should('contain.text', 'Result series:');
        });

        it('should validate Visualization tab displays chart with controls', function () {
          typeInQueryEditor('prometheus_build_info');
          executeQuery();

          cy.get('[role="tab"]').contains('Visualization').click();

          cy.get('body').should('contain.text', 'results in');

          cy.getElementByTestId('dscDownloadCsvButton').should('be.visible');
          cy.getElementByTestId('addToDashboardButton').should('be.visible');

          cy.get('body').should('contain.text', 'Visualization type');
        });

        it('should switch between tabs and maintain data', function () {
          typeInQueryEditor('prometheus_build_info');
          executeQuery();

          cy.get('[role="tab"]').contains('Table').click();
          cy.get('[role="grid"]').should('be.visible');
          cy.get('body').should('contain.text', 'prometheus_build_info');

          cy.get('[role="tab"]').contains('Raw').click();
          cy.get('table').should('be.visible');
          cy.get('body').should('contain.text', 'prometheus_build_info');

          cy.get('[role="tab"]').contains('Visualization').click();
          cy.getElementByTestId('dscDownloadCsvButton').should('be.visible');
          cy.get('body').should('contain.text', 'results in');

          cy.get('[role="tab"]').contains('Table').click();
          cy.get('body').should('contain.text', 'prometheus_build_info');
        });

        it('should add visualization to a new dashboard', function () {
          const dashboardName = 'prometheus-validation-dashboard';
          const exploreName = 'prometheus-build-info-explore';

          typeInQueryEditor('prometheus_build_info');
          executeQuery();

          cy.get('[role="tab"]').contains('Visualization').click();

          cy.get('body').should('contain.text', 'results in');
          cy.getElementByTestId('dscDownloadCsvButton').should('be.visible');

          cy.getElementByTestId('addToDashboardButton').should('be.visible').click();

          cy.getElementByTestId('addToDashboardModalTitle').should('be.visible');

          cy.getElementByTestId('saveToNewDashboardRadio').should('be.visible').click();

          cy.get('input[placeholder="Enter dashboard name"]')
            .should('be.visible')
            .type(dashboardName);

          cy.get('input[placeholder="Enter save search name"]')
            .should('be.visible')
            .type(exploreName);

          cy.getElementByTestId('saveToDashboardConfirmButton').should('be.visible').click();

          cy.getElementByTestId('addToNewDashboardSuccessToast')
            .should('be.visible')
            .contains(`Explore '${exploreName}' is successfully added to the dashboard.`);

          cy.getElementByTestId('addToNewDashboardSuccessToast')
            .contains('View Dashboard')
            .should('have.attr', 'href')
            .then((href) => {
              expect(href).to.include('/app/dashboards#/view/');
              cy.visit(href);
            });

          cy.getElementByTestId('headerAppActionMenu').contains(dashboardName).should('exist');
          cy.getElementByTestId('dashboardPanelTitle').contains(exploreName).should('exist');
        });

        it('should navigate to saved searches and back', function () {
          const searchName = 'prometheus-navigation-test';

          typeInQueryEditor('rate(prometheus_http_requests_total[5m])', {
            parseSpecialCharSequences: false,
          });
          executeQuery();

          cy.getElementByTestId('queryPanelFooterSaveQueryButton').click();
          cy.getElementByTestId('saved-query-management-save-button').click();

          cy.getElementByTestId('saveQueryFormTitle').type(searchName);
          cy.getElementByTestId('savedQueryFormSaveButton').click({ force: true });

          cy.getElementByTestId('euiToastHeader').should('contain.text', 'was saved');

          cy.getElementByTestId('queryPanelFooterSaveQueryButton').click();
          cy.getElementByTestId('saved-query-management-open-button').click();

          cy.get('body').should('contain.text', searchName);
        });

        it('should save and open a discover search using discoverSaveButton and discoverOpenButton', function () {
          const searchName = `prometheus-discover-save-test-${Date.now()}`;

          typeInQueryEditor('prometheus_build_info');
          executeQuery();

          cy.get('body').should('contain.text', 'results in');

          cy.getElementByTestId('discoverSaveButton').should('be.visible').click();
          cy.getElementByTestId('savedObjectTitle').should('be.visible').type(searchName);
          cy.getElementByTestId('confirmSaveSavedObjectButton').should('be.enabled').click();

          cy.getElementByTestId('euiToastHeader').should('contain.text', 'was saved');

          cy.getElementByTestId('discoverNewButton').should('be.visible').click();

          cy.getElementByTestId('discoverOpenButton').should('be.visible').click();
          cy.getElementByTestId('loadSearchForm').should('be.visible');
          cy.getElementByTestId('savedObjectFinderSearchInput').as('searchInput1');
          cy.get('@searchInput1').should('be.visible').click();
          cy.get('@searchInput1').type(searchName, { delay: 50 });

          cy.getElementByTestId('savedObjectFinderItemList')
            .find('.euiListGroupItem__button')
            .contains(searchName)
            .click();

          cy.getElementByTestId('exploreQueryPanelEditor')
            .find('.view-lines')
            .should('contain.text', 'prometheus_build_info');
          cy.get('body').should('contain.text', 'results in');
        });

        it('should open a saved prometheus search from explore/logs and redirect to metrics page', function () {
          const searchName = `prometheus-cross-page-test-${Date.now()}`;

          typeInQueryEditor('prometheus_build_info');
          executeQuery();
          cy.get('body').should('contain.text', 'results in');

          cy.getElementByTestId('discoverSaveButton').should('be.visible').click();
          cy.getElementByTestId('savedObjectTitle').should('be.visible').type(searchName);
          cy.getElementByTestId('confirmSaveSavedObjectButton').should('be.enabled').click();
          cy.getElementByTestId('euiToastHeader').should('contain.text', 'was saved');

          cy.visit(`/w/${workspaceId}/app/explore/logs`);
          cy.getElementByTestId('discoverOpenButton').should('be.visible');
          cy.wait(3000);

          cy.getElementByTestId('discoverOpenButton').should('be.visible').click();
          cy.getElementByTestId('loadSearchForm').should('be.visible');
          cy.getElementByTestId('savedObjectFinderSearchInput').as('searchInput2');
          cy.get('@searchInput2').should('be.visible').click();
          cy.get('@searchInput2').type(searchName, { delay: 50 });

          cy.getElementByTestId('savedObjectFinderItemList')
            .find('.euiListGroupItem__button')
            .contains(searchName)
            .click();

          cy.url().should('include', '/app/explore/metrics');
          cy.getElementByTestId('exploreQueryPanelEditor')
            .find('.view-lines')
            .should('contain.text', 'prometheus_build_info');
          cy.get('body').should('contain.text', 'results in');
        });
      });
    }
  );
};

prepareTestSuite('Prometheus Dataset', prometheusDatasetTestSuite);

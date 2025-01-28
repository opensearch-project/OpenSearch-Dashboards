/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DS_API,
  DSM_API,
  S3_CLUSTER,
} from '../../../../../utils/apps/query_enhancements/constants';
import { getRandomizedWorkspaceName } from '../../../../../utils/apps/query_enhancements/shared';

const workspace = getRandomizedWorkspaceName();

let dataSourceId = '';
const definedS3Variables = !S3_CLUSTER.url;

(definedS3Variables ? describe.skip : describe)(
  'S3 Dataset',
  { defaultCommandTimeout: 120000 },
  () => {
    before(() => {
      cy.request({
        method: 'POST',
        url: `${DSM_API}`,
        headers: {
          'osd-xsrf': true,
        },
        body: {
          dataSourceAttr: {
            endpoint: S3_CLUSTER.url,
            auth: {
              type: 'username_password',
              credentials: {
                username: S3_CLUSTER.username,
                password: S3_CLUSTER.password,
              },
            },
          },
        },
      }).then((metaRes) => {
        if (metaRes && metaRes.body) {
          cy.request({
            method: 'POST',
            url: `${DS_API.CREATE_DATA_SOURCE}`,
            headers: {
              'osd-xsrf': true,
              'Content-Type': 'application/json',
            },
            body: {
              attributes: {
                title: S3_CLUSTER.name,
                description: '',
                ...metaRes.body,
                endpoint: S3_CLUSTER.url,
                auth: {
                  type: 'username_password',
                  credentials: {
                    username: S3_CLUSTER.username,
                    password: S3_CLUSTER.password,
                  },
                },
              },
            },
          }).then((resp) => {
            if (resp && resp.body && resp.body.id) {
              dataSourceId = resp.body.id;
            }
          });
        }
      });
    });

    after(() => {
      cy.request({
        method: 'DELETE',
        url: `${DS_API.DELETE_DATA_SOURCE}${dataSourceId}`,
        body: { force: false },
        headers: {
          'osd-xsrf': true,
        },
      });
    });

    describe('Run S3 Query', () => {
      beforeEach(() => {
        // Create workspace
        cy.deleteWorkspaceByName(workspace);
        cy.visit('/app/home');
        cy.osd.createInitialWorkspaceWithDataSource(S3_CLUSTER.name, WORKSPACE_NAME);
      });
      afterEach(() => {
        cy.deleteWorkspaceByName(workspace);
      });

      it('with SQL', function () {
        cy.getElementByTestId(`datasetSelectorButton`).click();
        cy.getElementByTestId(`datasetSelectorAdvancedButton`).click();

        cy.get(`[title="S3 Connections"]`).click();
        cy.get(`[title="BasicS3Connection"]`).click();
        cy.get(`[title="mys3"]`).click();
        cy.get(`[title="default"]`).click();
        cy.get(`[title="http_logs"]`).click();
        cy.getElementByTestId('datasetSelectorNext').click();
        cy.get(`[class="euiModalHeader__title"]`).should('contain', 'Step 2: Configure data');

        cy.getElementByTestId('advancedSelectorLanguageSelect').select('OpenSearch SQL');
        cy.getElementByTestId('advancedSelectorConfirmButton').click();
        cy.waitForLoader(true);
        cy.waitForSearch();

        cy.getElementByTestId('queryEditorLanguageSelector').should('contain', 'OpenSearch SQL');
        cy.get(`[data-test-subj="queryResultCompleteMsg"]`).should('be.visible');
        cy.getElementByTestId('docTable').should('be.visible');
        cy.getElementByTestId('docTable').find('tr').should('have.length', 11);
      });

      // Skipping until #8922 is merged in
      it.skip('with PPL', function () {
        cy.getElementByTestId(`datasetSelectorButton`).click();
        cy.getElementByTestId(`datasetSelectorAdvancedButton`).click();

        cy.get(`[title="S3 Connections"]`).click();
        cy.get(`[title="BasicS3Connection"]`).click();
        cy.get(`[title="mys3"]`).click();
        cy.get(`[title="default"]`).click();
        cy.get(`[title="http_logs"]`).click();
        cy.getElementByTestId('datasetSelectorNext').click();
        cy.get(`[class="euiModalHeader__title"]`).should('contain', 'Step 2: Configure data');

        cy.getElementByTestId('advancedSelectorLanguageSelect').select('PPL');
        cy.getElementByTestId('advancedSelectorConfirmButton').click();
        cy.waitForLoader(true);
        cy.waitForSearch();

        cy.getElementByTestId('queryEditorLanguageSelector').should('contain', 'PPL');
        cy.get(`[data-test-subj="queryResultCompleteMsg"]`).should('be.visible');
        cy.getElementByTestId('docTable').should('be.visible');
        cy.getElementByTestId('docTable').find('tr').should('have.length', 11);
      });
    });
  }
);

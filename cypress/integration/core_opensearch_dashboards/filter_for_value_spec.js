/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { DataExplorerPage } from '../../utils/data_explorer_page/data_explorer_page';

const miscUtils = new MiscUtils(cy);
const dataExplorerPage = new DataExplorerPage(cy);

describe('filter for value spec', () => {
  before(() => {
    cy.localLogin(Cypress.env('username'), Cypress.env('password'));
    miscUtils.visitPage('app/data-explorer/discover');
  });

  beforeEach(() => {
    dataExplorerPage.clickNewSearchButton();
  });

  it('filter actions in table field', () => {
    dataExplorerPage.selectIndexDataset('OpenSearch SQL');
  });
});

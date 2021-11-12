/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/* es-lint-disable for missing definitions */
/* eslint-disable */
import {
  MiscUtils,
  CommonUI
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const commonUI = new CommonUI(cy);
const miscUtils = new MiscUtils(cy);

describe('verify dashboards filter and query work properly for bwc', () => {
  beforeEach(() => {
    miscUtils.visitPage('app/dashboards#');
  });

  afterEach(() => {
    cy.clearCookies();
  });

  describe('osx filter and query should work in [Logs] Web Traffic dashboards', () => {
    beforeEach(() => {
      cy.get('[data-test-subj="dashboardListingTitleLink-[Logs]-Web-Traffic"]').click();
      cy.get('[data-test-subj="breadcrumb last"]')
        .invoke('attr', 'title')
        .should('eq', '[Logs] Web Traffic');
    });

    it('osx filter and query should exist and be named correctly', () => {
      cy.get('[data-test-subj="saved-query-management-popover-button"]').click();
      cy.get('[data-test-subj="saved-query-management-popover"]')
        .find('[class="osdSavedQueryListItem__labelText"]')
        .should('have.text', 'test-query')
        .click();
      cy.get('[data-test-subj="queryInput"]').should('have.text', 'resp=200');
      cy.get(
        '[data-test-subj="filter filter-enabled filter-key-machine.os filter-value-osx filter-unpinned "]'
      )
        .should('have.text', 'osx filter')
        .click();
      cy.get('[data-test-subj="editFilter"]').click();
      cy.get('[data-test-subj="filterFieldSuggestionList"]')
        .find('[data-test-subj="comboBoxInput"]')
        .should('have.text', 'machine.os');
      cy.get('[data-test-subj="filterOperatorList"]')
        .find('[data-test-subj="comboBoxInput"]')
        .should('have.text', 'is');
      cy.get('[data-test-subj="filterParams"]').find('input').should('have.value', 'osx');
    });

    it('osx filter and query should function correctly', () => {
      commonUI.setDateRange('Oct 10, 2021 @ 00:00:00.000', 'Oct 4, 2021 @ 00:00:00.000');
      cy.get('[data-test-subj="saved-query-management-popover-button"]').click();
      cy.get('[data-test-subj="saved-query-management-popover"]')
        .find('[class="osdSavedQueryListItem__labelText"]')
        .should('have.text', 'test-query')
        .click();
      cy.get('[data-test-subj="dashboardPanel"]').each((item) => {
        const vsLoader = item.get('[data-test-subj="visualizationLoader"]');
        //[Logs] unique visitors should be 211
        if (
          vsLoader &&
          vsLoader
            .get('[data-test-subj="visualizationLoader"]')
            .find('[class="chart-title"]')
            .should('have.text', 'Unique Visitors')
        ) {
          vsLoader.should('have.class', 'chart-label').should('have.text', '211');
        }
        //[Logs] vistor chart should show osx 100%
        if (
          vsLoader &&
          vsLoader.get('[data-test-subj="visualizationLoader"]').invoke('css', 'data-title') ===
            '[Logs] Visitors by OS'
        ) {
          vsLoader.should('have.class', 'label').should('have.text', 'osx (100%)');
        }
        //[Logs] Response chart should show 200 label
        if (
          vsLoader &&
          vsLoader.get('[data-test-subj="visualizationLoader"]').invoke('css', 'data-title') ===
            '[Logs] Response Codes Over Time + Annotations'
        ) {
          vsLoader
            .should('have.class', 'echLegendItem__label echLegendItem__label--clickable')
            .should('have.text', '200');
        }
      });
    });
  });
});
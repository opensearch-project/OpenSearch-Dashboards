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
import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
  
const miscUtils = new MiscUtils(cy);
  
describe('verify default landing page work for bwc', () => {
  beforeEach(() => {
    miscUtils.visitPage('');
  });
  
  it('the overview page is set as the default landing pag', () => {
    cy.url().should('include', '/app/opensearch_dashboards_overview#/');
    cy.contains('Display a different page on log in');
  });
});
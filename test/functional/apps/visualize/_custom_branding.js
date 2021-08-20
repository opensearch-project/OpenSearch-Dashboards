/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */
import expect from '@osd/expect';

export default function ({ getService, getPageObjects }) {
  const browser = getService('browser');
  const globalNav = getService('globalNav');
  const PageObjects = getPageObjects(['common', 'home', 'header']);

  describe('OpenSearch Dashboards branding configuration', function customLogo() {
    this.tags('includeFirefox');
    const expectedUrl = 'https://opensearch.org/assets/brand/SVG/Logo/opensearch_logo_darkmode.svg';
    before(async function () {
      await PageObjects.common.navigateToApp('home');
    });

    it('should show customized logo in Navbar on the main page', async () => {
      await globalNav.logoExistsOrFail(expectedUrl);
    });

    it('should show a customized logo that can take to home page', async () => {
      await PageObjects.common.navigateToApp('settings');
      await globalNav.clickLogo();
      await PageObjects.header.waitUntilLoadingHasFinished();
      const url = await browser.getCurrentUrl();
      expect(url.includes('/app/home')).to.be(true);
    });
  });
}

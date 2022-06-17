/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
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

import expect from '@osd/expect';
import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const browser = getService('browser');
  const globalNav = getService('globalNav');
  const PageObjects = getPageObjects(['common', 'header', 'home']);

  describe('OpenSearch Dashboards takes you home', function describeIndexTests() {
    this.tags('includeFirefox');

    it('clicking on logo should take you to home page', async () => {
      await PageObjects.common.navigateToApp('settings');
      await globalNav.clickLogo();
      await PageObjects.header.waitUntilLoadingHasFinished();
      const url = await browser.getCurrentUrl();
      expect(url.includes('/app/home')).to.be(true);
    });

    it('clicking on home button should take you to home page', async () => {
      await PageObjects.common.navigateToApp('settings');
      await globalNav.clickHomeButton();
      await PageObjects.header.waitUntilLoadingHasFinished();
      const url = await browser.getCurrentUrl();
      expect(url.includes('/app/home')).to.be(true);
    });

    it('clicking on console on homepage should take you to console app', async () => {
      await PageObjects.home.clickSynopsis('console');
      const url = await browser.getCurrentUrl();
      expect(url.includes('/app/dev_tools#/console')).to.be(true);
    });
  });
}

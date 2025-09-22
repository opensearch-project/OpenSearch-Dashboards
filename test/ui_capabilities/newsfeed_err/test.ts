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

import { jestExpect as expect } from '@jest/expect';
import { FtrProviderContext } from '../../functional/ftr_provider_context';

// eslint-disable-next-line import/no-default-export
export default function uiCapabilitiesTests({ getService, getPageObjects }: FtrProviderContext) {
  const globalNav = getService('globalNav');
  const PageObjects = getPageObjects(['common', 'newsfeed']);

  describe('Newsfeed icon button handle errors', function () {
    this.tags('ciGroup6');

    before(async () => {
      await PageObjects.newsfeed.resetPage();
    });

    it('clicking on newsfeed icon should open you empty newsfeed', async () => {
      await globalNav.clickNewsfeed();
      const isOpen = await PageObjects.newsfeed.openNewsfeedPanel();
      expect(isOpen).toBe(true);

      const hasNewsfeedEmptyPanel = await PageObjects.newsfeed.openNewsfeedEmptyPanel();
      expect(hasNewsfeedEmptyPanel).toBe(true);
    });

    it('no red icon', async () => {
      const hasCheckedNews = await PageObjects.newsfeed.getRedButtonSign();
      expect(hasCheckedNews).toBe(false);
    });

    it('shows empty panel due to error response', async () => {
      const objects = await PageObjects.newsfeed.getNewsfeedList();
      expect(objects).toEqual([]);
    });

    it('clicking on newsfeed icon should close opened newsfeed', async () => {
      await globalNav.clickNewsfeed();
      const isOpen = await PageObjects.newsfeed.openNewsfeedPanel();
      expect(isOpen).toBe(false);
    });
  });
}

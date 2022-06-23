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
import { FtrProviderContext } from '../ftr_provider_context';

export function GlobalNavProvider({ getService }: FtrProviderContext) {
  const testSubjects = getService('testSubjects');

  class GlobalNav {
    public async moveMouseToLogo(): Promise<void> {
      await testSubjects.moveMouseTo('headerGlobalNav > logo');
    }

    public async moveMouseToHomeButton(): Promise<void> {
      await testSubjects.moveMouseTo('headerGlobalNav > homeLoader');
    }

    public async clickLogo(): Promise<void> {
      return await testSubjects.click('headerGlobalNav > logo');
    }

    public async clickHomeButton(): Promise<void> {
      return await testSubjects.click('headerGlobalNav > homeLoader');
    }

    public async clickNewsfeed(): Promise<void> {
      return await testSubjects.click('headerGlobalNav > newsfeed');
    }

    public async exists(): Promise<boolean> {
      return await testSubjects.exists('headerGlobalNav');
    }

    public async getFirstBreadcrumb(): Promise<string> {
      return await testSubjects.getVisibleText(
        'headerGlobalNav > breadcrumbs > ~breadcrumb & ~first'
      );
    }

    public async getLastBreadcrumb(): Promise<string> {
      return await testSubjects.getVisibleText(
        'headerGlobalNav > breadcrumbs > ~breadcrumb & ~last'
      );
    }

    public async badgeExistsOrFail(expectedLabel: string): Promise<void> {
      await testSubjects.existOrFail('headerBadge');
      const actualLabel = await testSubjects.getAttribute('headerBadge', 'data-test-badge-label');
      expect(actualLabel.toUpperCase()).to.equal(expectedLabel.toUpperCase());
    }

    public async badgeMissingOrFail(): Promise<void> {
      await testSubjects.missingOrFail('headerBadge');
    }

    public async logoExistsOrFail(expectedUrl: string): Promise<void> {
      await testSubjects.exists('headerGlobalNav > logo > customLogo');
      const actualLabel = await testSubjects.getAttribute(
        'headerGlobalNav > logo > customLogo',
        'data-test-image-url'
      );
      expect(actualLabel.toUpperCase()).to.equal(expectedUrl.toUpperCase());
    }

    public async homeMarkExistsOrFail(expectedUrl: string): Promise<void> {
      await testSubjects.exists('headerGlobalNav > homeLoader > customMark');
      const actualLabel = await testSubjects.getAttribute(
        'headerGlobalNav > homeLoader > customMark',
        'data-test-image-url'
      );
      expect(actualLabel.toUpperCase()).to.equal(expectedUrl.toUpperCase());
    }
  }

  return new GlobalNav();
}

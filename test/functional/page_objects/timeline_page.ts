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

import { FtrProviderContext } from '../ftr_provider_context';

export function TimelinePageProvider({ getService, getPageObjects }: FtrProviderContext) {
  const testSubjects = getService('testSubjects');
  const log = getService('log');
  const PageObjects = getPageObjects(['common', 'header']);
  const opensearchArchiver = getService('opensearchArchiver');
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');

  class TimelinePage {
    public async initTests() {
      await opensearchDashboardsServer.uiSettings.replace({
        defaultIndex: 'logstash-*',
      });

      log.debug('load opensearch-dashboards index');
      await opensearchArchiver.load('timeline');

      await PageObjects.common.navigateToApp('timelion');
    }

    public async setExpression(expression: string) {
      const input = await testSubjects.find('timelineExpressionTextArea');
      await input.clearValue();
      await input.type(expression);
    }

    public async updateExpression(updates: string) {
      const input = await testSubjects.find('timelineExpressionTextArea');
      await input.type(updates);
      await PageObjects.common.sleep(1000);
    }

    public async getExpression() {
      const input = await testSubjects.find('timelineExpressionTextArea');
      return input.getVisibleText();
    }

    public async getSuggestionItemsText() {
      const elements = await testSubjects.findAll('timelineSuggestionListItem');
      return await Promise.all(elements.map(async (element) => await element.getVisibleText()));
    }

    public async clickSuggestion(suggestionIndex = 0, waitTime = 1000) {
      const elements = await testSubjects.findAll('timelineSuggestionListItem');
      if (suggestionIndex > elements.length) {
        throw new Error(
          `Unable to select suggestion ${suggestionIndex}, only ${elements.length} suggestions available.`
        );
      }
      await elements[suggestionIndex].click();
      // Wait for timeline expression to be updated after clicking suggestions
      await PageObjects.common.sleep(waitTime);
    }

    public async saveTimelineSheet() {
      await testSubjects.click('timelineSaveButton');
      await testSubjects.click('timelineSaveAsSheetButton');
      await testSubjects.click('timelineFinishSaveButton');
      await testSubjects.existOrFail('timelineSaveSuccessToast');
      await testSubjects.waitForDeleted('timelineSaveSuccessToast');
    }

    public async expectWriteControls() {
      await testSubjects.existOrFail('timelineSaveButton');
      await testSubjects.existOrFail('timelineDeleteButton');
    }

    public async expectMissingWriteControls() {
      await testSubjects.missingOrFail('timelineSaveButton');
      await testSubjects.missingOrFail('timelineDeleteButton');
    }
  }

  return new TimelinePage();
}

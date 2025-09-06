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
import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ getPageObjects, getService }: FtrProviderContext) {
  const { visualBuilder, timePicker } = getPageObjects(['visualBuilder', 'timePicker']);
  const retry = getService('retry');

  async function cleanupMarkdownData(variableName: 'variable' | 'label', checkedValue: string) {
    await visualBuilder.markdownSwitchSubTab('data');
    await visualBuilder.setMarkdownDataVariable('', variableName);
    await visualBuilder.markdownSwitchSubTab('markdown');
    const rerenderedTable = await visualBuilder.getMarkdownTableVariables();
    rerenderedTable.forEach((row) => {
      if (variableName === 'label') {
        expect(row.key).toContain(checkedValue);
      } else {
        expect(row.key).not.toContain(checkedValue);
      }
    });
  }

  describe('visual builder', function describeIndexTests() {
    describe('markdown', () => {
      before(async () => {
        await visualBuilder.resetPage();
        await visualBuilder.clickMarkdown();
        await timePicker.setAbsoluteRange(
          'Sep 22, 2015 @ 06:00:00.000',
          'Sep 22, 2015 @ 11:00:00.000'
        );
      });

      it('should render subtabs and table variables markdown components', async () => {
        const tabs = await visualBuilder.getSubTabs();
        expect(tabs).toHaveLength(3);

        const variables = await visualBuilder.getMarkdownTableVariables();
        expect(variables).not.toEqual('');
        expect(variables).toHaveLength(5);
      });

      it('should allow printing raw timestamp of data', async () => {
        await visualBuilder.enterMarkdown('{{ count.data.raw.[0].[0] }}');
        const text = await visualBuilder.getMarkdownText();
        expect(text).toBe('1442901600000');
      });

      it('should allow printing raw value of data', async () => {
        await visualBuilder.enterMarkdown('{{ count.data.raw.[0].[1] }}');
        const text = await visualBuilder.getMarkdownText();
        expect(text).toBe('6');
      });

      it('should render html as plain text', async () => {
        const html = '<h1>hello world</h1>';
        await visualBuilder.enterMarkdown(html);
        const markdownText = await visualBuilder.getMarkdownText();
        expect(markdownText).toBe(html);
      });

      it('should render mustache list', async () => {
        const list = '{{#each _all}}\n{{ data.formatted.[0] }} {{ data.raw.[0] }}\n{{/each}}';
        const expectedRenderer = 'Sep 22, 2015 @ 06:00:00.000,6 1442901600000,6';
        await visualBuilder.enterMarkdown(list);
        const markdownText = await visualBuilder.getMarkdownText();
        expect(markdownText).toBe(expectedRenderer);
      });
      it('should render markdown table', async () => {
        const TABLE =
          '| raw | formatted |\n|-|-|\n| {{count.last.raw}} | {{count.last.formatted}} |';
        const DATA = '46';

        await visualBuilder.enterMarkdown(TABLE);
        const text = await visualBuilder.getMarkdownText();
        const tableValues = text.split('\n').map((row) => row.split(' '))[1]; // [46, 46]

        tableValues.forEach((value) => {
          expect(value).toEqual(DATA);
        });
      });

      it('should change variable name', async () => {
        const VARIABLE = 'variable';
        await visualBuilder.markdownSwitchSubTab('data');

        await visualBuilder.setMarkdownDataVariable(VARIABLE, VARIABLE);
        await visualBuilder.markdownSwitchSubTab('markdown');
        const table = await visualBuilder.getMarkdownTableVariables();

        table.forEach((row, index) => {
          // exception: last index for variable is always: {{count.label}}
          if (index === table.length - 1) {
            expect(row.key).not.toContain(VARIABLE);
          } else {
            expect(row.key).not.toContain(VARIABLE);
          }
        });

        await cleanupMarkdownData(VARIABLE, VARIABLE);
      });

      it('series count should be 2 after cloning', async () => {
        await visualBuilder.markdownSwitchSubTab('data');
        await visualBuilder.cloneSeries();

        await retry.try(async function seriesCountCheck() {
          const seriesLength = (await visualBuilder.getSeries()).length;
          expect(seriesLength).toEqual(2);
        });
      });

      it('aggregation count should be 2 after cloning', async () => {
        await visualBuilder.markdownSwitchSubTab('data');
        await visualBuilder.createNewAgg();

        await retry.try(async function aggregationCountCheck() {
          const aggregationLength = await visualBuilder.getAggregationCount();
          expect(aggregationLength).toEqual(2);
        });
      });
    });
  });
}

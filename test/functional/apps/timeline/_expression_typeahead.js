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

export default function ({ getPageObjects }) {
  const PageObjects = getPageObjects(['common', 'timeline', 'settings', 'timePicker']);

  describe('expression typeahead', () => {
    before(async () => {
      await PageObjects.timeline.initTests();
      await PageObjects.timePicker.setDefaultAbsoluteRange();
    });

    it('should display function suggestions filtered by function name', async () => {
      await PageObjects.timeline.setExpression('.es');
      const suggestions = await PageObjects.timeline.getSuggestionItemsText();
      expect(suggestions.length).to.eql(1);
      expect(suggestions[0].includes('.es()')).to.eql(true);
    });

    it('should show argument suggestions when function suggestion is selected', async () => {
      await PageObjects.timeline.setExpression('.es');
      await PageObjects.timeline.clickSuggestion();
      const suggestions = await PageObjects.timeline.getSuggestionItemsText();
      expect(suggestions.length).to.eql(10);
      expect(suggestions[0].includes('fit=')).to.eql(true);
    });

    it('should show argument value suggestions when argument is selected', async () => {
      await PageObjects.timeline.setExpression('.legend');
      await PageObjects.timeline.clickSuggestion();
      const argumentSuggestions = await PageObjects.timeline.getSuggestionItemsText();
      expect(argumentSuggestions.length).to.eql(4);
      expect(argumentSuggestions[1].includes('position=')).to.eql(true);
      await PageObjects.timeline.clickSuggestion(1);
      const valueSuggestions = await PageObjects.timeline.getSuggestionItemsText();
      expect(valueSuggestions.length).to.eql(5);
      expect(valueSuggestions[0].includes('disable legend')).to.eql(true);
      expect(valueSuggestions[1].includes('place legend in north east corner')).to.eql(true);
    });

    // TODO: [RENAMEME] the index is not being loaded with the default data.
    // While navigating creating an index pattern this would works.
    // Need to fix why it's not loading prior to text run.
    xdescribe('dynamic suggestions for argument values', () => {
      describe('.es()', () => {
        before(async () => {
          await PageObjects.timeline.setExpression('.es');
          await PageObjects.timeline.clickSuggestion();
        });

        it('should show index pattern suggestions for index argument', async () => {
          await PageObjects.timeline.updateExpression('index');
          await PageObjects.timeline.clickSuggestion();
          const suggestions = await PageObjects.timeline.getSuggestionItemsText();
          expect(suggestions.length).to.eql(1);
          expect(suggestions[0].includes('logstash-*')).to.eql(true);
          await PageObjects.timeline.clickSuggestion();
        });

        it('should show field suggestions for timefield argument when index pattern set', async () => {
          await PageObjects.timeline.updateExpression(',timefield');
          await PageObjects.timeline.clickSuggestion();
          const suggestions = await PageObjects.timeline.getSuggestionItemsText();
          expect(suggestions.length).to.eql(4);
          expect(suggestions[0].includes('@timestamp')).to.eql(true);
          await PageObjects.timeline.clickSuggestion();
        });

        it('should show field suggestions for split argument when index pattern set', async () => {
          await PageObjects.timeline.updateExpression(',split');
          await PageObjects.timeline.clickSuggestion();
          const suggestions = await PageObjects.timeline.getSuggestionItemsText();
          expect(suggestions.length).to.eql(52);
          expect(suggestions[0].includes('@message.raw')).to.eql(true);
          await PageObjects.timeline.clickSuggestion(10);
        });

        it('should show field suggestions for metric argument when index pattern set', async () => {
          await PageObjects.timeline.updateExpression(',metric');
          await PageObjects.timeline.clickSuggestion();
          await PageObjects.timeline.updateExpression('avg:');
          await PageObjects.timeline.clickSuggestion();
          const suggestions = await PageObjects.timeline.getSuggestionItemsText();
          expect(suggestions.length).to.eql(2);
          expect(suggestions[0].includes('avg:bytes')).to.eql(true);
        });
      });
    });
  });
}

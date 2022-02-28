/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from '@osd/expect';
import { VISUALIZE_AGG_AMOUNTS } from '../../../../src/plugins/visualizations/common/constants';

export default function ({ getService, getPageObjects }) {
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');
  const testSubjects = getService('testSubjects');
  const browser = getService('browser');
  const PageObjects = getPageObjects(['common', 'visualize', 'visEditor', 'settings', 'header']);

  describe('self changing vis', function describeIndexTests() {
    let indexPatternSelector;
    let addButtonSelector;
    let splitRowsAggragationSelector;

    before(async () => {
      await PageObjects.visualize.navigateToNewVisualization();
      await PageObjects.visualize.clickVisType('table');

      indexPatternSelector = await testSubjects.find('savedObjectTitlelogstash*');
    });

    it('should allow adding settings ${num} levels of bucket aggregation', async () => {
      await indexPatternSelector.click();
      addButtonSelector = await testSubjects.find('visEditorAdd_buckets');
      await addButtonSelector.click();
      splitRowsAggragationSelector = await testSubjects.find('visEditorAdd_buckets_Split rows');
      await splitRowsAggragationSelector.click();
      await PageObjects.visEditor.selectAggregation('Geohash');
      await addButtonSelector.click();
      await splitRowsAggragationSelector.click();
      await PageObjects.visEditor.selectAggregation('Geohash');
      await addButtonSelector.click();

      expect(await splitRowsAggragationSelector.getAttribute('disabled')).to.not.equal('true');

      await opensearchDashboardsServer.uiSettings.update({
        [VISUALIZE_AGG_AMOUNTS]: JSON.stringify({ table: { bucket: { max: 1 } } }),
      });
      await browser.refresh();
      await addButtonSelector.click();
      await splitRowsAggragationSelector.click();
      await PageObjects.visEditor.selectAggregation('Geohash');
      await addButtonSelector.click();

      expect(await splitRowsAggragationSelector.getAttribute('disabled')).to.equal('true');
    });
  });
}

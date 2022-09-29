/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from '@osd/expect';
import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const PageObjects = getPageObjects(['visualize', 'wizard', 'visChart']);
  const testSubjects = getService('testSubjects');
  const log = getService('log');
  const retry = getService('retry');

  describe('Basic tests for wizard app ', function () {
    before(async () => {
      log.debug('navigateToApp wizard');
      await PageObjects.wizard.navigateToCreateWizard();
    });

    it('should be able to switch data sources', async () => {
      const dataSourceValue = await PageObjects.wizard.selectDataSource(
        PageObjects.wizard.index.LOGSTASH_NON_TIME_BASED
      );

      expect(dataSourceValue).to.equal(PageObjects.wizard.index.LOGSTASH_NON_TIME_BASED);
      // TODO: Switch with a datasource with unique fields to test if it exists
    });

    it('should show visualization when a field is added', async () => {
      const expectedData = [2904, 2858, 2814, 2784, 1322];
      await PageObjects.wizard.addField('metric', 'Count');
      await PageObjects.wizard.addField('segment', 'Terms', 'machine.os.raw');

      const data = await PageObjects.visChart.getBarChartData();
      expect(data).to.eql(expectedData);
    });

    it('should clear visualization when field is deleted', async () => {
      await PageObjects.wizard.removeField('metric', 0);

      const isEmptyWorkspace = await PageObjects.wizard.isEmptyWorkspace();
      expect(isEmptyWorkspace).to.be(true);
    });

    it('should show warning before changing visualization type', async () => {
      await PageObjects.wizard.selectVisType('metric', false);
      const confirmModalExists = await testSubjects.exists('confirmVisChangeModal');
      expect(confirmModalExists).to.be(true);

      await testSubjects.click('confirmModalCancelButton');
    });

    it('should change visualization type', async () => {
      const pickerValue = await PageObjects.wizard.selectVisType('metric');

      expect(pickerValue).to.eql('Metric');
    });
  });
}

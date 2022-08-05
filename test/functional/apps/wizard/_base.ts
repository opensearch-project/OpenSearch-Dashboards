/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from '@osd/expect';
import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const PageObjects = getPageObjects(['visualize', 'wizard']);
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
      await PageObjects.wizard.addField('metric', 'Average', 'machine.ram');
      const avgMachineRam = ['13,104,036,080.615', 'Average machine.ram'];

      await retry.try(async function tryingForTime() {
        const metricValue = await PageObjects.wizard.getMetric();
        expect(avgMachineRam).to.eql(metricValue);
      });
    });

    it('should clear visualization when field is deleted', async () => {
      await PageObjects.wizard.removeField('metric', 0);

      await retry.try(async function tryingForTime() {
        const isEmptyWorkspace = await PageObjects.wizard.isEmptyWorkspace();
        expect(isEmptyWorkspace).to.be(true);
      });
    });
  });
}

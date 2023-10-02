/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from '@osd/expect';
import { FtrProviderContext } from '../../ftr_provider_context';

// TODO: Remove selenium functional tests since cypress tests exist
export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const PageObjects = getPageObjects(['visualize', 'visBuilder', 'visChart']);
  const log = getService('log');

  describe('Basic tests for visBuilder app ', function () {
    before(async () => {
      log.debug('navigateToApp visBuilder');
      await PageObjects.visBuilder.navigateToCreateVisBuilder();
    });

    it('should be able to switch data sources', async () => {
      const dataSourceValue = await PageObjects.visBuilder.selectDataSource(
        PageObjects.visBuilder.index.LOGSTASH_NON_TIME_BASED
      );

      expect(dataSourceValue).to.equal(PageObjects.visBuilder.index.LOGSTASH_NON_TIME_BASED);
      // TODO: Switch with a datasource with unique fields to test if it exists
    });

    it('should show visualization when a field is added', async () => {
      const expectedData = [2904, 2858, 2814, 2784, 1322];
      await PageObjects.visBuilder.addField('metric', 'Count');
      await PageObjects.visBuilder.addField('segment', 'Terms', 'machine.os.raw');

      const data = await PageObjects.visChart.getBarChartData();
      expect(data).to.eql(expectedData);
    });

    it('should clear visualization when field is deleted', async () => {
      await PageObjects.visBuilder.removeField('metric', 0);

      const isEmptyWorkspace = await PageObjects.visBuilder.isEmptyWorkspace();
      expect(isEmptyWorkspace).to.be(true);
    });
  });
}

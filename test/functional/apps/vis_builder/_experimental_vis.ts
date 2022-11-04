/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from '@osd/expect';
import { VISUALIZE_ENABLE_LABS_SETTING } from '../../../../src/plugins/visualizations/common/constants';
import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const PageObjects = getPageObjects(['visualize', 'visBuilder']);
  const log = getService('log');
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');

  describe('experimental settings for visBuilder app ', function () {
    it('should show an notification when creating visBuilder visualization', async () => {
      log.debug('navigateToApp visualize');
      await PageObjects.visualize.navigateToNewVisualization();
      await PageObjects.visualize.waitForVisualizationSelectPage();

      // Try to find the visBuilder Vis type.
      const visBuilderVisTypeExists = await PageObjects.visualize.hasVisType('vis-builder');
      expect(visBuilderVisTypeExists).to.be(true);

      // Create a new visualization
      await PageObjects.visualize.clickVisType('vis-builder');

      // Check that the experimental banner is there and state that this is experimental
      const info = await PageObjects.visBuilder.getExperimentalInfo();
      expect(await info.getVisibleText()).to.contain('experimental');
    });

    it('should not be available in the picker when disabled', async () => {
      log.debug('navigateToApp visualize');
      await opensearchDashboardsServer.uiSettings.replace({
        [VISUALIZE_ENABLE_LABS_SETTING]: false,
      });
      await PageObjects.visualize.navigateToNewVisualization();
      await PageObjects.visualize.waitForVisualizationSelectPage();

      // Try to find the visBuilder Vis type.
      const visBuilderVisTypeExists = await PageObjects.visualize.hasVisType('vis-builder');
      expect(visBuilderVisTypeExists).to.be(false);
    });

    after(async () => {
      // unset the experimental ui setting
      await opensearchDashboardsServer.uiSettings.unset(VISUALIZE_ENABLE_LABS_SETTING);
    });
  });
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FtrProviderContext } from '../../ftr_provider_context';
import { UI_SETTINGS } from '../../../../src/plugins/data/common';

export default function ({ getService, loadTestFile }: FtrProviderContext) {
  const browser = getService('browser');
  const log = getService('log');
  const opensearchArchiver = getService('opensearchArchiver');
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');

  describe('visBuilder app', function () {
    this.tags('ciGroup13');

    before(async function () {
      log.debug('Starting visBuilder before method');
      await browser.setWindowSize(1280, 800);
      await opensearchArchiver.loadIfNeeded('logstash_functional');
      await opensearchArchiver.loadIfNeeded('long_window_logstash');
      await opensearchArchiver.loadIfNeeded('visualize');
      await opensearchDashboardsServer.uiSettings.replace({
        defaultIndex: 'logstash-*',
        [UI_SETTINGS.FORMAT_BYTES_DEFAULT_PATTERN]: '0,0.[000]b',
      });
    });

    after(async () => {
      await opensearchArchiver.unload('logstash_functional');
      await opensearchArchiver.unload('long_window_logstash');
      await opensearchArchiver.unload('visualize');
    });

    loadTestFile(require.resolve('./_base'));
    loadTestFile(require.resolve('./_experimental_vis'));
  });
}

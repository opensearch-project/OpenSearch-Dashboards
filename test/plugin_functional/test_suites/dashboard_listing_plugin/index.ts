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

export default function ({ getService, loadTestFile }) {
  const browser = getService('browser');
  const opensearchArchiver = getService('opensearchArchiver');

  async function loadLogstash() {
    await browser.setWindowSize(1200, 900);
    await opensearchArchiver.loadIfNeeded(
      '../functional/fixtures/opensearch_archiver/logstash_functional'
    );
  }

  async function unloadLogstash() {
    await opensearchArchiver.unload(
      '../functional/fixtures/opensearch_archiver/logstash_functional'
    );
  }

  describe('dashboard listing plugin', () => {
    before(loadLogstash);
    after(unloadLogstash);

    loadTestFile(require.resolve('./dashboard_listing_plugin'));
  });
}

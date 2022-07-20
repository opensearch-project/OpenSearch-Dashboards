/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginFunctionalProviderContext } from '../../services';

export default function ({ getService, loadTestFile }: PluginFunctionalProviderContext) {
  const opensearchArchiver = getService('opensearchArchiver');

  describe('doc views links', function () {
    before(async () => {
      await opensearchArchiver.loadIfNeeded('../functional/fixtures/opensearch_archiver/discover');
    });

    loadTestFile(require.resolve('./doc_views_links'));
  });
}

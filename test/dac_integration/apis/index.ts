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

import { FtrProviderContext } from '../ftr_provider_context';

export default function ({ loadTestFile }: FtrProviderContext) {
  describe('Dashboards-as-Code APIs', () => {
    loadTestFile(require.resolve('./validate'));
    loadTestFile(require.resolve('./diff'));
    loadTestFile(require.resolve('./bulk_apply'));
    loadTestFile(require.resolve('./export_clean'));
    loadTestFile(require.resolve('./schemas'));
    loadTestFile(require.resolve('./end_to_end'));
  });
}

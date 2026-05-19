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

// FTR config for DaC integration tests
export default async function ({ readConfigFile }: { readConfigFile: Function }) {
  const apiConfig = await readConfigFile(require.resolve('../api_integration/config'));
  return {
    ...apiConfig.getAll(),
    testFiles: [require.resolve('./apis')],
    junit: {
      reportName: 'Dashboards-as-Code Integration Tests',
    },
  };
}

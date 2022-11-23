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

import inquirer from 'inquirer';

import { Extension } from './load_opensearch_dashboards_platform_extension';

export async function resolveOpenSearchDashboardsVersion(
  option: string | undefined,
  extension: Extension
) {
  const preselectedVersion =
    option || extension.manifest.opensearchDashboardsVersion || extension.manifest.version;

  if (preselectedVersion && preselectedVersion !== 'opensearchDashboards') {
    return preselectedVersion;
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'opensearchDashboardsVersion',
      message: 'What version of OpenSearch Dashboards are you building for?',
    },
  ]);

  return answers.opensearchDashboardsVersion;
}

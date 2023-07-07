/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ManagementOverViewPlugin } from './plugin';

export { OverviewApp } from './overview_app';
export { ManagementOverViewPluginSetup, ManagementOverViewPluginStart } from './plugin';

export const plugin = () => new ManagementOverViewPlugin();

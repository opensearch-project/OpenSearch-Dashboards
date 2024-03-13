/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApplicationConfigPluginSetup } from '../../application_config/server';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CspHandlerPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CspHandlerPluginStart {}

export interface AppPluginSetupDependencies {
  applicationConfig: ApplicationConfigPluginSetup;
}

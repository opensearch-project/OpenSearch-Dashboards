/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../core/public';
import { WizardPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin(initializerContext: PluginInitializerContext) {
  return new WizardPlugin(initializerContext);
}
export { WizardServices, WizardPluginStartDependencies, WizardStart } from './types';

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Management Plugin - public
 *
 * This is the entry point for the entire client-side public contract of the plugin.
 * If something is not explicitly exported here, you can safely assume it is private
 * to the plugin and not considered stable.
 *
 * All stateful contracts will be injected by the platform at runtime, and are defined
 * in the setup/start interfaces in `plugin.ts`. The remaining items exported here are
 * either types, or static code.
 */
import { PluginInitializerContext } from 'src/core/public';
import { DatasetManagementPlugin } from './plugin';
export { DatasetManagementSetup, DatasetManagementStart } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  // @ts-expect-error TS2554 TODO(ts-error): fixme
  return new DatasetManagementPlugin(initializerContext);
}

export { DatasetCreationConfig, DatasetCreationOption, DatasetListConfig } from './service';

export { DefaultFormatEditor } from './components/field_editor/components/field_format_editor';

export { MlCardState, DatasetTableColumn, DatasetTableRecord } from './types';

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

import { ToolingLog } from '@osd/dev-utils';

import { Extension } from './load_opensearch_dashboards_platform_extension';
import { Config } from './config';

export interface BuildContext {
  log: ToolingLog;
  extension: Extension;
  config: Config;
  sourceDir: string;
  buildDir: string;
  opensearchDashboardsVersion: string;
}

export interface VersionContext {
  log: ToolingLog;
  sourceDir: string;
  extensionVersion?: string;
  compatibilityVersion?: string;
}

interface NestedObject {
  [key: string]: NestedObject | string | undefined;
}

export interface FileUpdateContext {
  log: ToolingLog;
  file: string;
  updates: NestedObject;
}

export interface ObjectUpdateContext {
  original: { [key: string]: any };
  updates: NestedObject;
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from 'opensearch-dashboards/public';
import { ViewService } from './services/view_service';

export interface DataExplorerPluginSetup {
  registerView: ViewService['registerView'];
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataExplorerPluginStart {}

export interface ViewRedirectParams {
  view: string;
  path?: string;
}

export interface DataExplorerServices extends CoreStart {
  viewRegistry: ReturnType<ViewService['start']>;
}

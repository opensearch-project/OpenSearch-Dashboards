/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from 'opensearch-dashboards/public';
import { ViewService } from './services/view_service';
import { DataPublicPluginStart } from '../../data/public';

export interface DataExplorerPluginSetup {
  registerView: ViewService['registerView'];
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataExplorerPluginStart {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataExplorerPluginSetupDependencies {}
export interface DataExplorerPluginStartDependencies {
  data: DataPublicPluginStart;
}

export interface ViewRedirectParams {
  view: string;
  path?: string;
}

export interface DataExplorerServices extends CoreStart {
  viewRegistry: ReturnType<ViewService['start']>;
}

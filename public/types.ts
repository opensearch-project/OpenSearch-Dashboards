/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup } from 'opensearch-dashboards/public';
import { Observable } from 'rxjs';
import { DataPublicPluginSetup, DataPublicPluginStart } from 'src/plugins/data/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueryEnhancementsPluginSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueryEnhancementsPluginStart {}

export interface QueryEnhancementsPluginSetupDependencies {
  data: DataPublicPluginSetup;
}

export interface QueryEnhancementsPluginStartDependencies {
  data: DataPublicPluginStart;
}

export interface Connection {
  id: string;
  title: string;
  endpoint?: string;
  installedPlugins?: string[];
  auth?: any;
}
export interface ConnectionsServiceDeps {
  http: CoreSetup['http'];
}
export interface IConnectionsServiceSetup {
  setSelectedConnection: (connection: Connection | undefined) => void;
  getSelectedConnection: () => Observable<Connection | undefined>;
  getConnections: () => Promise<Observable<Connection[]>>;
  getConnectionById: (id: string) => Promise<Observable<Connection>>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IConnectionsServiceStart {}

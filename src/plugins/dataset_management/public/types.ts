/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChromeStart,
  ApplicationStart,
  IUiSettingsClient,
  OverlayStart,
  SavedObjectsStart,
  NotificationsStart,
  DocLinksStart,
  HttpSetup,
  SavedObjectReference,
  WorkspacesStart,
} from 'src/core/public';
import { DataPublicPluginStart } from 'src/plugins/data/public';
import { NavigationPublicPluginStart } from 'src/plugins/navigation/public';
import { EuiTableFieldDataColumnType } from '@elastic/eui';
import { ManagementAppMountParams } from '../../management/public';
import { DatasetManagementStart } from './index';
import { OpenSearchDashboardsReactContextValue } from '../../opensearch_dashboards_react/public';
import { DataSourceTableItem } from './components/create_dataset_wizard/types';

export interface DatasetManagmentContext {
  chrome: ChromeStart;
  application: ApplicationStart;
  savedObjects: SavedObjectsStart;
  uiSettings: IUiSettingsClient;
  navigationUI: NavigationPublicPluginStart['ui'];
  notifications: NotificationsStart;
  overlays: OverlayStart;
  http: HttpSetup;
  docLinks: DocLinksStart;
  data: DataPublicPluginStart;
  datasetManagementStart: DatasetManagementStart;
  setBreadcrumbs: ManagementAppMountParams['setBreadcrumbs'];
  getMlCardState: () => MlCardState;
  dataSourceEnabled: boolean;
  hideLocalCluster: boolean;
  workspaces: WorkspacesStart;
}

export type DatasetManagmentContextValue = OpenSearchDashboardsReactContextValue<
  DatasetManagmentContext
>;

export enum MlCardState {
  HIDDEN,
  DISABLED,
  ENABLED,
}

export type DataSourceRef = { title: string; relatedConnections?: DataSourceTableItem[] } & Pick<
  SavedObjectReference,
  'type' | 'id'
>;

export interface DatasetTableRecord {
  type: string;
  id: string;
  referenceId?: string;
}

export interface DatasetTableColumn<T> {
  id: string;
  euiColumn: Omit<EuiTableFieldDataColumnType<DatasetTableRecord>, 'sortable'>;
  data?: T;
  loadData: () => Promise<T>;
}

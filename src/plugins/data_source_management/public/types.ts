import {
  ChromeStart,
  ApplicationStart,
  IUiSettingsClient,
  OverlayStart,
  SavedObjectsStart,
  NotificationsStart,
  DocLinksStart,
  HttpSetup,
} from 'src/core/public';
import { DataPublicPluginStart } from 'src/plugins/data/public';
import { ManagementAppMountParams } from '../../management/public';
// import { NavigationPublicPluginStart } from '../../navigation/public';
import {
  OpenSearchDashboardsReactContext,
  OpenSearchDashboardsReactContextValue,
} from '../../opensearch_dashboards_react/public';
import { DataSourceManagementStart } from './index';

export interface DataSourceManagementPluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataSourceManagementPluginStart {}

// export interface AppPluginStartDependencies {
//   navigation: NavigationPublicPluginStart;
// }

export interface DataSourceManagmentContext {
  chrome: ChromeStart;
  application: ApplicationStart;
  savedObjects: SavedObjectsStart;
  uiSettings: IUiSettingsClient;
  notifications: NotificationsStart;
  overlays: OverlayStart;
  http: HttpSetup;
  docLinks: DocLinksStart;
  data: DataPublicPluginStart;
  dataSourceManagementStart: DataSourceManagementStart;
  setBreadcrumbs: ManagementAppMountParams['setBreadcrumbs'];
  // getMlCardState: () => MlCardState;
}

export type DataSourceManagmentContextValue = OpenSearchDashboardsReactContextValue<
  DataSourceManagmentContext
>;

export enum MlCardState {
  HIDDEN,
  DISABLED,
  ENABLED,
}

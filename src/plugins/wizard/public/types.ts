/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsStart } from 'src/plugins/saved_objects/public';
import { AppMountParameters, CoreStart, ToastsStart } from 'opensearch-dashboards/public';
import { EmbeddableSetup } from 'src/plugins/embeddable/public';
import { DashboardStart } from 'src/plugins/dashboard/public';
import { NavigationPublicPluginStart } from '../../navigation/public';
import { DataPublicPluginStart } from '../../data/public';

export interface WizardPluginSetupDependencies {
  embeddable: EmbeddableSetup;
}
export interface WizardPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
  savedObjects: SavedObjectsStart;
  dashboard: DashboardStart;
}

export interface WizardServices extends CoreStart {
  setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
  toastNotifications: ToastsStart;
  savedObjectsPublic: SavedObjectsStart;
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
}

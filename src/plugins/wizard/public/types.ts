/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsStart } from 'src/plugins/saved_objects/public';
import { AppMountParameters, CoreStart, ToastsStart } from 'opensearch-dashboards/public';
import { EmbeddableSetup } from 'src/plugins/embeddable/public';
import { DashboardStart } from 'src/plugins/dashboard/public';
import { VisualizationsSetup } from 'src/plugins/visualizations/public';
import { ExpressionsStart } from 'src/plugins/expressions/public';
import { NavigationPublicPluginStart } from '../../navigation/public';
import { DataPublicPluginStart } from '../../data/public';
import { TypeServiceSetup, TypeServiceStart } from './services/type_service';

export type WizardSetup = TypeServiceSetup;

export interface WizardPluginSetupDependencies {
  embeddable: EmbeddableSetup;
  visualizations: VisualizationsSetup;
}
export interface WizardPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
  savedObjects: SavedObjectsStart;
  dashboard: DashboardStart;
  expressions: ExpressionsStart;
}

export interface WizardServices extends CoreStart {
  setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
  toastNotifications: ToastsStart;
  savedObjectsPublic: SavedObjectsStart;
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
  types: TypeServiceStart;
  expressions: ExpressionsStart;
}

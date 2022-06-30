/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsStart } from '../../saved_objects/public';
import { EmbeddableSetup } from '../../embeddable/public';
import { DashboardStart } from '../../dashboard/public';
import { VisualizationsSetup } from '../../visualizations/public';
import { ExpressionsStart } from '../../expressions/public';
import { NavigationPublicPluginStart } from '../../navigation/public';
import { DataPublicPluginStart } from '../../data/public';
import { TypeServiceSetup, TypeServiceStart } from './services/type_service';
import { SavedObjectLoader } from '../../saved_objects/public';
import { AppMountParameters, CoreStart, ToastsStart } from '../../../core/public';

export type WizardSetup = TypeServiceSetup;
export interface WizardStart extends TypeServiceStart {
  savedWizardLoader: SavedObjectLoader;
}

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

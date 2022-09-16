/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { History } from 'history';
import { SavedObject, SavedObjectsStart } from '../../saved_objects/public';
import { EmbeddableSetup, EmbeddableStart } from '../../embeddable/public';
import { DashboardStart } from '../../dashboard/public';
import { VisualizationsSetup } from '../../visualizations/public';
import { ExpressionsStart } from '../../expressions/public';
import { NavigationPublicPluginStart } from '../../navigation/public';
import { DataPublicPluginStart } from '../../data/public';
import { TypeServiceSetup, TypeServiceStart } from './services/type_service';
import { SavedObjectLoader } from '../../saved_objects/public';
import { AppMountParameters, CoreStart, ToastsStart, ScopedHistory } from '../../../core/public';

export type WizardSetup = TypeServiceSetup;
export interface WizardStart extends TypeServiceStart {
  savedWizardLoader: SavedObjectLoader;
}

export interface WizardPluginSetupDependencies {
  embeddable: EmbeddableSetup;
  visualizations: VisualizationsSetup;
}
export interface WizardPluginStartDependencies {
  embeddable: EmbeddableStart;
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
  savedObjects: SavedObjectsStart;
  dashboard: DashboardStart;
  expressions: ExpressionsStart;
}

export interface WizardServices extends CoreStart {
  setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
  savedWizardLoader: WizardStart['savedWizardLoader'];
  toastNotifications: ToastsStart;
  savedObjectsPublic: SavedObjectsStart;
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
  types: TypeServiceStart;
  expressions: ExpressionsStart;
  history: History;
  embeddable: EmbeddableStart;
  scopedHistory: ScopedHistory;
}

export interface ISavedVis {
  id?: string;
  title: string;
  description?: string;
  visualizationState?: string;
  styleState?: string;
  version?: number;
}

export interface WizardVisSavedObject extends SavedObject, ISavedVis {}

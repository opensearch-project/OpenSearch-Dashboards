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
import { DataPublicPluginSetup, DataPublicPluginStart } from '../../data/public';
import { TypeServiceSetup, TypeServiceStart } from './services/type_service';
import { SavedObjectLoader } from '../../saved_objects/public';
import { AppMountParameters, CoreStart, ToastsStart, ScopedHistory } from '../../../core/public';
import { UiActionsStart } from '../../ui_actions/public';
import { DataExplorerPluginSetup, DataExplorerServices } from '../../data_explorer/public';

export type VisBuilderSetup = TypeServiceSetup;
export interface VisBuilderStart extends TypeServiceStart {
  savedVisBuilderLoader: SavedObjectLoader;
}

export interface VisBuilderPluginSetupDependencies {
  embeddable: EmbeddableSetup;
  visualizations: VisualizationsSetup;
  data: DataPublicPluginSetup;
  dataExplorer: DataExplorerPluginSetup;
}
export interface VisBuilderPluginStartDependencies {
  embeddable: EmbeddableStart;
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
  savedObjects: SavedObjectsStart;
  dashboard: DashboardStart;
  expressions: ExpressionsStart;
  uiActions: UiActionsStart;
}

export interface VisBuilderServices extends CoreStart {
  appName: string;
  savedVisBuilderLoader: VisBuilderStart['savedVisBuilderLoader'];
  toastNotifications: ToastsStart;
  savedObjectsPublic: SavedObjectsStart;
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
  types: TypeServiceStart;
  expressions: ExpressionsStart;
  // history: History;
  embeddable: EmbeddableStart;
  scopedHistory: ScopedHistory;
  dashboard: DashboardStart;
  uiActions: UiActionsStart;
}

export interface ISavedVis {
  id?: string;
  title: string;
  description?: string;
  visualizationState?: string;
  styleState?: string;
  uiState?: string;
  version?: number;
}

export interface VisBuilderSavedObject extends SavedObject, ISavedVis {}
// Any component inside the panel and canvas views has access to both these services.
export type VisBuilderViewServices = VisBuilderServices & DataExplorerServices;

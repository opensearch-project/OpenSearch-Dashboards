/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGetterSetter } from '../../opensearch_dashboards_utils/public';
import { IUiSettingsClient } from '../../../core/public';
import { SavedObjectLoaderAugmentVis } from './saved_augment_vis';
import { EmbeddableStart } from '../../embeddable/public';
import { UiActionsStart } from '../../ui_actions/public';
import { DataPublicPluginStart } from '../../../plugins/data/public';
import { VisualizationsStart } from '../../visualizations/public';
import { CoreStart } from '../../../core/public';

export const [getSavedAugmentVisLoader, setSavedAugmentVisLoader] = createGetterSetter<
  SavedObjectLoaderAugmentVis
>('savedAugmentVisLoader');

export const [getUISettings, setUISettings] = createGetterSetter<IUiSettingsClient>('UISettings');

export const [getUiActions, setUiActions] = createGetterSetter<UiActionsStart>('UIActions');

export const [getEmbeddable, setEmbeddable] = createGetterSetter<EmbeddableStart>('embeddable');

export const [getQueryService, setQueryService] = createGetterSetter<
  DataPublicPluginStart['query']
>('Query');

export const [getVisualizations, setVisualizations] = createGetterSetter<VisualizationsStart>(
  'visualizations'
);

export const [getCore, setCore] = createGetterSetter<CoreStart>('Core');

// This is primarily used for mocking this module and each of its fns in tests.
// eslint-disable-next-line import/no-default-export
export default {
  getSavedAugmentVisLoader,
  getUISettings,
  getUiActions,
  getEmbeddable,
  getQueryService,
  getVisualizations,
  getCore,
};

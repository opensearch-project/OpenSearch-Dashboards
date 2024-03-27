/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { createHashHistory } from 'history';
import { createGetterSetter } from '../../opensearch_dashboards_utils/common';
import { DataPublicPluginStart, TimefilterContract } from '../../data/public';
import { SavedVisBuilderLoader } from './saved_visualizations';
import { HttpStart, IUiSettingsClient, AppMountParameters } from '../../../core/public';
import { ExpressionsStart } from '../../expressions/public';
import { TypeServiceStart } from './services/type_service';
import { UiActionsStart } from '../../ui_actions/public';
import { VisBuilderServices } from './types';

let visBuilderServices: VisBuilderServices | null = null;

export const getHistory = _.once(() => createHashHistory());
export const syncHistoryLocations = () => {
  const h = getHistory();
  Object.assign(h.location, createHashHistory().location);
  return h;
};

export function getVisBuilderServices(): VisBuilderServices {
  if (!visBuilderServices) {
    throw new Error('VisBuilder services have not been initialized.');
  }
  return visBuilderServices;
}

export function setVisBuilderServices(newServices: VisBuilderServices) {
  visBuilderServices = newServices;
}

export const [getSearchService, setSearchService] = createGetterSetter<
  DataPublicPluginStart['search']
>('data.search');

export const [getExpressionLoader, setExpressionLoader] = createGetterSetter<
  ExpressionsStart['ExpressionLoader']
>('expressions.ExpressionLoader');

export const [getReactExpressionRenderer, setReactExpressionRenderer] = createGetterSetter<
  ExpressionsStart['ReactExpressionRenderer']
>('expressions.ReactExpressionRenderer');

export const [getHttp, setHttp] = createGetterSetter<HttpStart>('Http');

export const [getIndexPatterns, setIndexPatterns] = createGetterSetter<
  DataPublicPluginStart['indexPatterns']
>('data.indexPatterns');

export const [getSavedVisBuilderLoader, setSavedVisBuilderLoader] = createGetterSetter<
  SavedVisBuilderLoader
>('SavedVisBuilderLoader');

export const [getTimeFilter, setTimeFilter] = createGetterSetter<TimefilterContract>('TimeFilter');

export const [getTypeService, setTypeService] = createGetterSetter<TypeServiceStart>('TypeService');

export const [getUISettings, setUISettings] = createGetterSetter<IUiSettingsClient>('UISettings');
export const [getUIActions, setUIActions] = createGetterSetter<UiActionsStart>('UIActions');

export const [getQueryService, setQueryService] = createGetterSetter<
  DataPublicPluginStart['query']
>('Query');

export const [getHeaderActionMenuMounter, setHeaderActionMenuMounter] = createGetterSetter<
  AppMountParameters['setHeaderActionMenu']
>('headerActionMenuMounter');

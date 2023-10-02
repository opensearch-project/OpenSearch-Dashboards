/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGetterSetter } from '../../opensearch_dashboards_utils/common';
import { DataPublicPluginStart, TimefilterContract } from '../../data/public';
import { SavedVisBuilderLoader } from './saved_visualizations';
import { HttpStart, IUiSettingsClient } from '../../../core/public';
import { ExpressionsStart } from '../../expressions/public';
import { TypeServiceStart } from './services/type_service';
import { UiActionsStart } from '../../ui_actions/public';

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

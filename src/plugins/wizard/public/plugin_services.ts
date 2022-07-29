/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGetterSetter } from '../../opensearch_dashboards_utils/common';
import { DataPublicPluginStart, TimefilterContract } from '../../data/public';
import { SavedWizardLoader } from './saved_visualizations';
import { Capabilities, HttpStart, IUiSettingsClient } from '../../../core/public';
import { ExpressionsStart } from '../../expressions/public';
import { TypeServiceStart } from './services/type_service';

export const [getAggService, setAggService] = createGetterSetter<
  DataPublicPluginStart['search']['aggs']
>('data.search.aggs');

export const [getCapabilities, setCapabilities] = createGetterSetter<Capabilities>('Capabilities');

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

export const [getSavedWizardLoader, setSavedWizardLoader] = createGetterSetter<SavedWizardLoader>(
  'SavedWizardLoader'
);

export const [getTimeFilter, setTimeFilter] = createGetterSetter<TimefilterContract>('TimeFilter');

export const [getTypeService, setTypeService] = createGetterSetter<TypeServiceStart>('TypeService');

export const [getUISettings, setUISettings] = createGetterSetter<IUiSettingsClient>('UISettings');

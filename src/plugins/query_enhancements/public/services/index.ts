/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataStorage } from '../../../data/common';
import { DataPublicPluginStart } from '../../../data/public';
import { createGetterSetter } from '../../../opensearch_dashboards_utils/common';
import { AssistantPublicPluginStart } from '../types';

export const [getStorage, setStorage] = createGetterSetter<DataStorage>('storage');
export const [getData, setData] = createGetterSetter<DataPublicPluginStart>('data');

export const [getAssistantClient, setAssistantClient] = createGetterSetter<
  AssistantPublicPluginStart['assistantClient']
>('AssistantClient');

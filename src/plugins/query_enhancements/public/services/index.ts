/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataStorage } from '../../../data/common';
import { DataPublicPluginStart } from '../../../data/public';
import { createGetterSetter } from '../../../opensearch_dashboards_utils/common';

export const [getStorage, setStorage] = createGetterSetter<DataStorage>('storage');
export const [getData, setData] = createGetterSetter<DataPublicPluginStart>('data');

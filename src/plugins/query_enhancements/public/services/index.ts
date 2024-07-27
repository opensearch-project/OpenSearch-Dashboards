/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGetterSetter } from '../../../opensearch_dashboards_utils/common';
import { IStorageWrapper } from '../../../opensearch_dashboards_utils/public';
import { DataPublicPluginStart } from '../../../data/public';

export const [getStorage, setStorage] = createGetterSetter<IStorageWrapper>('storage');
export const [getData, setData] = createGetterSetter<DataPublicPluginStart>('data');

export { ConnectionsService } from './connections_service';

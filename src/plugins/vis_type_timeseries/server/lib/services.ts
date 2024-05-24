/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGetterSetter } from '../../../opensearch_dashboards_utils/common';

export const [getDataSourceEnabled, setDataSourceEnabled] = createGetterSetter<{
  enabled: boolean;
}>('DataSource');

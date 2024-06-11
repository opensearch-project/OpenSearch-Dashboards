/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGetterSetter } from '../../opensearch_dashboards_utils/public';
import { DataPublicPluginStart } from '../../data/public';

export const [getFormatService, setFormatService] = createGetterSetter<
  DataPublicPluginStart['fieldFormats']
>('table data.fieldFormats');

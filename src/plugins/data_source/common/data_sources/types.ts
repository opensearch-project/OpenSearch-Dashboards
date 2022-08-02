/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes } from 'src/core/types';

export interface DataSourceAttributes extends SavedObjectAttributes {
  title: string;
  endpoint: string;
}

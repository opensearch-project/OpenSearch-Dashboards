/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDataView } from '../../data_views';

export const isDefault = (dataView: IDataView) => {
  // Default data views don't have `type` defined.
  return !dataView.type;
};

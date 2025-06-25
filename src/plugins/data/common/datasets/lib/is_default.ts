/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDataset } from '../..';

export const isDefault = (dataset: IDataset) => {
  // Default datasets don't have `type` defined.
  return !dataset.type;
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemTypes as CommonItemTypes } from './containers/common/items';
import { ItemTypes as ConfigPanelItemTypes } from './containers/data_tab/items';

export const ItemTypes = {
  ...CommonItemTypes,
  ...ConfigPanelItemTypes,
};

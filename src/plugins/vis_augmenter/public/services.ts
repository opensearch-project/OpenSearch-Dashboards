/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGetterSetter } from '../../opensearch_dashboards_utils/common';
import { SavedObjectLoader } from '../../saved_objects/public';

export const [getSavedAugmentVisLoader, setSavedAugmentVisLoader] = createGetterSetter<
  SavedObjectLoader
>('savedAugmentVisLoader');

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { getSavedAugmentVisLoader } from '../../services';
import { ISavedAugmentVis } from '../../../common';

/**
 * Create an augment vis saved object given an object that
 * implements the ISavedAugmentVis interface
 */
export const createAugmentVisSavedObject = async (AugmentVis: ISavedAugmentVis): Promise<any> => {
  const loader = getSavedAugmentVisLoader();
  return await loader.get((AugmentVis as any) as Record<string, unknown>);
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppCategory } from '../../../../../core/types';

export interface GetStartCard {
  /**
   * application id that used for filter, if app id is not specified, that means it will always display
   */
  appId?: string;
  /**
   * feature Name
   */
  featureName: string;
  /**
   * card description
   */
  featureDescription: string;
  /**
   * redirect destination when the card been clicked
   */
  link?: string;
  /**
   * application category which appId belongs to
   */
  category: AppCategory;
  /**
   * order of card
   */
  order?: 0;
}

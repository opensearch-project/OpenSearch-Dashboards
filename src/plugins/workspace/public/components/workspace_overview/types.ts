/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { App } from 'opensearch-dashboards/public';

export interface GetStartCard extends Partial<App> {
  /**
   * feature Name
   */
  featureName: string;
  /**
   * card description
   */
  featureDescription: string;
  /**
   * destination when the card been clicked
   */
  link?: string;
}

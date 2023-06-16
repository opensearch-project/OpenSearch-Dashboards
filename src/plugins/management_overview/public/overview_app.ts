/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OverviewApp {
  /** id of plugin app */
  id: string;
  /** Title of plugin displayed to the user. */
  title: string;
  /** One-line description of feature displayed to the user. */
  description: string;
  order: number;
}

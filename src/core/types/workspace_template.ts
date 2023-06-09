/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WorkspaceTemplate {
  /**
   * Unique identifier for the workspace template
   */
  id: string;

  /**
   * Label used for workspace template name.
   */
  label: string;

  /**
   * The order that workspace template will be sorted in
   */
  order?: number;

  /**
   * Introduction of the template
   */
  description: string;

  /**
   * template coverage image location
   */
  coverImage?: string;
}

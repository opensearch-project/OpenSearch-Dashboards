/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WorkspaceAttribute {
  id: string;
  name: string;
  description?: string;
  features?: string[];
  color?: string;
  icon?: string;
  defaultVISTheme?: string;
}

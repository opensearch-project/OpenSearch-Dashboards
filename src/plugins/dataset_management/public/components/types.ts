/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DatasetCreationOption {
  text: string;
  description?: string;
  onClick: () => void;
}

export interface DatasetTableItem {
  id: string;
  title: string;
  default: boolean;
  tag?: string[];
  sort: string;
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OuiComboBoxOptionOption } from '@elastic/eui';

export interface DataSourceList {
  label: string;
  options: DataSourceOption[];
}

export interface DataSourceOption {
  label: string;
}

export type DataSourceOptionType = OuiComboBoxOptionOption<unknown>;

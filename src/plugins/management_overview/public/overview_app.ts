/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginPages } from '../../../core/types';

export interface OverviewApp {
  id: string;
  title: string;
  order: number;
  pages: PluginPages[];
}

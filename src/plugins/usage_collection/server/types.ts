/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReportSchemaType } from './report/schema';
export interface BatchReport {
  report: ReportSchemaType;
  startTimestamp: number;
}

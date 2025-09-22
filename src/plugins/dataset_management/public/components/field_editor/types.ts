/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { ReactText } from 'react';
import { Query } from 'src/plugins/data/public';
import { HttpStart } from 'src/core/public';

export interface Sample {
  input: ReactText | ReactText[];
  output: string;
}

export interface ExecuteScriptParams {
  name: string;
  script: string;
  indexPatternTitle: string;
  query?: Query['query'];
  additionalFields?: string[];
  http: HttpStart;
  dataSourceId?: string;
}

export interface ExecuteScriptResult {
  status: number;
  hits?: { hits: any[] };
  error?: any;
}

export type ExecuteScript = (params: ExecuteScriptParams) => Promise<ExecuteScriptResult>;

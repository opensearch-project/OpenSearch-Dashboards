/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { SchemaConfig } from 'src/plugins/visualizations/public';
import { IFieldFormat } from 'src/plugins/data/public';

export enum AggTypes {
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
}

export interface TableVisConfig extends TableVisParams {
  title: string;
  metrics: SchemaConfig[];
  buckets: SchemaConfig[];
  splitRow?: SchemaConfig[];
  splitColumn?: SchemaConfig[];
}

export interface TableVisParams {
  perPage: number | '';
  showPartialRows: boolean;
  showMetricsAtAllLevels: boolean;
  showTotal: boolean;
  totalFunc: AggTypes;
  percentageCol: string;
}

export interface FormattedColumn {
  id: string;
  title: string;
  formatter: IFieldFormat;
  filterable: boolean;
  formattedTotal?: string | number;
  sumTotal?: number;
  total?: number;
}

export interface ColumnWidth {
  colIndex: number;
  width: number;
}

export interface ColumnSort {
  colIndex?: number;
  direction?: 'asc' | 'desc';
}

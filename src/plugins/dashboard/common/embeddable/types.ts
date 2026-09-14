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

export interface GridData {
  w: number;
  h: number;
  x: number;
  y: number;
  i: string;
}

/**
 * Section member coordinates are relative to their section and stored in
 * `layoutJSON`. Panel definitions and GridLayout coordinates remain in
 * `panelsJSON`.
 */
export interface SectionMemberGridData {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SectionLayoutMember {
  idRef: string;
  type: 'panel';
  /** Coordinates within the section grid. */
  gridData: SectionMemberGridData;
}

export interface DashboardSection {
  id: string;
  type: 'section';
  name: string;
  collapsed: boolean;
  members: SectionLayoutMember[];
}

export type DashboardLayoutType = 'GridLayout' | 'SectionLayout';

/**
 * `GridLayout` renders one panel grid. `SectionLayout` renders sections in
 * `items` order, each with its own member grid. An empty `SectionLayout` is
 * treated as `GridLayout`.
 */
export interface DashboardLayout {
  type: DashboardLayoutType;
  items: DashboardSection[];
}

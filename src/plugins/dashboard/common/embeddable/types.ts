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
 * Collapsible dashboard sections (feature-flagged via `allowDashboardSections`).
 *
 * The section layout is stored in a dedicated top-level `layoutJSON` saved-object
 * attribute (NOT inside `panelsJSON`). `panelsJSON` remains the source of truth for
 * panel *definitions*, including each panel's own `gridData` -- the dashboard's
 * GridLayout-mode representation. While a panel is a section member, its section-
 * relative position lives only in the member's own `gridData` (below); the panel's
 * `panelsJSON.gridData` is left untouched by every section-internal operation
 * (add to section, move between sections, drag/resize inside a section, rename,
 * collapse) and is only ever recomputed when ungrouping back to GridLayout.
 */
export interface SectionMemberGridData {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SectionLayoutMember {
  /** References a panel id (panelIndex) in panelsJSON. */
  idRef: string;
  type: 'panel';
  /** Section-relative coordinates within the section's own inner grid. */
  gridData: SectionMemberGridData;
}

export interface SectionLayout {
  id: string;
  type: 'section';
  name: string;
  collapsed: boolean;
  /** Members in render order within the section's inner grid. */
  members: SectionLayoutMember[];
}

export type DashboardLayoutType = 'GridLayout' | 'SectionLayout';

/**
 * Top-level dashboard layout descriptor. When absent (undefined) or `GridLayout`,
 * the dashboard renders the classic single react-grid-layout of panels. When
 * `SectionLayout`, the dashboard renders `items` (sections) in array order, each
 * with its own inner grid. A `SectionLayout` with zero `items` is treated as
 * `GridLayout` (auto-revert).
 */
export interface DashboardLayout {
  type: DashboardLayoutType;
  items: SectionLayout[];
}

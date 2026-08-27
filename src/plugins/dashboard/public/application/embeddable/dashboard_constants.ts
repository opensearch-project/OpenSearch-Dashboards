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

export const DASHBOARD_GRID_COLUMN_COUNT = 48;
export const DASHBOARD_GRID_HEIGHT = 20;
export const DEFAULT_PANEL_WIDTH = DASHBOARD_GRID_COLUMN_COUNT / 2;
export const DEFAULT_PANEL_HEIGHT = 15;

/**
 * Outer-grid rows reserved for a collapsible section's header strip
 * (chevron/title/chrome) above its inner members grid. A section's
 * outer height = SECTION_HEADER_ROWS + its inner grid content rows, and its
 * members' section-relative y are offset by SECTION_HEADER_ROWS when released
 * to absolute coordinates (ungroup). The header is forced to a single line via
 * `.dshDashboardGrid__sectionHeader .embPanel__title { flex-wrap: nowrap }`
 * (see _dashboard_grid.scss); its rendered height (~26px incl. padding/border)
 * is a little over one outer row's ~20px, so 1 row clips the last member by a
 * few px and 2 rows clears it with a small (~half-row) residual gap. We accept
 * that tiny gap rather than clip a member. Larger values only add empty space
 * at the bottom (the inner grid is content-height and top-anchored, so surplus
 * rows are never filled).
 *
 * Single source of truth -- imported by DashboardGrid (height/render),
 * DashboardContainer (ungroup repositioning) and get_nav_actions (new-section
 * placement) so the three cannot drift.
 */
export const SECTION_HEADER_ROWS = 2;
export const DASHBOARD_CONTAINER_TYPE = 'dashboard';

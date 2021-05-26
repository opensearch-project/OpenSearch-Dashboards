/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

export * from './code-editor';
export * from './exit-full-screen-button';
export * from './context';
export * from './overview-page';
export * from './overlays';
export * from './ui-settings';
export * from './field-icon';
export * from './field-button';
export * from './table-list-view';
export * from './split-panel';
export * from './react-router-navigate';
export { ValidatedDualRange, Value } from './validated-range';
export * from './notifications';
export { Markdown, MarkdownSimple } from './markdown';
export { reactToUiComponent, uiToReactComponent } from './adapters';
export { useUrlTracker } from './use-url-tracker';
export { toMountPoint, MountPointPortal } from './util';
export { RedirectAppLinks } from './app-links';

/** dummy plugin, we just want opensearchDashboardsReact to have its own bundle */
export function plugin() {
  return new (class OpenSearchDashboardsReactPlugin {
    setup() {}
    start() {}
  })();
}

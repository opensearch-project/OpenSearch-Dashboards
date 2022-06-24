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

/**
 * A type definition for custom branding configurations from yml file
 * @public
 */

export interface Branding {
  /** Default mode or Dark mode*/
  darkMode?: boolean;
  /** Relative path to the asset folder */
  assetFolderUrl?: string;
  /** Small logo icon that will be used in most logo occurrences */
  mark?: {
    defaultUrl?: string;
    darkModeUrl?: string;
  };
  /** Fuller logo that will be rendered on nav bar header */
  logo?: {
    defaultUrl?: string;
    darkModeUrl?: string;
  };
  /** Loading logo that will be rendered on the loading page */
  loadingLogo?: {
    defaultUrl?: string;
    darkModeUrl?: string;
  };
  /** Custom favicon that will be rendered on the browser tab */
  faviconUrl?: string;
  /** Application title that will replace the default opensearch dashboard string */
  applicationTitle?: string;
  /** Whether to use expanded menu (true) or condensed menu (false) */
  useExpandedHeader?: boolean;
}

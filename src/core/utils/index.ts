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

export {
  ContextContainer,
  HandlerContextType,
  HandlerFunction,
  HandlerParameters,
  IContextContainer,
  IContextProvider,
} from './context';
export { DEFAULT_APP_CATEGORIES } from './default_app_categories';
export {
  WORKSPACE_USE_CASE_PREFIX,
  WORKSPACE_PATH_PREFIX,
  WORKSPACE_TYPE,
  ENABLE_AI_FEATURES,
} from './constants';
export {
  getWorkspaceIdFromUrl,
  formatUrlWithWorkspaceId,
  cleanWorkspaceId,
  getUseCaseFeatureConfig,
  isNavGroupInFeatureConfigs,
} from './workspace';
export {
  DEFAULT_NAV_GROUPS,
  ALL_USE_CASE_ID,
  SEARCH_USE_CASE_ID,
  ESSENTIAL_USE_CASE_ID,
  OBSERVABILITY_USE_CASE_ID,
  SECURITY_ANALYTICS_USE_CASE_ID,
} from './default_nav_groups';

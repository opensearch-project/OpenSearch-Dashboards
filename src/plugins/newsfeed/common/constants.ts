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

export const NEWSFEED_FALLBACK_LANGUAGE = 'en';
export const NEWSFEED_FALLBACK_FETCH_INTERVAL = 86400000; // 1 day
export const NEWSFEED_FALLBACK_MAIN_INTERVAL = 120000; // 2 minutes
export const NEWSFEED_LAST_FETCH_STORAGE_KEY = 'newsfeed.lastfetchtime';
export const NEWSFEED_HASH_SET_STORAGE_KEY = 'newsfeed.hashes';

export const NEWSFEED_DEFAULT_SERVICE_BASE_URL = '';
export const NEWSFEED_DEV_SERVICE_BASE_URL = '';
export const NEWSFEED_DEFAULT_SERVICE_PATH = '/opensearch-dashboards/v{VERSION}.json';

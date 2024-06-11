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

import { i18n } from '@osd/i18n';
import { schema } from '@osd/config-schema';

import { UiSettingsParams } from 'opensearch-dashboards/server';
import {
  PER_PAGE_SETTING,
  PER_PAGE_VALUE,
  LISTING_LIMIT_SETTING,
  LISTING_LIMIT_VALUE,
} from '../common';

export const uiSettings: Record<string, UiSettingsParams> = {
  [PER_PAGE_SETTING]: {
    name: i18n.translate('savedObjects.advancedSettings.perPageTitle', {
      defaultMessage: 'Objects per page',
    }),
    value: PER_PAGE_VALUE,
    type: 'number',
    description: i18n.translate('savedObjects.advancedSettings.perPageText', {
      defaultMessage: 'Number of objects to show per page in the load dialog',
    }),
    schema: schema.number(),
  },
  [LISTING_LIMIT_SETTING]: {
    name: i18n.translate('savedObjects.advancedSettings.listingLimitTitle', {
      defaultMessage: 'Objects listing limit',
    }),
    type: 'number',
    value: LISTING_LIMIT_VALUE,
    description: i18n.translate('savedObjects.advancedSettings.listingLimitText', {
      defaultMessage: 'Number of objects to fetch for the listing pages',
    }),
    schema: schema.number(),
  },
};

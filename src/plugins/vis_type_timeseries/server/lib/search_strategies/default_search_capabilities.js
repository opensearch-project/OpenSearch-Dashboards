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

import {
  convertIntervalToUnit,
  parseInterval,
  getSuitableUnit,
} from '../vis_data/helpers/unit_to_seconds';
import { RESTRICTIONS_KEYS } from '../../../common/ui_restrictions';

const getTimezoneFromRequest = (request) => {
  return request.payload.timerange.timezone;
};

export class DefaultSearchCapabilities {
  constructor(request, fieldsCapabilities = {}) {
    this.request = request;
    this.fieldsCapabilities = fieldsCapabilities;
  }

  get defaultTimeInterval() {
    return null;
  }

  /** @deprecated use allowListedMetrics*/
  get whiteListedMetrics() {
    return this.createUiRestriction();
  }

  /** @deprecated use allowListedGroupByFields*/
  get whiteListedGroupByFields() {
    return this.createUiRestriction();
  }

  /** @deprecated use allowListedTimerangeMode*/
  get whiteListedTimerangeModes() {
    return this.createUiRestriction();
  }

  get allowListedMetrics() {
    return this.createUiRestriction();
  }

  get allowListedGroupByFields() {
    return this.createUiRestriction();
  }

  get allowListedTimerangeModes() {
    return this.createUiRestriction();
  }

  get uiRestrictions() {
    return {
      [RESTRICTIONS_KEYS.WHITE_LISTED_METRICS]: this.whiteListedMetrics,
      [RESTRICTIONS_KEYS.WHITE_LISTED_GROUP_BY_FIELDS]: this.whiteListedGroupByFields,
      [RESTRICTIONS_KEYS.WHITE_LISTED_TIMERANGE_MODES]: this.whiteListedTimerangeModes,
      [RESTRICTIONS_KEYS.ALLOW_LISTED_METRICS]: this.allowListedMetrics,
      [RESTRICTIONS_KEYS.ALLOW_LISTED_GROUP_BY_FIELDS]: this.allowListedGroupByFields,
      [RESTRICTIONS_KEYS.ALLOW_LISTED_TIMERANGE_MODES]: this.allowListedTimerangeModes,
    };
  }

  get searchTimezone() {
    return getTimezoneFromRequest(this.request);
  }

  createUiRestriction(restrictionsObject) {
    return {
      '*': !restrictionsObject,
      ...(restrictionsObject || {}),
    };
  }

  parseInterval(interval) {
    return parseInterval(interval);
  }

  getSuitableUnit(intervalInSeconds) {
    return getSuitableUnit(intervalInSeconds);
  }

  convertIntervalToUnit(intervalString, unit) {
    const parsedInterval = this.parseInterval(intervalString);

    if (parsedInterval.unit !== unit) {
      return convertIntervalToUnit(intervalString, unit);
    }

    return parsedInterval;
  }

  getValidTimeInterval(intervalString) {
    // Default search capabilities doesn't have any restrictions for the interval string
    return intervalString;
  }
}

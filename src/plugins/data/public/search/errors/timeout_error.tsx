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

import React from 'react';
import { i18n } from '@osd/i18n';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { OsdError } from '../../../../opensearch_dashboards_utils/common';

export const TIMEOUT_MESSAGE: string =
  'Your query has timed out. Contact your system administrator to review your index strategy or increase the run time.';
/**
 * Request Failure - When an entire multi request fails
 * @param {Error} err - the Error that came back
 */
export class SearchTimeoutError extends OsdError {
  constructor(err: Error) {
    super(`Request timeout: ${JSON.stringify(err?.message)}`);
  }

  public getErrorMessage(application: ApplicationStart) {
    return (
      <>{i18n.translate('data.search.timeoutContactAdmin', { defaultMessage: TIMEOUT_MESSAGE })}</>
    );
  }
}

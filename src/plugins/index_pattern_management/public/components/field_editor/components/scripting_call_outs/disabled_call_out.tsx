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

import React, { Fragment } from 'react';

import { EuiCallOut, EuiSpacer } from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';

export const ScriptingDisabledCallOut = ({ isVisible = false }) => {
  return isVisible ? (
    <Fragment>
      <EuiCallOut
        title={
          <FormattedMessage
            id="indexPatternManagement.disabledCallOutHeader"
            defaultMessage="Scripting disabled"
            description="Showing the status that scripting is disabled in OpenSearch. Not an update message, that it JUST got disabled."
          />
        }
        color="danger"
        iconType="alert"
      >
        <p>
          <FormattedMessage
            id="indexPatternManagement.disabledCallOutLabel"
            defaultMessage="All inline scripting has been disabled in OpenSearch. You must enable inline scripting for at least one
            language in order to use scripted fields in OpenSearch Dashboards."
          />
        </p>
      </EuiCallOut>
      <EuiSpacer size="m" />
    </Fragment>
  ) : null;
};

ScriptingDisabledCallOut.displayName = 'ScriptingDisabledCallOut';

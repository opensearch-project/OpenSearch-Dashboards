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
import { EuiButton, EuiSpacer, EuiText, EuiCodeBlock } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { OsdError } from '../../../../opensearch_dashboards_utils/common';
import { OpenSearchError, isOpenSearchError } from './types';
import { IOpenSearchDashboardsSearchRequest } from '..';

export class PainlessError extends OsdError {
  painlessStack?: string;
  constructor(err: OpenSearchError, request: IOpenSearchDashboardsSearchRequest) {
    const rootCause = getRootCause(err as OpenSearchError);

    super(
      i18n.translate('data.painlessError.painlessScriptedFieldErrorMessage', {
        defaultMessage: "Error executing Painless script: '{script}'.",
        values: { script: rootCause?.script },
      })
    );
    this.painlessStack = rootCause?.script_stack ? rootCause?.script_stack.join('\n') : undefined;
  }

  public getErrorMessage(application: ApplicationStart) {
    function onClick() {
      application.navigateToApp('management', {
        path: `/opensearch-dashboards/indexPatterns`,
      });
    }

    return (
      <>
        {this.message}
        <EuiSpacer size="s" />
        <EuiSpacer size="s" />
        {this.painlessStack ? (
          <EuiCodeBlock data-test-subj="painlessStackTrace" isCopyable={true} paddingSize="s">
            {this.painlessStack}
          </EuiCodeBlock>
        ) : null}
        <EuiText textAlign="right">
          <EuiButton color="danger" onClick={onClick} size="s">
            <FormattedMessage id="data.painlessError.buttonTxt" defaultMessage="Edit script" />
          </EuiButton>
        </EuiText>
      </>
    );
  }
}

function getFailedShards(err: OpenSearchError) {
  const failedShards =
    err.body?.attributes?.error?.failed_shards ||
    err.body?.attributes?.error?.caused_by?.failed_shards;
  return failedShards ? failedShards[0] : undefined;
}

function getRootCause(err: OpenSearchError) {
  return getFailedShards(err)?.reason;
}

export function isPainlessError(err: Error | OpenSearchError) {
  if (!isOpenSearchError(err)) return false;

  const rootCause = getRootCause(err as OpenSearchError);
  if (!rootCause) return false;

  const { lang } = rootCause;
  return lang === 'painless';
}

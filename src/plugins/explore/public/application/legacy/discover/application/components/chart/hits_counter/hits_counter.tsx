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

import './hits_counter.scss';
import React from 'react';
import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { OpenSearchSearchHit } from '../../../../../../../types/doc_views_types';

export interface HitsCounterProps {
  /**
   * the number of query hits
   */
  hits?: number;
  /**
   * displays the reset button
   */
  showResetButton: boolean;
  /**
   * resets the query
   */
  onResetQuery: () => void;
  /**
   * the row data of the table
   */
  rows?: OpenSearchSearchHit[];
}

export function HitsCounter({ hits, showResetButton, onResetQuery, rows }: HitsCounterProps) {
  const rowsCount = rows?.length || 0;

  return (
    <I18nProvider>
      <EuiFlexGroup
        gutterSize="none"
        className="dscResultCount"
        data-test-subj="dscResultCount"
        responsive={false}
        justifyContent="center"
        alignItems="center"
      >
        <EuiFlexItem grow={false}>
          <EuiText size="s">
            <strong>
              <FormattedMessage
                id="explore.discover.hitsResultTitle"
                defaultMessage="{rowsCount, plural, one {Result} other {Results}}"
                values={{ rowsCount }}
              />{' '}
              (
              <span
                data-test-subj="discoverQueryRowsCount"
                aria-label={i18n.translate('explore.discover.hitsCounterRowsCount', {
                  defaultMessage: '{rowsCount} {rowsCount, plural, one {row} other {rows}} shown',
                  values: { rowsCount },
                })}
              >
                {rowsCount.toLocaleString()}
              </span>
              {hits ? (
                <>
                  /
                  <span
                    data-test-subj="discoverQueryHits"
                    aria-label={i18n.translate('explore.discover.hitsCounterHitsCount', {
                      defaultMessage: '{hits} {hits, plural, one {hit} other {hits}}',
                      values: { hits },
                    })}
                  >
                    {hits.toLocaleString()}
                  </span>
                </>
              ) : null}
              )
            </strong>
          </EuiText>
        </EuiFlexItem>
        {showResetButton && (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="refresh"
              data-test-subj="resetSavedSearch"
              onClick={onResetQuery}
              size="s"
              aria-label={i18n.translate('explore.explore.discover.reloadSavedSearchButton', {
                defaultMessage: 'Reset search',
              })}
            >
              <FormattedMessage
                id="explore.explore.discover.reloadSavedSearchButton"
                defaultMessage="Reset search"
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </I18nProvider>
  );
}

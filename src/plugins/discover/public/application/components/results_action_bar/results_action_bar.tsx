/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './results_action_bar.scss';

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { HitsCounter } from '../chart/hits_counter';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { DiscoverOptions } from '../discover_options/discover_options';
import { DiscoverDownloadCsv } from '../download_csv';
import { IndexPattern } from '../../../../../data/common';

export interface DiscoverResultsActionBarProps {
  hits?: number;
  showResetButton?: boolean;
  resetQuery(): void;
  rows?: OpenSearchSearchHit[];
  isEnhancementsEnabled: boolean;
  indexPattern?: IndexPattern;
}

export const DiscoverResultsActionBar = ({
  hits,
  showResetButton = false,
  resetQuery,
  rows,
  isEnhancementsEnabled,
  indexPattern,
}: DiscoverResultsActionBarProps) => {
  return (
    <EuiFlexGroup
      direction="row"
      gutterSize="none"
      justifyContent="spaceBetween"
      className="dscResultsActionBar"
      data-test-subj="dscResultsActionBar"
    >
      <EuiFlexItem>
        <EuiFlexGroup
          alignItems="center"
          direction="row"
          gutterSize="none"
          justifyContent="flexStart"
        >
          <EuiFlexItem grow={false}>
            <HitsCounter
              hits={hits}
              showResetButton={showResetButton}
              onResetQuery={resetQuery}
              rows={rows}
            />
          </EuiFlexItem>
          {indexPattern && rows?.length ? (
            <EuiFlexItem grow={false}>
              <DiscoverDownloadCsv indexPattern={indexPattern} rows={rows} hits={hits} />
            </EuiFlexItem>
          ) : null}
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup direction="row" gutterSize="none" justifyContent="flexStart">
          {/* TODO: We will allow extensions to be added here */}
          {!isEnhancementsEnabled && (
            <EuiFlexItem grow={false}>
              <DiscoverOptions />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

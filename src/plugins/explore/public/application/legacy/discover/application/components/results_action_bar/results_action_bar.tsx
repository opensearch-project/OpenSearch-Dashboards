/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './results_action_bar.scss';

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { HitsCounter } from '../chart/hits_counter';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { DiscoverDownloadCsv } from '../download_csv';
import { IndexPattern } from '../../../../../data/common';
import { ACTION_BAR_BUTTONS_CONTAINER_ID } from '../../../../../data/public';

export interface DiscoverResultsActionBarProps {
  hits?: number;
  showResetButton?: boolean;
  resetQuery(): void;
  rows?: OpenSearchSearchHit[];
  indexPattern?: IndexPattern;
}

export const DiscoverResultsActionBar = ({
  hits,
  showResetButton = false,
  resetQuery,
  rows,
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
        {/* Where Data Plugin's QueryEditorExtension action buttons will go */}
        <EuiFlexGroup
          className="dscResultsActionBar__extensions-container"
          direction="row"
          gutterSize="none"
          justifyContent="flexStart"
          id={ACTION_BAR_BUTTONS_CONTAINER_ID}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

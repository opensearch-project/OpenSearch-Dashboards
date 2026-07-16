/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './results_action_bar.scss';

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiTab, EuiTabs } from '@elastic/eui';
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
  activeTab?: 'results' | 'analyze';
  onTabChange?: (tab: 'results' | 'analyze') => void;
  showAnalyzeTab?: boolean;
}

export const DiscoverResultsActionBar = ({
  hits,
  showResetButton = false,
  resetQuery,
  rows,
  indexPattern,
  activeTab,
  onTabChange,
  showAnalyzeTab = false,
}: DiscoverResultsActionBarProps) => {
  const rowsCount = rows?.length || 0;
  const resultsLabel = hits
    ? `Results (${rowsCount.toLocaleString()}/${hits.toLocaleString()})`
    : `Results (${rowsCount.toLocaleString()})`;

  return (
    <EuiFlexGroup
      direction="row"
      gutterSize="none"
      justifyContent="spaceBetween"
      alignItems="center"
      className="dscResultsActionBar"
      data-test-subj="dscResultsActionBar"
    >
      <EuiFlexItem>
        <EuiFlexGroup alignItems="center" direction="row" gutterSize="s" justifyContent="flexStart">
          {showAnalyzeTab && onTabChange ? (
            <EuiFlexItem grow={false}>
              <EuiTabs size="s" data-test-subj="discoverResultsAnalyzeTabs">
                <EuiTab
                  isSelected={activeTab === 'results'}
                  onClick={() => onTabChange('results')}
                  data-test-subj="discoverResultsTab"
                >
                  {resultsLabel}
                </EuiTab>
                <EuiTab
                  isSelected={activeTab === 'analyze'}
                  onClick={() => onTabChange('analyze')}
                  data-test-subj="discoverAnalyzeTab"
                >
                  Analyze
                </EuiTab>
              </EuiTabs>
            </EuiFlexItem>
          ) : (
            <EuiFlexItem grow={false}>
              <HitsCounter
                hits={hits}
                showResetButton={showResetButton}
                onResetQuery={resetQuery}
                rows={rows}
              />
            </EuiFlexItem>
          )}
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

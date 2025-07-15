/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './results_action_bar.scss';

import React from 'react';
import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';
import { HitsCounter } from '../hits_counter';
import { OpenSearchSearchHit } from '../../../../types/doc_views_types';
import { DiscoverDownloadCsv } from '../download_csv';
import { DataView as Dataset } from '../../../../../../data/common';
import { ACTION_BAR_BUTTONS_CONTAINER_ID } from '../../../../../../data/public';
import { SaveAndAddButtonWithModal } from '../../../visualizations/add_to_dashboard_button';
import { ExecutionContextSearch } from '../../../../../../expressions/common/';
import { ExploreServices } from '../../../../types';

export interface DiscoverResultsActionBarProps {
  hits?: number;
  showResetButton?: boolean;
  resetQuery(): void;
  rows?: OpenSearchSearchHit[];
  elapsedMs?: number;
  dataset?: Dataset;
  inspectionHanlder?: () => void;
  searchContext: ExecutionContextSearch;
  services: Partial<CoreStart> & ExploreServices;
}

export const DiscoverResultsActionBar = ({
  hits,
  showResetButton = false,
  resetQuery,
  rows,
  elapsedMs,
  dataset,
  inspectionHanlder,
  searchContext,
  services,
}: DiscoverResultsActionBarProps) => {
  return (
    <EuiFlexGroup
      direction="row"
      gutterSize="none"
      justifyContent="spaceBetween"
      className="explore-results-action-bar"
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
              elapsedMs={elapsedMs}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              onClick={inspectionHanlder}
              data-test-subj="openInspectorButton"
            >
              {i18n.translate('explore.explore.discover.topNav.discoverInspectorButtonLabel', {
                defaultMessage: 'Explain',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
          {dataset && rows?.length ? (
            <>
              <EuiFlexItem
                grow={false}
                className="explore-results-action-bar__explore-download-csv-flex-item"
              >
                <DiscoverDownloadCsv indexPattern={dataset as any} rows={rows} hits={hits} />
              </EuiFlexItem>
              {dataset && (
                <EuiFlexItem grow={false}>
                  <SaveAndAddButtonWithModal
                    searchContext={searchContext}
                    dataset={dataset}
                    services={services}
                  />
                </EuiFlexItem>
              )}
            </>
          ) : null}
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        {/* Where Data Plugin's QueryEditorExtension action buttons will go */}
        <EuiFlexGroup
          className="explore-results-action-bar__extensions-container"
          direction="row"
          gutterSize="none"
          justifyContent="flexStart"
          id={ACTION_BAR_BUTTONS_CONTAINER_ID}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

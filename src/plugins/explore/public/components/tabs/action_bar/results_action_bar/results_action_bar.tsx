/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './results_action_bar.scss';

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { useSelector } from 'react-redux';
import { HitsCounter } from '../hits_counter';
import { OpenSearchSearchHit } from '../../../../types/doc_views_types';
import { DiscoverDownloadCsv } from '../download_csv';
import { DataView as Dataset } from '../../../../../../data/common';
import { ACTION_BAR_BUTTONS_CONTAINER_ID } from '../../../../../../data/public';
import { SaveAndAddButtonWithModal } from '../../../visualizations/add_to_dashboard_button';
import { selectActiveTabId } from '../../../../application/utils/state_management/selectors';
import { PatternsSettingsPopoverButton } from '../patterns_settings/patterns_settings_popover_button';

export interface DiscoverResultsActionBarProps {
  hits?: number;
  showResetButton?: boolean;
  resetQuery(): void;
  rows?: OpenSearchSearchHit[];
  elapsedMs?: number;
  dataset?: Dataset;
  inspectionHanlder?: () => void;
}

export const DiscoverResultsActionBar = ({
  hits,
  showResetButton = false,
  resetQuery,
  rows,
  elapsedMs,
  dataset,
  inspectionHanlder,
}: DiscoverResultsActionBarProps) => {
  const currentTab = useSelector(selectActiveTabId);
  const shouldShowAddToDashboardButton = currentTab !== 'explore_patterns_tab';
  const shouldShowExportButton = currentTab !== 'explore_patterns_tab';
  const showTabSpecificSettings = currentTab === 'explore_patterns_tab';

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
          justifyContent="spaceBetween"
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
          {/* TODO: Fix data consistency issue with inspection panel */}
          {/* <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              onClick={inspectionHanlder}
              data-test-subj="openInspectorButton"
            >
              {i18n.translate('explore.explore.discover.topNav.discoverInspectorButtonLabel', {
                defaultMessage: 'Explain',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem> */}
          <EuiFlexItem grow={false}>
            {dataset && rows?.length ? (
              <EuiFlexGroup
                alignItems="center"
                direction="row"
                gutterSize="none"
                justifyContent="flexStart"
              >
                {showTabSpecificSettings && (
                  <EuiFlexItem grow={false}>
                    <PatternsSettingsPopoverButton />
                  </EuiFlexItem>
                )}
                {shouldShowExportButton && (
                  <EuiFlexItem
                    grow={false}
                    className="explore-results-action-bar__explore-download-csv-flex-item"
                  >
                    <DiscoverDownloadCsv indexPattern={dataset} rows={rows} hits={hits} />
                  </EuiFlexItem>
                )}
                {shouldShowAddToDashboardButton && (
                  <EuiFlexItem grow={false}>
                    <SaveAndAddButtonWithModal dataset={dataset} />
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
            ) : null}
          </EuiFlexItem>
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

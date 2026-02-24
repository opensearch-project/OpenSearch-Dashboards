/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './results_action_bar.scss';
import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { HitsCounter } from '../hits_counter';
import { OpenSearchSearchHit } from '../../../../types/doc_views_types';
import { DiscoverDownloadCsv } from '../download_csv';
import { DataView as Dataset } from '../../../../../../data/common';
import { ACTION_BAR_BUTTONS_CONTAINER_ID } from '../../../../../../data/public';
import { SlotItemsForType } from '../../../../services/slot_registry';

export interface DiscoverResultsActionBarProps {
  hits?: number;
  showResetButton?: boolean;
  resetQuery(): void;
  rows?: OpenSearchSearchHit[];
  elapsedMs?: number;
  dataset?: Dataset;
  inspectionHanlder?: () => void;
  extraActions?: Array<SlotItemsForType<'resultsActionBar'>>;
  rowsCountOverride?: number;
}

export const DiscoverResultsActionBar = ({
  hits,
  showResetButton = false,
  resetQuery,
  rows,
  elapsedMs,
  dataset,
  inspectionHanlder,
  extraActions,
  rowsCountOverride,
}: DiscoverResultsActionBarProps) => {
  const shouldShowExportButton = true;

  return (
    <EuiFlexGroup
      direction="row"
      gutterSize="none"
      justifyContent="spaceBetween"
      className="agentTraces-results-action-bar"
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
              rowsCountOverride={rowsCountOverride}
            />
          </EuiFlexItem>
          {/* TODO: Fix data consistency issue with inspection panel */}
          {/* <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              onClick={inspectionHanlder}
              data-test-subj="openInspectorButton"
            >
              {i18n.translate('agentTraces.discover.topNav.discoverInspectorButtonLabel', {
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
                {shouldShowExportButton && (
                  <EuiFlexItem
                    grow={false}
                    className="agentTraces-results-action-bar__agentTraces-download-csv-flex-item"
                  >
                    <DiscoverDownloadCsv indexPattern={dataset} rows={rows} hits={hits} />
                  </EuiFlexItem>
                )}
                {extraActions?.map((item) => (
                  <EuiFlexItem grow={false} key={item.id}>
                    {item.render()}
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            ) : null}
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        {/* Where Data Plugin's QueryEditorExtension action buttons will go */}
        <EuiFlexGroup
          className="agentTraces-results-action-bar__extensions-container"
          direction="row"
          gutterSize="none"
          justifyContent="flexStart"
          id={ACTION_BAR_BUTTONS_CONTAINER_ID}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

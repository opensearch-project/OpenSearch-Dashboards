/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './results_action_bar.scss';
import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiSwitch, EuiToolTip } from '@elastic/eui';
import { useSelector, useDispatch } from 'react-redux';
import { useObservable } from 'react-use';
import { HitsCounter } from '../hits_counter';
import { OpenSearchSearchHit } from '../../../../types/doc_views_types';
import { DiscoverDownloadCsv } from '../download_csv';
import { DataView as Dataset } from '../../../../../../data/common';
import { ACTION_BAR_BUTTONS_CONTAINER_ID } from '../../../../../../data/public';
import { SaveAndAddButtonWithModal } from '../../../visualizations/add_to_dashboard_button';
import {
  selectActiveTabId,
  selectWrapCellText,
} from '../../../../application/utils/state_management/selectors';
import { setWrapCellText } from '../../../../application/utils/state_management/slices';
import { EXPLORE_LOGS_TAB_ID } from '../../../../../common';
import { PatternsSettingsPopoverButton } from '../patterns_settings/patterns_settings_popover_button';
import { getVisualizationBuilder } from '../../../visualizations/visualization_builder';
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
  const dispatch = useDispatch();
  const currentTab = useSelector(selectActiveTabId);
  const wrapCellText = useSelector(selectWrapCellText);
  const isLogsTab = currentTab === EXPLORE_LOGS_TAB_ID;
  const shouldShowAddToDashboardButton = currentTab !== 'explore_patterns_tab';
  const shouldShowExportButton = currentTab !== 'explore_patterns_tab';
  const showTabSpecificSettings = currentTab === 'explore_patterns_tab';
  const visualizationBuilder = getVisualizationBuilder();
  const visConfig = useObservable(visualizationBuilder.visConfig$);
  const showRawTable = useObservable(visualizationBuilder.showRawTable$);
  const isNonTableChart = !!visConfig?.type && visConfig.type !== 'table';

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
                {isLogsTab && (
                  <EuiFlexItem grow={false}>
                    <EuiToolTip
                      content={i18n.translate('explore.discover.wrapCellTextTooltip', {
                        defaultMessage:
                          'Toggle between truncated and wrapped cell text in the table',
                      })}
                    >
                      <EuiSwitch
                        label={i18n.translate('explore.discover.wrapCellText', {
                          defaultMessage: 'Wrap cell text',
                        })}
                        checked={wrapCellText}
                        onChange={(e) => dispatch(setWrapCellText(e.target.checked))}
                        data-test-subj="exploreWrapCellTextSwitch"
                      />
                    </EuiToolTip>
                  </EuiFlexItem>
                )}
                {isNonTableChart && dataset && rows?.length ? (
                  <EuiFlexItem grow={false}>
                    <EuiToolTip
                      content={i18n.translate('explore.discover.showRawDataTooltip', {
                        defaultMessage: 'View raw data table for this visualization',
                      })}
                    >
                      <EuiSwitch
                        label={i18n.translate('explore.discover.showRawData', {
                          defaultMessage: 'Show raw data',
                        })}
                        checked={!!showRawTable}
                        onChange={(e) => visualizationBuilder.setShowRawTable(e.target.checked)}
                        data-test-subj="exploreShowRawDataSwitch"
                      />
                    </EuiToolTip>
                  </EuiFlexItem>
                ) : null}
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

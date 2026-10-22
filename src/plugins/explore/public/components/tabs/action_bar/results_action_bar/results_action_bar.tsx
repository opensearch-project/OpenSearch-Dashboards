/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './results_action_bar.scss';
import { i18n } from '@osd/i18n';

import { EuiFlexGroup, EuiFlexItem, EuiSwitch, EuiToolTip } from '@elastic/eui';
import { useDispatch, useSelector } from 'react-redux';
import { useObservable } from 'react-use';
import { StreamingQueryStatus } from '../../../../application/utils/state_management/types';
import { HitsCounter } from '../hits_counter';
import { OpenSearchSearchHit } from '../../../../types/doc_views_types';
import { DiscoverDownloadCsv } from '../download_csv';
import { DataView as Dataset } from '../../../../../../data/common';
import { ACTION_BAR_BUTTONS_CONTAINER_ID } from '../../../../../../data/public';
import { SaveAndAddButtonWithModal } from '../../../visualizations/add_to_dashboard_button';
import { selectActiveTabId } from '../../../../application/utils/state_management/selectors';
import {
  EXPLORE_LOGS_TAB_ID,
  EXPLORE_PATTERNS_TAB_ID,
  EXPLORE_STATISTICS_TAB_ID,
} from '../../../../../common';
import { PatternsSettingsPopoverButton } from '../patterns_settings/patterns_settings_popover_button';
import { TableActionsPopoverButton } from '../table_actions/table_actions_popover_button';
import { setHideEmptyFields } from '../../../../application/utils/state_management/slices';
import { useHiddenColumnCount } from '../../../../helpers/use_displayed_columns';
import { getVisualizationBuilder } from '../../../visualizations/visualization_builder';
import { SlotItemsForType } from '../../../../services/slot_registry';

export interface DiscoverResultsActionBarProps {
  hits?: number;
  bucketCount?: number;
  showResetButton?: boolean;
  resetQuery(): void;
  rows?: OpenSearchSearchHit[];
  elapsedMs?: number;
  streaming?: StreamingQueryStatus;
  dataset?: Dataset;
  inspectionHanlder?: () => void;
  extraActions?: Array<SlotItemsForType<'resultsActionBar'>>;
  rowsCountOverride?: number;
}

export const DiscoverResultsActionBar = ({
  hits,
  bucketCount,
  showResetButton = false,
  resetQuery,
  rows,
  elapsedMs,
  streaming,
  dataset,
  inspectionHanlder,
  extraActions,
  rowsCountOverride,
}: DiscoverResultsActionBarProps) => {
  const dispatch = useDispatch();
  const currentTab = useSelector(selectActiveTabId);
  const hiddenColumnCount = useHiddenColumnCount();
  // A dataset change resets the active tab to EXPLORE_NO_TAB_ID while the logs table stays on
  // screen, so an empty id means logs here just as it does in detectAndSetOptimalTab.
  const isLogsTab = (currentTab || EXPLORE_LOGS_TAB_ID) === EXPLORE_LOGS_TAB_ID;
  const shouldShowAddToDashboardButton =
    currentTab !== EXPLORE_PATTERNS_TAB_ID && currentTab !== EXPLORE_STATISTICS_TAB_ID;
  const shouldShowExportButton =
    currentTab !== EXPLORE_PATTERNS_TAB_ID && currentTab !== EXPLORE_STATISTICS_TAB_ID;
  const showTabSpecificSettings = currentTab === EXPLORE_PATTERNS_TAB_ID;
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
        {/* Result count sits at the start of the row and the actions collapse to the end, so the
            two read as a single set of controls for the table beneath them. */}
        <EuiFlexGroup
          alignItems="center"
          direction="row"
          gutterSize="s"
          justifyContent="spaceBetween"
        >
          <EuiFlexItem grow={false}>
            <HitsCounter
              hits={hits}
              bucketCount={bucketCount}
              showResetButton={showResetButton}
              onResetQuery={resetQuery}
              rows={rows}
              elapsedMs={elapsedMs}
              streaming={streaming}
              rowsCountOverride={rowsCountOverride}
              hiddenColumnCount={isLogsTab ? hiddenColumnCount : 0}
              onShowHiddenColumns={() => dispatch(setHideEmptyFields(false))}
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
            <EuiFlexGroup alignItems="center" direction="row" gutterSize="s" responsive={false}>
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
              {dataset && rows?.length ? (
                <>
                  {showTabSpecificSettings && (
                    <EuiFlexItem grow={false}>
                      <PatternsSettingsPopoverButton />
                    </EuiFlexItem>
                  )}
                  {shouldShowExportButton && (
                    <EuiFlexItem grow={false}>
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
                  {/* Table settings sit last so they anchor to the end of the action row,
                      matching the conventional placement for data table management. */}
                  {isLogsTab && (
                    <EuiFlexItem grow={false}>
                      <TableActionsPopoverButton />
                    </EuiFlexItem>
                  )}
                </>
              ) : null}
            </EuiFlexGroup>
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

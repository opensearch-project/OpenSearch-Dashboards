/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './error_guard.scss';

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiCodeBlock,
  EuiEmptyPrompt,
  EuiErrorBoundary,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSelect,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/plugins/data_explorer/public';
import { TabDefinition } from '../../../services/tab_registry/tab_registry_service';
import {
  defaultPrepareQueryString,
  executeQueries,
} from '../../../application/utils/state_management/actions/query_actions';
import { clearQueryStatusMapByKey } from '../../../application/utils/state_management/slices';
import { setPatternsField } from '../../../application/utils/state_management/slices/tab/tab_slice';
import { selectPatternsField } from '../../../application/utils/state_management/selectors';
import { useDatasetContext } from '../../../application/context/dataset_context/dataset_context';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { gatherOptions } from '../action_bar/patterns_settings/patterns_settings_popover_content';

const detailsText = i18n.translate('explore.patternsErrorPanel.details', {
  defaultMessage: 'Details',
});
const noValidPatternsText = i18n.translate('explore.patternsErrorPanel.noValidPatterns', {
  defaultMessage: 'No valid patterns found',
});
const tryDifferentFieldText = i18n.translate('explore.patternsErrorPanel.tryDifferentField', {
  defaultMessage: 'Try selecting a different field to analyze patterns:',
});

export interface PatternsErrorGuardProps {
  registryTab: TabDefinition;
}

export const PatternsErrorGuard = ({ registryTab }: PatternsErrorGuardProps) => {
  const dispatch = useDispatch();
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const query = useSelector((state: RootState) => state.query);
  const patternsField = useSelector(selectPatternsField);
  const { dataset } = useDatasetContext();
  const prepareQuery = registryTab.prepareQuery || defaultPrepareQueryString;
  const patternsQuery = prepareQuery(query);

  const options = gatherOptions(dataset);

  return (
    <EuiErrorBoundary>
      <EuiEmptyPrompt
        iconType="editorCodeBlock"
        iconColor="default"
        title={
          <EuiText size="s">
            <h2>{noValidPatternsText}</h2>
          </EuiText>
        }
        body={
          <EuiFlexGroup direction="column" gutterSize="xs">
            <EuiFlexItem grow={false}>
              <EuiText size="s" textAlign="left">
                <b>{detailsText}</b>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiCodeBlock isCopyable={true}>{patternsQuery}</EuiCodeBlock>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSpacer size="m" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="s" textAlign="left">
                <b>{tryDifferentFieldText}</b>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSelect
                options={options}
                value={patternsField}
                onChange={(e) => {
                  // Clear the error for the current (old) cache key so the error guard
                  // re-evaluates once the new query completes
                  dispatch(clearQueryStatusMapByKey(patternsQuery));
                  dispatch(setPatternsField(e.target.value));
                  Promise.resolve().then(() => {
                    // Trigger query execution to reload the patterns tab
                    if (services) {
                      dispatch(executeQueries({ services }));
                    }
                  });
                }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        }
      />
    </EuiErrorBoundary>
  );
};

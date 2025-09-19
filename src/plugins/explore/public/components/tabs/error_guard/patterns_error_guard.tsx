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
  EuiText,
} from '@elastic/eui';
import { useSelector } from 'react-redux';
import { RootState } from 'src/plugins/data_explorer/public';
import { TabDefinition } from '../../../services/tab_registry/tab_registry_service';
import { defaultPrepareQueryString } from '../../../application/utils/state_management/actions/query_actions';

const detailsText = i18n.translate('explore.patternsErrorPanel.details', {
  defaultMessage: 'Details',
});
const noValidPatternsText = i18n.translate('explore.patternsErrorPanel.noValidPatterns', {
  defaultMessage: 'No valid patterns found',
});

export interface PatternsErrorGuardProps {
  registryTab: TabDefinition;
}

export const PatternsErrorGuard = ({ registryTab }: PatternsErrorGuardProps) => {
  const query = useSelector((state: RootState) => state.query);
  const prepareQuery = registryTab.prepareQuery || defaultPrepareQueryString;
  const patternsQuery = prepareQuery(query);

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
          </EuiFlexGroup>
        }
      />
    </EuiErrorBoundary>
  );
};

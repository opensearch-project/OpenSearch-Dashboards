/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './error_guard.scss';

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiAccordion,
  EuiErrorBoundary,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiText,
} from '@elastic/eui';
import { useSelector } from 'react-redux';
import { RootState } from 'src/plugins/data_explorer/public';
import { ErrorCodeBlock } from './error_code_block';
import { TabDefinition } from '../../../services/tab_registry/tab_registry_service';
import { defaultPrepareQueryString } from '../../../application/utils/state_management/actions/query_actions';

const detailsText = i18n.translate('explore.patternsErrorPanel.details', {
  defaultMessage: 'Details (pattern query attempted)',
});
const noValidPatternsText = i18n.translate('explore.patternsErrorPanel.noValidPatterns', {
  defaultMessage: 'No valid pattern found',
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
      <EuiFlexGroup
        direction="column"
        alignItems="center"
        className="exploreErrorGuard"
        gutterSize="l"
      >
        <EuiFlexItem grow={false}>
          <EuiAccordion
            id={'no_valid_patterns'}
            buttonContent={
              <EuiFlexGroup direction="row" alignItems="center" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiIcon type={'navInfo'} />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText>{noValidPatternsText}</EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            }
          >
            <div className="exploreErrorGuard__errorsSection">
              <ErrorCodeBlock title={detailsText} text={patternsQuery} />
            </div>
          </EuiAccordion>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiErrorBoundary>
  );
};

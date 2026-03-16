/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import './patterns_table_flyout.scss';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiCallOut,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { usePatternsFlyoutContext } from './patterns_flyout_context';
import { PatternsFlyoutUpdateSearch } from './patterns_flyout_update_search';
import { PatternsFlyoutEventTable } from './patterns_flyout_event_table';

export interface PatternsFlyoutRecord {
  pattern: string;
  count: number;
  sample: string[];
}

export const PatternsTableFlyout = () => {
  const { patternsFlyoutData: record, closePatternsTableFlyout } = usePatternsFlyoutContext();

  return (
    <EuiFlyout onClose={closePatternsTableFlyout}>
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiTitle size="m">
              <h2>
                {i18n.translate('explore.patterns.flyout.headerTitle', {
                  defaultMessage: 'Inspect pattern',
                })}
              </h2>
            </EuiTitle>
          </EuiFlexItem>
          {record && (
            <EuiFlexItem grow={false} style={{ marginRight: 24 }}>
              <PatternsFlyoutUpdateSearch patternString={record.pattern} />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <div className="patternsTableFlyout__bodyContent">
          {!record ? (
            <EuiCallOut
              title={i18n.translate('explore.patterns.flyout.noDataTitle', {
                defaultMessage: 'No pattern data available for this row',
              })}
              color="danger"
              iconType="alert"
            />
          ) : (
            <>
              <EuiPanel className="patternsTableFlyout__detailsPanel">
                <EuiFlexGroup direction="column" gutterSize="xs">
                  <EuiFlexItem>
                    <EuiText size="s" className="patternsTableFlyout__detailsPanelItem__title">
                      {i18n.translate('explore.patterns.flyout.patternLabel', {
                        defaultMessage: 'Pattern',
                      })}
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size="s">{record.pattern}</EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPanel>
              <EuiSpacer size="m" />
              <EuiPanel className="patternsTableFlyout__eventsPanel">
                <EuiTitle size="s">
                  <h3>
                    {i18n.translate('explore.patterns.flyout.eventsPanelTitle', {
                      defaultMessage: 'Events ({count})',
                      values: { count: record.count },
                    })}
                  </h3>
                </EuiTitle>
                <EuiSpacer size="s" />
                <div className="patternsTableFlyout__eventsTableWrapper">
                  <PatternsFlyoutEventTable
                    patternString={record.pattern}
                    totalItemCount={record.count}
                  />
                </div>
              </EuiPanel>
            </>
          )}
        </div>
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};

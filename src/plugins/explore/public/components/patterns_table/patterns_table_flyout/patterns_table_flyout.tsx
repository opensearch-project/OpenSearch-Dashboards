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
        <EuiTitle size="m">
          <h2>
            {i18n.translate('explore.patterns.flyout.headerTitle', {
              defaultMessage: 'Inspect pattern',
            })}
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
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
            <EuiFlexGroup justifyContent="flexEnd">
              <EuiFlexItem grow={false}>
                <PatternsFlyoutUpdateSearch patternString={record.pattern} />
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="m" />
            <EuiPanel>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiFlexGroup direction="column" gutterSize="xs">
                    <EuiFlexItem grow={false}>
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
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiFlexGroup direction="column" gutterSize="xs">
                    <EuiFlexItem grow={false}>
                      <EuiText size="s" className="patternsTableFlyout__detailsPanelItem__title">
                        {i18n.translate('explore.patterns.flyout.countLabel', {
                          defaultMessage: 'Event count',
                        })}
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiText size="s">{record.count}</EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
            <EuiSpacer size="m" />
            <EuiPanel>
              <EuiTitle size="s">
                <h3>
                  {i18n.translate('explore.patterns.flyout.eventsPanelTitle', {
                    defaultMessage: 'Events ({count})',
                    values: { count: record.count },
                  })}
                </h3>
              </EuiTitle>
              <EuiSpacer size="s" />
              <PatternsFlyoutEventTable
                patternString={record.pattern}
                totalItemCount={record.count}
              />
            </EuiPanel>
          </>
        )}
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};
